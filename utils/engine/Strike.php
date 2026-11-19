<?php
// Strikes (GAME_RULES §9) — artillery / air / missiles / nuclear. Strikes never
// capture land: they lower defence (destroying units cheapest-first, then the
// garrison via territories.damage) or, for nukes, devastate the target.
require_once __DIR__ . '/GameConfig.php';
require_once __DIR__ . '/Movement.php';
require_once __DIR__ . '/Combat.php';
require_once __DIR__ . '/Diplomacy.php';
require_once __DIR__ . '/Economy.php';
require_once __DIR__ . '/Arsenal.php';
require_once __DIR__ . '/Research.php';

final class Strike {

    private static function err(string $m): array { return ['ok' => false, 'message' => $m]; }

    /**
     * Execute a strike. Appends events to $events and returns {ok, message?, data?}.
     * $fromArmyId is required for artillery/air (the firing stack); missiles/nukes
     * fire from the capital. $allowRetaliation guards the nuclear cascade.
     */
    public static function execute(DB $db, array $match, array $attacker, string $kind, string $target,
                                   ?int $fromArmyId, array &$events, bool $allowRetaliation = true): array {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];
        $pid     = (int)$attacker['id'];
        $target  = strtoupper(substr($target, 0, 3));

        $cfg = GameConfig::STRIKES[$kind] ?? null;
        if (!$cfg) return self::err('Unknown strike type.');

        $terr = $db->selectOne("SELECT * FROM `territories` WHERE `match_id`=? AND `country_code`=?", [$matchId, $target], 'is');
        if (!$terr) return self::err('Unknown target.');
        $country = $db->selectOne("SELECT * FROM `countries` WHERE `code`=?", [$target], 's');
        if (!$country) return self::err('Unknown target.');

        $owner = $terr['owner'] !== null ? (int)$terr['owner'] : null;
        if ($owner === $pid) return self::err('You can’t strike your own land.');

        // War/truce rules (neutral targets need no declaration) — reuse attackBlock.
        $block = Movement::attackBlock($db, $matchId, $pid, $target, $tick);
        if ($block === 'allied') return self::err('You are allied with ' . Movement::playerLandName($db, $matchId, $owner) . '.');
        if ($block !== null)     return self::err($block);

        if ($kind === 'nuclear') {
            return self::nuclear($db, $match, $attacker, $target, $terr, $country, $owner, $events, $allowRetaliation);
        }

        // ---- Missile strikes (fire from the capital, consume a stocked item) ----
        if (isset($cfg['item'])) {
            $cap = $attacker['country_code'];
            if ($cfg['range'] !== 'global') {
                $d = Movement::km($db, $cap, $target);
                if ($d > (float)$cfg['range']) {
                    return self::err(sprintf('Out of range: %s is %.0f km from your capital (max %d km).',
                        Movement::cname($db, $target), $d, (int)$cfg['range']));
                }
            }
            if (!Arsenal::consume($db, $matchId, $pid, $cfg['item'])) {
                return self::err('No ' . (GameConfig::ARSENAL[$cfg['item']]['name'] ?? $cfg['item']) . ' in stock.');
            }
            $R = abs((int)$cfg['def']);
            $dmg = self::applyDefenceDamage($db, $matchId, $pid, $target, $R);
            $events[] = ['type' => 'strike', 'data' => [
                'kind' => $kind, 'by' => $pid, 'target' => $target,
                'def_removed' => $R, 'units_destroyed' => $dmg['units_destroyed'], 'garrison_damage' => $dmg['damage_added'],
            ]];
            return ['ok' => true, 'data' => ['kind' => $kind, 'target' => $target] + $dmg];
        }

        // ---- Unit strikes (artillery barrage, air strike) ----
        $needUnit = $cfg['needs_unit'];
        if ($fromArmyId === null) return self::err('Choose a stack to strike from.');
        $army = $db->selectOne("SELECT * FROM `armies` WHERE `id`=? AND `match_id`=? AND `player`=?", [$fromArmyId, $matchId, $pid], 'iii');
        if (!$army) return self::err('That stack isn’t yours.');
        if ($army['moving_to'] !== null) return self::err('That stack is on the move.');
        $units = Combat::units($army);
        $guns  = (int)($units[$needUnit] ?? 0);
        if ($guns <= 0) return self::err('That stack has no ' . $needUnit . '.');
        if ($army['last_strike_tick'] !== null && (int)$army['last_strike_tick'] >= $tick) {
            return self::err('That stack has already struck this turn.');
        }
        if ($kind === 'air' && Economy::isGrounded($db, $matchId, $pid)) {
            return self::err('Grounded: no oil to fly.');
        }

        $from = $army['country_code'];
        if ($cfg['range'] === 'border') {
            $isN = $db->selectOne("SELECT 1 FROM `country_neighbors` WHERE `country`=? AND `neighbor`=?", [$from, $target], 'ss');
            if (!$isN) return self::err(Movement::cname($db, $from) . ' doesn’t border ' . Movement::cname($db, $target) . '.');
        } else {
            $d = Movement::km($db, $from, $target);
            if ($d > (float)$cfg['range']) {
                return self::err(sprintf('Out of range: %.0f km (max %d km).', $d, (int)$cfg['range']));
            }
        }

