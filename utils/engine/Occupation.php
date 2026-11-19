<?php
// Occupation lifecycle (GAME_RULES §6): unrest, revolt and integration.
// Runs once per tick, after Combat::resolveArrivals has settled this tick's stacks.
require_once __DIR__ . '/GameConfig.php';
require_once __DIR__ . '/Combat.php';

final class Occupation {

    /**
     * Advance every occupied territory in a match by one day (GAME_RULES §6):
     *  - integrate once `occupied_until` is reached (normal rules resume),
     *  - otherwise update unrest (+8 no stack / −10 strong garrison / +2 weak),
     *  - revolt at 100.
     * $match carries the pre-increment `current_tick` (same clock the rest of the
     * tick uses). Emits `integrated` and `revolt` events.
     */
    public static function process(DB $db, array $match, array &$events): void {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];

        $occ = $db->select(
            "SELECT * FROM `territories`
              WHERE `match_id` = ? AND `occupied_until` IS NOT NULL AND `owner` IS NOT NULL",
            [$matchId], 'i'
        ) ?: [];

        foreach ($occ as $terr) {
            $code  = $terr['country_code'];
            $owner = (int)$terr['owner'];
            $until = (int)$terr['occupied_until'];

            // Integration: 10 days elapsed without a revolt -> normal rules resume.
            if ($tick >= $until) {
                $db->execute(
                    "UPDATE `territories` SET `occupied_until` = NULL, `unrest` = 0, `prev_owner` = NULL WHERE `id` = ?",
                    [(int)$terr['id']], 'i'
                );
                $events[] = ['type' => 'integrated', 'data' => ['country' => $code, 'player' => $owner]];
                continue;
            }

            $country = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$code], 's');
            if (!$country) continue;
            $popM     = (float)$country['start_pop'] * GameConfig::POP_SCALE;
            $slots    = (int)$country['land_slots'];
            $baseGarr = GameConfig::neutralGarrison($popM, $slots);

            // Occupier's stationed strength (unit count) in this country.
            $stackCount = 0;
            foreach ($db->select(
                "SELECT `units` FROM `armies`
                  WHERE `match_id`=? AND `player`=? AND `country_code`=? AND `moving_to` IS NULL",
                [$matchId, $owner, $code], 'iis'
            ) ?: [] as $a) {
                foreach (Combat::units($a) as $c) $stackCount += (int)$c;
            }

            // Unrest delta (GAME_RULES §6).
            if ($stackCount === 0) {
                $delta = GameConfig::UNREST_NO_STACK;                 // +8
            } elseif ($stackCount >= $baseGarr / 2) {
                $delta = GameConfig::UNREST_STRONG;                   // −10
            } else {
                $delta = GameConfig::UNREST_WEAK;                     // +2
            }
            $unrest = max(0, min(100, (int)$terr['unrest'] + $delta));

            if ($unrest >= GameConfig::REVOLT_AT) {
                self::revolt($db, $matchId, $terr, $baseGarr, $events);
            } else {
                $db->execute("UPDATE `territories` SET `unrest` = ? WHERE `id` = ?",
                    [$unrest, (int)$terr['id']], 'ii');
            }
        }
    }

    /**
     * A country at 100 unrest revolts (GAME_RULES §6): it returns to its previous
     * owner if alive, otherwise becomes neutral (defended by the full neutral
     * garrison, which `Combat::garrisonOf` yields for neutral land). The occupier's
     * stationed stacks are driven out. Emits `revolt` and may defeat the occupier.
     */
    private static function revolt(DB $db, int $matchId, array $terr, int $baseGarr, array &$events): void {
        $code     = $terr['country_code'];
        $occupier = (int)$terr['owner'];
        $prev     = $terr['prev_owner'] !== null ? (int)$terr['prev_owner'] : null;

        $prevAlive = false;
        if ($prev !== null) {
            $pr = $db->selectOne("SELECT `status` FROM `match_players` WHERE `id`=?", [$prev], 'i');
            $prevAlive = $pr && $pr['status'] === 'active';
        }
        $newOwner = $prevAlive ? $prev : null;    // null => neutral (rebels = full garrison)

        // Rebels drive the occupier's stationed stacks out of the country.
        $db->execute(
            "DELETE FROM `armies`
              WHERE `match_id`=? AND `player`=? AND `country_code`=? AND `moving_to` IS NULL",
            [$matchId, $occupier, $code], 'iis'
        );

        $db->execute(
            "UPDATE `territories`
                SET `owner` = ?, `occupied_until` = NULL, `unrest` = 0, `damage` = 0, `prev_owner` = NULL
              WHERE `id` = ?",
            [$newOwner, (int)$terr['id']], 'ii'   // $newOwner may be null (neutral)
        );

        $events[] = ['type' => 'revolt', 'data' => [
            'country' => $code, 'from' => $occupier, 'to' => $newOwner, 'rebels' => $baseGarr,
        ]];

        // Losing this land may have been the occupier's last territory.
        Combat::checkDefeat($db, $matchId, $occupier, $events);
    }
}
