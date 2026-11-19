<?php
// Fog of war (GAME_RULES §10). Vision = your lands + your allies' lands (shared
// vision) + every country where you or an ally has a stack (stationed or in transit,
// origin and destination) + one border beyond all of those. The server strips
// everything outside vision before sending state to the client.
require_once __DIR__ . '/GameConfig.php';
require_once __DIR__ . '/Combat.php';
require_once __DIR__ . '/Diplomacy.php';

final class Vision {

    /** Player ids on $player's side (self + current allies). */
    public static function side(DB $db, int $matchId, int $player): array {
        $ids = [$player => true];
        foreach ($db->select(
            "SELECT `player_a`,`player_b` FROM `diplomacy`
              WHERE `match_id`=? AND `state`='allied' AND (`player_a`=? OR `player_b`=?)",
            [$matchId, $player, $player], 'iii'
        ) ?: [] as $r) {
            $ids[(int)$r['player_a']] = true;
            $ids[(int)$r['player_b']] = true;
        }
        return array_keys($ids);
    }

    /** Set of visible country codes for a player (as code => true). */
    public static function visible(DB $db, int $matchId, int $player): array {
        $side = self::side($db, $matchId, $player);
        $idList = implode(',', array_map('intval', $side));   // ints from DB, safe to inline

        $seed = [];
        // Own + allied lands.
        foreach ($db->select(
            "SELECT `country_code` FROM `territories` WHERE `match_id`=? AND `owner` IN ($idList)",
            [$matchId], 'i'
        ) ?: [] as $r) $seed[$r['country_code']] = true;

        // Our side's stacks (stationed location + in-transit origin and destination).
        foreach ($db->select(
            "SELECT `country_code`,`moving_to`,`origin` FROM `armies` WHERE `match_id`=? AND `player` IN ($idList)",
            [$matchId], 'i'
        ) ?: [] as $a) {
            if ($a['country_code']) $seed[$a['country_code']] = true;
            if ($a['moving_to'])    $seed[$a['moving_to']]    = true;
            if ($a['origin'])       $seed[$a['origin']]       = true;
        }

        // One border beyond the union of the above.
        $vis = $seed;
        $codes = array_keys($seed);
        if ($codes) {
            $ph = implode(',', array_fill(0, count($codes), '?'));
            foreach ($db->select(
                "SELECT DISTINCT `neighbor` FROM `country_neighbors` WHERE `country` IN ($ph)",
                $codes, str_repeat('s', count($codes))
            ) ?: [] as $n) {
                $vis[$n['neighbor']] = true;
            }
        }
        return $vis;
    }

    /** Can $player (with side $sideSet and vision $visSet) see this army row? */
    public static function canSeeArmy(array $army, array $sideSet, array $visSet): bool {
        if (isset($sideSet[(int)$army['player']])) return true;       // own / allied — always
        // Enemy/other: visible only where it sits or (in transit) its origin/destination.
        if (isset($visSet[$army['country_code']])) return true;
        if ($army['moving_to'] !== null && isset($visSet[$army['moving_to']])) return true;
        return false;
    }

    /** Army rows a player may see (own + allied always; others only within vision). */
    public static function armies(DB $db, int $matchId, int $player): array {
        $sideSet = array_flip(self::side($db, $matchId, $player));
        $visSet  = self::visible($db, $matchId, $player);
        $all = $db->select("SELECT * FROM `armies` WHERE `match_id`=?", [$matchId], 'i') ?: [];
        $out = [];
        foreach ($all as $a) {
            if (self::canSeeArmy($a, $sideSet, $visSet)) $out[] = $a;
        }
        return $out;
    }

    /**
     * Defence per country for the requester (GAME_RULES §10): garrison + friendly
     * stationed defenders. Neutral garrisons are always known; enemy-owned countries
     * outside vision return null ("?"). Returns code => int|null.
     */
    public static function defenceMap(DB $db, int $matchId, int $player, int $tick): array {
        $sideSet = array_flip(self::side($db, $matchId, $player));
        $visSet  = self::visible($db, $matchId, $player);

        // Stationed stacks grouped by country, with each stack's owner + defence.
        $byCountry = [];
        foreach ($db->select(
            "SELECT `country_code`,`player`,`units` FROM `armies` WHERE `match_id`=? AND `moving_to` IS NULL",
            [$matchId], 'i'
        ) ?: [] as $a) {
            $byCountry[$a['country_code']][] = $a;
        }

        $out = [];
        $rows = $db->select(
            "SELECT t.`country_code`, t.`owner`, t.`occupied_until`, t.`damage`,
                    c.`start_pop`, c.`land_slots`, c.`terrain`
               FROM `territories` t JOIN `countries` c ON c.`code` = t.`country_code`
              WHERE t.`match_id`=?",
            [$matchId], 'i'
        ) ?: [];
        foreach ($rows as $t) {
            $code  = $t['country_code'];
            $owner = $t['owner'] !== null ? (int)$t['owner'] : null;

            // Fogged enemy country -> unknown.
            $fogged = $owner !== null && !isset($sideSet[$owner]) && !isset($visSet[$code]);
            if ($fogged) { $out[$code] = null; continue; }

            $garr = Combat::garrisonOf($db, $t, $t, $tick);   // garrisonOf reads start_pop/land_slots/owner/etc.
            $def = $garr;
            foreach (($byCountry[$code] ?? []) as $a) {
                $ap = (int)$a['player'];
                // Count defenders belonging to the owner or the owner's allies.
                if ($owner !== null && ($ap === $owner || Diplomacy::areAllied($db, $matchId, $owner, $ap))) {
                    $def += (int)Combat::defenceStrength(Combat::units($a));
                }
            }
            $out[$code] = (int)$def;
        }
        return $out;
    }
}