        // Cost: per gun / per plane.
        $costRes = array_key_first($cfg['cost']);
        $costAmt = (float)$cfg['cost'][$costRes] * $guns;
        if ((float)($attacker[$costRes] ?? 0) < $costAmt) return self::err('Not enough ' . $costRes . '.');
        $db->execute("UPDATE `match_players` SET `$costRes`=`$costRes`-? WHERE `id`=?", [$costAmt, $pid], 'di');

        // Air plane loss uses the BASE garrison (before strike damage).
        $planeLoss = 0;
        if ($kind === 'air') {
            $baseGarr = self::baseGarrison($terr, $country, $tick);
            if ($baseGarr > (int)$cfg['plane_loss_garrison']) {
                $planeLoss = max(1, (int)round($guns * (float)$cfg['plane_loss']));
                $left = max(0, $guns - $planeLoss);
                if ($left > 0) $units['air'] = $left; else unset($units['air']);
                if (array_sum($units) === 0) {
                    $db->execute("DELETE FROM `armies` WHERE `id`=?", [$fromArmyId], 'i');
                } else {
                    $db->execute("UPDATE `armies` SET `units`=? WHERE `id`=?", [json_encode($units), $fromArmyId], 'si');
                }
            }
        }

        $R = abs((int)$cfg['def']) * $guns;
        $dmg = self::applyDefenceDamage($db, $matchId, $pid, $target, $R);

        // Stamp cooldown (unless the air stack was wiped by losses).
        $still = $db->selectOne("SELECT `id` FROM `armies` WHERE `id`=?", [$fromArmyId], 'i');
        if ($still) $db->execute("UPDATE `armies` SET `last_strike_tick`=? WHERE `id`=?", [$tick, $fromArmyId], 'ii');

