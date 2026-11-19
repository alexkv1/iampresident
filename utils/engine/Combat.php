<?php
// Resolves army movement arrivals and battles for one tick (GAME_RULES §3).
// Reproduces the mockup's resolve() in MatchHud.jsx so the server is authoritative.
require_once __DIR__ . '/Movement.php';

final class Combat {

    /**
     * Combat RNG: returns the U(RNG_LO, RNG_HI) multiplier applied to A and D.
     * Default is mt_rand-based. Tests call setRng() to force a deterministic value
     * (e.g. 1.0 on both sides). Set back to null to restore randomness.
     */
    private static $rng = null;

    /** Force the combat roll. $fn() must return a float in [RNG_LO, RNG_HI]. */
    public static function setRng(?callable $fn): void { self::$rng = $fn; }

    /** One combat roll in [RNG_LO, RNG_HI]. */
    public static function roll(): float {
        if (self::$rng !== null) return (float)(self::$rng)();
        $lo = GameConfig::RNG_LO; $hi = GameConfig::RNG_HI;
        return $lo + ($hi - $lo) * (mt_rand() / mt_getrandmax());
    }

    /** Decode an armies.units JSON column to an assoc map, dropping zero/empty. */
    public static function units(array $army): array {
        $u = $army['units'] ?? null;
        if (is_string($u)) $u = json_decode($u, true);
        if (!is_array($u)) $u = [];
        $out = [];
        foreach ($u as $k => $c) { if ((int)$c > 0) $out[(string)$k] = (int)$c; }
        return $out;
    }

    /** Attack strength over LAND units only (navy/air have attack 0). */
    public static function attackStrength(array $units): float {
        $s = 0.0;
        foreach ($units as $k => $c) {
            $u = GameConfig::unit((string)$k);
            if ($u) $s += (int)$c * (int)$u['attack'];
        }
        return $s;
    }

    /** Defence strength over all unit types (navy/air have defence 0). */
    public static function defenceStrength(array $units): float {
        $s = 0.0;
        foreach ($units as $k => $c) {
            $u = GameConfig::unit((string)$k);
            if ($u) $s += (int)$c * (int)$u['defence'];
        }
        return $s;
    }

    /**
     * Scale a units map by factor $f (mockup scaleUnits): floor each type; if the
     * whole stack would be empty and $keepOne, keep one of the first present type.
     * Returns null if the stack is wiped out (and !$keepOne).
     */
    public static function scaleUnits(array $units, float $f, bool $keepOne): ?array {
        $out = []; $n = 0;
        foreach ($units as $k => $c) {
            $v = (int)floor((int)$c * $f);
            $out[$k] = $v; $n += $v;
        }
        if ($n === 0 && $keepOne) {
            foreach ($units as $k => $c) { if ((int)$c > 0) { $out[$k] = 1; $n = 1; break; } }
        }
        if ($n === 0) return null;
        // Drop zero entries for a clean JSON blob.
        $clean = [];
        foreach ($out as $k => $v) { if ($v > 0) $clean[$k] = $v; }
        return $clean;
    }

    /** Merge two unit maps (mockup mergeUnits). */
    public static function mergeUnits(array $a, array $b): array {
        $o = $a;
        foreach ($b as $k => $c) { $o[$k] = (int)($o[$k] ?? 0) + (int)$c; }
        return $o;
    }

    /**
     * Garrison for a country as a defender base (GAME_RULES §4):
     *  - neutral  -> full neutral garrison
     *  - owned    -> militia (half); occupied -> 0
     * then minus territories.damage, floored at 0.
     */
    public static function garrisonOf(DB $db, array $terr, array $country, int $currentTick): int {
        $popM  = (float)$country['start_pop'] * GameConfig::POP_SCALE;
        $slots = (int)$country['land_slots'];
        $owner = $terr['owner'] !== null ? (int)$terr['owner'] : null;
        $occupied = $terr['occupied_until'] !== null && (int)$terr['occupied_until'] > $currentTick;

        if ($owner === null) {
            $base = GameConfig::neutralGarrison($popM, $slots);
        } elseif ($occupied) {
            $base = 0;
        } else {
            $base = GameConfig::militia($popM, $slots);
        }
        $dmg = (int)($terr['damage'] ?? 0);
        return max(0, $base - $dmg);
    }

