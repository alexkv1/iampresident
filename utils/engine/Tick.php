<?php
// Advances a single match by one tick. Called by worker/tick.php.
// Order: finish construction -> resolve battles -> economy+population -> AI -> victory.

require_once __DIR__ . '/GameConfig.php';
require_once __DIR__ . '/Economy.php';
require_once __DIR__ . '/Population.php';
require_once __DIR__ . '/Build.php';
require_once __DIR__ . '/Diplomacy.php';
require_once __DIR__ . '/Combat.php';
require_once __DIR__ . '/AI.php';
require_once __DIR__ . '/MatchSetup.php';

final class Tick {

    /** Advance one match by one tick. Returns the list of events generated. */
    public static function process(DB $db, array $match): array {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];
        $events  = [];

        // 1) Finish any construction that completes this tick.
        $done = $db->select(
            "SELECT * FROM `buildings` WHERE `match_id` = ? AND `status` = 'building' AND `complete_at_tick` <= ?",
            [$matchId, $tick], 'ii'
        ) ?: [];
        if ($done) {
            $db->execute(
                "UPDATE `buildings` SET `status` = 'active'
                  WHERE `match_id` = ? AND `status` = 'building' AND `complete_at_tick` <= ?",
                [$matchId, $tick], 'ii'
            );
            foreach ($done as $b) {
                $events[] = ['type' => 'build_complete', 'data' => [
                    'player' => (int)$b['player'], 'type' => $b['type'], 'country' => $b['country_code'],
                ]];
            }
        }

        // 2) Resolve army arrivals / battles.
        Combat::resolveArrivals($db, $match, $events);

        // 3) Economy + population for each active player.
        $players = $db->select(
            "SELECT * FROM `match_players` WHERE `match_id` = ? AND `status` = 'active'",
            [$matchId], 'i'
        ) ?: [];

        foreach ($players as $player) {
            $buildings = $db->select(
                "SELECT b.`type`, b.`level`, c.`farmland`, c.`minerals`, c.`oil`
                   FROM `buildings` b
                   JOIN `countries` c ON c.`code` = b.`country_code`
                  WHERE b.`match_id` = ? AND b.`player` = ? AND b.`status` = 'active'",
                [$matchId, $player['id']], 'ii'
            ) ?: [];

            $home = $db->selectOne("SELECT `start_pop` FROM `countries` WHERE `code` = ?", [$player['country_code']], 's');
            $basePopCap = (float)($home['start_pop'] ?? 1_000_000) * GameConfig::BASE_POP_CAP;

            $r = Economy::step($player, $buildings, $basePopCap);
            $stock = $r['stock'];
            $foodRanOut = $stock['food'] < 0;

            // Clamp stockpiles at zero.
            foreach (GameConfig::RESOURCES as $res) $stock[$res] = max(0.0, $stock[$res]);

            $pop = Population::step((float)$player['pop'], $r['food_prod'], $r['food_cons'], $foodRanOut, $r['pop_cap']);

            $db->execute(
                "UPDATE `match_players`
                    SET `pop` = ?, `food` = ?, `energy` = ?, `minerals` = ?, `gold` = ?, `oil` = ?, `research` = ?
                  WHERE `id` = ?",
                [
                    $pop['pop'], $stock['food'], $stock['energy'], $stock['minerals'],
                    $stock['gold'], $stock['oil'], $stock['research'], $player['id'],
                ],
                'iddddddi'
            );
        }

        // 4) AI turns (reload rows so economy updates are visible to the AI).
        $aiPlayers = $db->select(
            "SELECT * FROM `match_players` WHERE `match_id` = ? AND `status` = 'active' AND `is_ai` = 1",
            [$matchId], 'i'
        ) ?: [];
        foreach ($aiPlayers as $ai) {
            AI::act($db, $match, $ai, $events);
        }

        // 5) Advance the clock.
        $interval = max(5, (int)$match['tick_interval_sec']);
        $db->execute(
            "UPDATE `matches`
                SET `current_tick` = `current_tick` + 1,
                    `next_tick_at` = DATE_ADD(NOW(), INTERVAL ? SECOND)
              WHERE `id` = ?",
            [$interval, $matchId], 'ii'
        );

        // 6) Victory check.
        self::checkVictory($db, $matchId, $events);

        // 7) Persist events.
        foreach ($events as $e) {
            $db->execute(
                "INSERT INTO `match_events` (`match_id`, `tick`, `type`, `data`) VALUES (?, ?, ?, ?)",
                [$matchId, $tick + 1, $e['type'], json_encode($e['data'] ?? [])], 'iiss'
            );
        }

        return $events;
    }

    private static function checkVictory(DB $db, int $matchId, array &$events): void {
        $total = (int)($db->selectOne("SELECT COUNT(*) c FROM `countries`")['c'] ?? 0);
        if ($total === 0) return;

        $standings = $db->select(
            "SELECT `owner`, COUNT(*) c FROM `territories`
              WHERE `match_id` = ? AND `owner` IS NOT NULL GROUP BY `owner`",
            [$matchId], 'i'
        ) ?: [];

        $alive = $db->select(
            "SELECT `id` FROM `match_players` WHERE `match_id` = ? AND `status` = 'active'",
            [$matchId], 'i'
        ) ?: [];

        $winner = null;
        foreach ($standings as $s) {
            if ($s['c'] / $total >= GameConfig::DOMINATION_SHARE) { $winner = (int)$s['owner']; break; }
        }
        if ($winner === null && count($alive) === 1) {
            $winner = (int)$alive[0]['id'];
        }

        if ($winner !== null) {
            $db->execute(
                "UPDATE `matches` SET `status` = 'ended', `winner_player` = ?, `date_ended` = NOW() WHERE `id` = ?",
                [$winner, $matchId], 'ii'
            );
            $events[] = ['type' => 'match_ended', 'data' => ['winner' => $winner]];
        }
    }
}