        $events[] = ['type' => 'strike', 'data' => [
            'kind' => $kind, 'by' => $pid, 'from' => $from, 'target' => $target, 'guns' => $guns,
            'def_removed' => $R, 'units_destroyed' => $dmg['units_destroyed'],
            'garrison_damage' => $dmg['damage_added'], 'plane_loss' => $planeLoss,
        ]];
        return ['ok' => true, 'data' => ['kind' => $kind, 'target' => $target, 'plane_loss' => $planeLoss] + $dmg];
    }

    /**
     * Apply $R points of defence reduction to a target: destroy whole defending
     * units cheapest-by-defence first (def > 0 only), then add the remainder to
     * `territories.damage`. Returns {units_destroyed, damage_added}.
     */
    private static function applyDefenceDamage(DB $db, int $matchId, int $attacker, string $target, int $R): array {
        $destroyed = 0;

        // Defenders: stationed stacks at the target not belonging to the attacker or its allies.
        $defArmies = $db->select(
            "SELECT * FROM `armies` WHERE `match_id`=? AND `country_code`=? AND `moving_to` IS NULL AND `player`<>?",
            [$matchId, $target, $attacker], 'isi'
        ) ?: [];

        // Flatten to [armyId => [type => count]] and build a def-sorted worklist.
        $worklist = [];   // entries: ['army'=>id, 'type'=>t, 'def'=>d, 'count'=>c]
        $stacks   = [];   // id => units map (mutated as we destroy)
        foreach ($defArmies as $d) {
            $did = (int)$d['id'];
            if (Diplomacy::areAllied($db, $matchId, $attacker, (int)$d['player'])) continue;
            $u = Combat::units($d);
            $stacks[$did] = $u;
            foreach ($u as $t => $c) {
                $uc = GameConfig::unit((string)$t);
                $def = $uc ? (int)$uc['defence'] : 0;
                if ($def <= 0) continue;                 // def-0 units don't absorb a defence strike
                $worklist[] = ['army' => $did, 'type' => (string)$t, 'def' => $def, 'count' => (int)$c];
            }
        }
        usort($worklist, fn($a, $b) => $a['def'] <=> $b['def']);   // cheapest by defence first

        foreach ($worklist as $w) {
            if ($R <= 0) break;
            if ($w['def'] > $R) break;                   // ascending: nothing cheaper remains
            $n = min($w['count'], intdiv($R, $w['def']));
            if ($n <= 0) continue;
            $R -= $n * $w['def'];
            $destroyed += $n;
            $stacks[$w['army']][$w['type']] = max(0, (int)$stacks[$w['army']][$w['type']] - $n);
        }

        // Persist stack changes.
        foreach ($stacks as $id => $u) {
            $clean = [];
            foreach ($u as $t => $c) { if ((int)$c > 0) $clean[$t] = (int)$c; }
            if (!$clean) $db->execute("DELETE FROM `armies` WHERE `id`=?", [$id], 'i');
            else         $db->execute("UPDATE `armies` SET `units`=? WHERE `id`=?", [json_encode($clean), $id], 'si');
        }

        // Remainder lowers the garrison / militia (recovers 10%/day via Tick... §4).
        $damageAdded = max(0, $R);
        if ($damageAdded > 0) {
            $db->execute(
                "UPDATE `territories` SET `damage`=`damage`+? WHERE `match_id`=? AND `country_code`=?",
                [$damageAdded, $matchId, $target], 'iis'
            );
        }
        return ['units_destroyed' => $destroyed, 'damage_added' => $damageAdded];
    }

    /** Base garrison (neutral/militia/occupied) BEFORE strike damage. */
    private static function baseGarrison(array $terr, array $country, int $tick): int {
        $popM  = (float)$country['start_pop'] * GameConfig::POP_SCALE;
        $slots = (int)$country['land_slots'];
        $owner = $terr['owner'] !== null ? (int)$terr['owner'] : null;
        $occupied = $terr['occupied_until'] !== null && (int)$terr['occupied_until'] > $tick;
        if ($owner === null) return GameConfig::neutralGarrison($popM, $slots);
        if ($occupied)       return 0;
        return GameConfig::militia($popM, $slots);
    }

    /**
     * Nuclear strike (GAME_RULES §9): destroy all units + buildings in the target,
     * kill 40% of the owner's population, ruin the land for 20 days, let non-allied
     * AI declare war, and trigger immediate retaliation (AI fires back automatically;
     * a human gets a 1-tick `retaliate_prompt`). $allowRetaliation stops the cascade.
     */
    private static function nuclear(DB $db, array $match, array $attacker, string $target, array $terr,
                                    array $country, ?int $owner, array &$events, bool $allowRetaliation): array {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];
        $pid     = (int)$attacker['id'];

        if (!Arsenal::consume($db, $matchId, $pid, 'warhead')) return self::err('No warhead in stock.');

        // Devastation: every stationed stack and every building in the target.
        $db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `country_code`=? AND `moving_to` IS NULL", [$matchId, $target], 'is');
        $db->execute("DELETE FROM `buildings` WHERE `match_id`=? AND `country_code`=?", [$matchId, $target], 'is');

        if ($owner !== null) {
            $db->execute("UPDATE `match_players` SET `pop`=FLOOR(`pop`*?) WHERE `id`=?", [1 - GameConfig::NUKE_POP_KILL, $owner], 'di');
        }
        $db->execute("UPDATE `territories` SET `ruined_until`=?, `damage`=0 WHERE `id`=?",
            [$tick + GameConfig::NUKE_RUINED_DAYS, (int)$terr['id']], 'ii');

        $others = $db->select("SELECT * FROM `match_players` WHERE `match_id`=? AND `status`='active' AND `id`<>?", [$matchId, $pid], 'ii') ?: [];

        // Non-allied AI declare war immediately (ignoring truces).
        $wars = [];
        foreach ($others as $o) {
            $oid = (int)$o['id'];
            if (Diplomacy::areAllied($db, $matchId, $pid, $oid)) continue;
            if ((int)$o['is_ai'] === 1 && !Diplomacy::atWar($db, $matchId, $pid, $oid)) {
                Diplomacy::set($db, $matchId, $pid, $oid, 'war');
                $wars[] = $oid;
            }
        }

        // Retaliation by target-side warhead holders (owner + its allies).
        $retaliators = [];
        if ($allowRetaliation && $owner !== null) {
            $side = [$owner];
            foreach ($others as $o) {
                $oid = (int)$o['id'];
                if ($oid !== $owner && Diplomacy::areAllied($db, $matchId, $owner, $oid)) $side[] = $oid;
            }
            $attackerCap = $attacker['country_code'];
            foreach (array_unique($side) as $rid) {
                if ($rid === $pid) continue;
                if (Arsenal::stock($db, $matchId, $rid, 'warhead') <= 0) continue;
                $rp = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$rid], 'i');
                if (!$rp || $rp['status'] !== 'active') continue;
                if ((int)$rp['is_ai'] === 1) {
                    // AI fires back on the attacker's capital now, with no further cascade.
                    self::execute($db, $match, $rp, 'nuclear', $attackerCap, null, $events, false);
                    $retaliators[] = ['player' => $rid, 'auto' => true];
                } else {
                    $events[] = ['type' => 'retaliate_prompt', 'data' => [
                        'player' => $rid, 'attacker' => $pid, 'attacker_capital' => $attackerCap, 'expires_tick' => $tick + 1,
                    ]];
                    $retaliators[] = ['player' => $rid, 'auto' => false];
                }
            }
        }

        $events[] = ['type' => 'nuclear_strike', 'data' => [
            'by' => $pid, 'target' => $target, 'owner' => $owner,
            'wars_declared' => $wars, 'retaliators' => array_column($retaliators, 'player'),
        ]];
        return ['ok' => true, 'data' => [
            'kind' => 'nuclear', 'target' => $target, 'owner' => $owner,
            'wars_declared' => $wars, 'retaliators' => $retaliators,
        ]];
    }
}