    /** Process every army whose movement completes on/before the current tick. */
    public static function resolveArrivals(DB $db, array $match, array &$events): void {
        $matchId = (int)$match['id'];
        $tick = (int)$match['current_tick'];

        $arriving = $db->select(
            "SELECT * FROM `armies`
              WHERE `match_id` = ? AND `moving_to` IS NOT NULL AND `arrive_at_tick` <= ?",
            [$matchId, $tick], 'ii'
        ) ?: [];
        if (!$arriving) return;

        foreach ($arriving as $army) {
            $dest     = $army['moving_to'];
            $attacker = (int)$army['player'];
            $kind     = $army['kind'] ?: 'land';
            $origin   = $army['origin'] ?: $army['country_code'];
            $path     = is_string($army['path']) ? json_decode($army['path'], true) : ($army['path'] ?? null);
            $atkUnits = self::units($army);

            // Land the stack: it is no longer in transit.
            $db->execute(
                "UPDATE `armies`
                    SET `country_code` = ?, `moving_to` = NULL, `arrive_at_tick` = NULL,
                        `path` = NULL, `depart_tick` = NULL
                  WHERE `id` = ?",
                [$dest, (int)$army['id']], 'si'
            );

            $terr = $db->selectOne(
                "SELECT * FROM `territories` WHERE `match_id` = ? AND `country_code` = ?",
                [$matchId, $dest], 'is'
            );
            if (!$terr) continue;
            $country = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$dest], 's');
            if (!$country) continue;
            $owner = $terr['owner'] !== null ? (int)$terr['owner'] : null;

            // Own land, or an ally's land -> merge / reinforce, no battle.
            if ($owner === $attacker ||
                ($owner !== null && Diplomacy::areAllied($db, $matchId, $attacker, $owner))) {
                self::settle($db, $matchId, $attacker, $dest, $atkUnits, (int)$army['id'], $origin);
                $events[] = ['type' => 'reinforced', 'data' => [
                    'country' => $dest, 'player' => $attacker,
                ]];
                continue;
            }

            // ---- Battle (GAME_RULES §3) ----------------------------------------
            // Defenders: stationed stacks at dest not belonging to attacker or allies.
            $defArmies = $db->select(
                "SELECT * FROM `armies`
                  WHERE `match_id` = ? AND `country_code` = ? AND `moving_to` IS NULL
                    AND `player` <> ? AND `id` <> ?",
                [$matchId, $dest, $attacker, (int)$army['id']], 'isii'
            ) ?: [];
            $defenders = [];
            foreach ($defArmies as $d) {
                if ($owner !== null && Diplomacy::areAllied($db, $matchId, $attacker, (int)$d['player'])) continue;
                $defenders[] = $d;
            }

            $garrison = self::garrisonOf($db, $terr, $country, $tick);
            $defUnitSum = 0.0;
            foreach ($defenders as $d) $defUnitSum += self::defenceStrength(self::units($d));

            $terrainMult = GameConfig::terrainMult($country['terrain'] ?? 'plains');

            $A = self::attackStrength($atkUnits);
            if ($kind === 'sea') $A *= GameConfig::AMPHIB_MULT;
            $D = ($garrison + $defUnitSum) * GameConfig::DEFENDER_BONUS * $terrainMult;

            $Ap = $A * self::roll();
            $Dp = max(0.01, $D * self::roll());

