<?php
// Advances a single match by one tick. Called by worker/tick.php.
// Order: finish construction -> resolve battles -> economy+population -> AI -> victory.

require_once __DIR__ . '/GameConfig.php';
require_once __DIR__ . '/Economy.php';
require_once __DIR__ . '/Population.php';
require_once __DIR__ . '/Build.php';
require_once __DIR__ . '/Diplomacy.php';
require_once __DIR__ . '/Combat.php';
require_once __DIR__ . '/Occupation.php';
require_once __DIR__ . '/Training.php';
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

        // 1b) Complete any training batches due this tick (before combat, so fresh
        //     units can defend the same tick they arrive).
        Training::complete($db, $match, $events);

        // 2) Resolve army arrivals / battles.
        Combat::resolveArrivals($db, $match, $events);

        // 2b) Occupation lifecycle: unrest, revolt, integration (GAME_RULES §6).
        Occupation::process($db, $match, $events);

        // 2c) Diplomacy upkeep: expire stale proposals, end elapsed truces (§7).
        Diplomacy::maintain($db, $match, $events);

        // 3) Economy + population for each active player. Army upkeep is charged
        //    BEFORE production (GAME_RULES §1); desertion/grounding follow.
        $players = $db->select(
            "SELECT * FROM `match_players` WHERE `match_id` = ? AND `status` = 'active'",
            [$matchId], 'i'
        ) ?: [];

        foreach ($players as $player) {
            // --- War economy: upkeep, desertion, oil grounding (GAME_RULES §1, §5) ---
            self::chargeUpkeep($db, $match, $player, $events);
            // Reload stockpiles the economy step builds on (upkeep mutated them).
            $player = $db->selectOne("SELECT * FROM `match_players` WHERE `id` = ?", [$player['id']], 'i');
            if (!$player) continue;

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

    /**
     * Charge army upkeep for one player before production (GAME_RULES §1, §5).
     * Deducts gold/food/oil over all their stacks; if gold or food couldn't be paid,
     * every stack deserts DESERTION (≥1 if non-empty) and emits `desertion`. Oil
     * reaching 0 grounds armor/navy/air and emits `grounded_no_oil` once this tick.
     * Stockpiles are clamped at 0.
     */
    private static function chargeUpkeep(DB $db, array $match, array $player, array &$events): void {
        $matchId = (int)$match['id'];
        $pid     = (int)$player['id'];

        $armies = $db->select(
            "SELECT `id`, `units` FROM `armies` WHERE `match_id` = ? AND `player` = ?",
            [$matchId, $pid], 'ii'
        ) ?: [];
        if (!$armies) return;

        $up = Economy::upkeep($armies);

        $goldBefore = (float)$player['gold'];
        $foodBefore = (float)$player['food'];
        $oilBefore  = (float)$player['oil'];

        $goldShort = $goldBefore < $up['gold'];
        $foodShort = $foodBefore < $up['food'];
        $oilShort  = $oilBefore  < $up['oil'];

        // Deduct and clamp at 0.
        $db->execute(
            "UPDATE `match_players`
                SET `gold` = GREATEST(0, `gold` - ?),
                    `food` = GREATEST(0, `food` - ?),
                    `oil`  = GREATEST(0, `oil`  - ?)
              WHERE `id` = ?",
            [$up['gold'], $up['food'], $up['oil'], $pid], 'dddi'
        );

        // Oil grounding: emit once per tick if oil hit zero and air/armor/navy upkeep
        // was owed (i.e. the player actually fields oil-hungry units).
        if ($oilShort && $up['oil'] > 0) {
            $events[] = ['type' => 'grounded_no_oil', 'data' => ['player' => $pid]];
        }

        // Desertion: if gold or food couldn't be paid, every stack loses DESERTION.
        if ($goldShort || $foodShort) {
            $lost = 0;
            foreach ($armies as $army) {
                $units = Combat::units($army);
                if (!$units) continue;
                $surv = Combat::scaleUnits($units, 1 - GameConfig::DESERTION, true); // keep ≥1
                $before = 0; foreach ($units as $c) $before += (int)$c;
                $after  = 0; if ($surv) foreach ($surv as $c) $after += (int)$c;
                $lost += max(0, $before - $after);
                if ($surv === null || $after === 0) {
                    $db->execute("DELETE FROM `armies` WHERE `id` = ?", [(int)$army['id']], 'i');
                } else {
                    $db->execute("UPDATE `armies` SET `units` = ? WHERE `id` = ?",
                        [json_encode($surv), (int)$army['id']], 'si');
                }
            }
            $events[] = ['type' => 'desertion', 'data' => [
                'player' => $pid, 'lost' => $lost,
                'reason' => $goldShort && $foodShort ? 'gold+food' : ($goldShort ? 'gold' : 'food'),
            ]];
        }
    }

    /**
     * World score per player (GAME_RULES §5): Σ over owned countries of
     * 0.4·pop_share + 0.3·area_share + 0.3·gdp_share, shares of the world totals
     * (Σ over all countries). Returns [player_id => score in 0..1].
     */
    public static function worldShares(DB $db, int $matchId): array {
        $w = $db->selectOne(
            "SELECT COALESCE(SUM(`pop_est`),0) p, COALESCE(SUM(`area_km2`),0) a, COALESCE(SUM(`gdp_md`),0) g
               FROM `countries`"
        ) ?: ['p' => 0, 'a' => 0, 'g' => 0];
        $wp = (float)$w['p']; $wa = (float)$w['a']; $wg = (float)$w['g'];

        $owned = $db->select(
            "SELECT t.`owner`,
                    COALESCE(SUM(c.`pop_est`),0) p,
                    COALESCE(SUM(c.`area_km2`),0) a,
                    COALESCE(SUM(c.`gdp_md`),0) g
               FROM `territories` t
               JOIN `countries` c ON c.`code` = t.`country_code`
              WHERE t.`match_id` = ? AND t.`owner` IS NOT NULL
              GROUP BY t.`owner`",
            [$matchId], 'i'
        ) ?: [];

        $W = GameConfig::VICTORY_WEIGHTS;
        $shares = [];
        foreach ($owned as $r) {
            $popS  = $wp > 0 ? (float)$r['p'] / $wp : 0.0;
            $areaS = $wa > 0 ? (float)$r['a'] / $wa : 0.0;
            $gdpS  = $wg > 0 ? (float)$r['g'] / $wg : 0.0;
            $shares[(int)$r['owner']] = $W['pop'] * $popS + $W['area'] * $areaS + $W['gdp'] * $gdpS;
        }
        return $shares;
    }

    private static function checkVictory(DB $db, int $matchId, array &$events): void {
        $shares = self::worldShares($db, $matchId);

        $alive = $db->select(
            "SELECT `id` FROM `match_players` WHERE `match_id` = ? AND `status` = 'active'",
            [$matchId], 'i'
        ) ?: [];

        $winner = null;
        foreach ($shares as $owner => $share) {
            if ($share >= GameConfig::DOMINATION_SHARE) { $winner = (int)$owner; break; }
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