            if ($Ap > $Dp) {
                // Attacker wins: destroy defenders, take the territory, enter occupation.
                foreach ($defenders as $d) {
                    $db->execute("DELETE FROM `armies` WHERE `id` = ?", [(int)$d['id']], 'i');
                }
                $lossFrac = min(0.6, 0.4 * $Dp / $Ap);
                $surv = self::scaleUnits($atkUnits, 1 - $lossFrac, true); // keep the stack alive
                self::settle($db, $matchId, $attacker, $dest, $surv ?? [], (int)$army['id'], $origin);

                $db->execute(
                    "UPDATE `territories`
                        SET `owner` = ?, `occupied_until` = ?, `prev_owner` = ?, `unrest` = 0
                      WHERE `id` = ?",
                    [$attacker, $tick + GameConfig::OCCUPATION_DAYS,
                     $owner, (int)$terr['id']],
                    'iiii'
                );

                $events[] = ['type' => 'conquest', 'data' => [
                    'country' => $dest, 'to' => $attacker, 'from' => $owner,
                ]];
                $events[] = ['type' => 'battle_won', 'data' => [
                    'country' => $dest, 'attacker' => $attacker, 'defender' => $owner,
                ]];
                if ($owner !== null) self::checkDefeat($db, $matchId, $owner, $events);
            } else {
                // Defender holds.
                $lossFrac = 0.5 + 0.4 * (1 - $Ap / $Dp);
                $surv = self::scaleUnits($atkUnits, 1 - $lossFrac, false);

                // Each defending stack loses 0.3 * A'/D' (keep ≥1 — garrison untouched).
                $defLoss = 0.3 * $Ap / $Dp;
                foreach ($defenders as $d) {
                    $du = self::scaleUnits(self::units($d), 1 - $defLoss, true);
                    if ($du === null) {
                        $db->execute("DELETE FROM `armies` WHERE `id` = ?", [(int)$d['id']], 'i');
                    } else {
                        $db->execute("UPDATE `armies` SET `units` = ? WHERE `id` = ?",
                            [json_encode($du), (int)$d['id']], 'si');
                    }
                }

                if ($surv === null) {
                    // Wiped out — remove the attacking stack.
                    $db->execute("DELETE FROM `armies` WHERE `id` = ?", [(int)$army['id']], 'i');
                } else {
                    // Survivors march home by the same path.
                    self::retreat($db, $matchId, (int)$army['id'], $surv, $dest, $origin, $kind, $path, $tick);
                }

                $events[] = ['type' => 'battle_repelled', 'data' => [
                    'country' => $dest, 'attacker' => $attacker, 'defender' => $owner,
                ]];
                $events[] = ['type' => 'battle_lost', 'data' => [
                    'country' => $dest, 'attacker' => $attacker, 'defender' => $owner,
                ]];
            }
        }
    }

    /**
     * Land a stack at a country: merge into an existing stationed stack of the same
     * owner if one exists (mockup settle), otherwise keep this row there.
     */
    private static function settle(DB $db, int $matchId, int $player, string $at, array $units, int $rowId, string $origin): void {
        $existing = $db->selectOne(
            "SELECT * FROM `armies`
              WHERE `match_id` = ? AND `country_code` = ? AND `player` = ?
                AND `moving_to` IS NULL AND `id` <> ? LIMIT 1",
            [$matchId, $at, $player, $rowId], 'isii'
        );
        if ($existing) {
            $merged = self::mergeUnits(self::units($existing), $units);
            $db->execute("UPDATE `armies` SET `units` = ? WHERE `id` = ?",
                [json_encode($merged), (int)$existing['id']], 'si');
            $db->execute("DELETE FROM `armies` WHERE `id` = ?", [$rowId], 'i');
        } else {
            $db->execute(
                "UPDATE `armies` SET `units` = ?, `origin` = ?, `kind` = NULL WHERE `id` = ?",
                [json_encode($units), $at, $rowId], 'ssi'
            );
        }
    }

    /** Survivors fall back to their origin by the same path they came (reversed). */
    private static function retreat(DB $db, int $matchId, int $rowId, array $units, string $at, string $origin, string $kind, $path, int $tick): void {
        if ($origin === $at || $origin === '' || $origin === null) {
            // Nowhere to go — stay put, out of transit.
            $db->execute("UPDATE `armies` SET `units` = ?, `country_code` = ?, `moving_to` = NULL,
                          `arrive_at_tick` = NULL, `path` = NULL WHERE `id` = ?",
                [json_encode($units), $at, $rowId], 'ssi');
            return;
        }
        $return = is_array($path) ? array_reverse($path) : [$at, $origin];
        $km = ($kind === 'sea')
            ? Movement::km($db, $at, $origin) * GameConfig::SEA_FACTOR
            : Movement::pathKm($db, $return);
        $speed = ($kind === 'sea') ? GameConfig::SEA_SPEED : Movement::stackSpeed($units);
        $days = Movement::days($km, $speed);
        $db->execute(
            "UPDATE `armies`
                SET `units` = ?, `country_code` = ?, `moving_to` = ?, `path` = ?, `kind` = ?,
                    `origin` = ?, `depart_tick` = ?, `arrive_at_tick` = ?
              WHERE `id` = ?",
            [json_encode($units), $at, $origin, json_encode($return), $kind,
             $origin, $tick, $tick + $days, $rowId],
            'ssssssiii'
        );
    }

    /** Mark a player defeated once they hold no territories. */
    private static function checkDefeat(DB $db, int $matchId, int $player, array &$events): void {
        $held = (int)($db->selectOne(
            "SELECT COUNT(*) c FROM `territories` WHERE `match_id` = ? AND `owner` = ?",
            [$matchId, $player], 'ii'
        )['c'] ?? 0);
        if ($held === 0) {
            $db->execute("UPDATE `match_players` SET `status` = 'defeated' WHERE `id` = ?", [$player], 'i');
            $events[] = ['type' => 'player_defeated', 'data' => ['player' => $player]];
        }
    }
}
