<?php
// Computer-controlled presidents. One lightweight decision per tick:
// keep the lights on, keep people fed, then develop the economy.

final class AI {

    public static function act(DB $db, array $match, array $player, array &$events): void {
        $capital = $player['country_code'];
        if (!$capital) return;

        // Answer diplomacy proposals addressed to this AI (GAME_RULES §7).
        self::answerProposals($db, $match, $player, $events);

        // Light research: when idle, start the cheapest tech it qualifies for (§8).
        self::maybeResearch($db, $match, $player, $events);

        // Count buildings (active + under construction) in the capital by type.
        $rows = $db->select(
            "SELECT `type`, COUNT(*) c FROM `buildings`
              WHERE `match_id` = ? AND `player` = ? AND `country_code` = ?
              GROUP BY `type`",
            [$match['id'], $player['id'], $capital], 'iis'
        ) ?: [];
        $count = [];
        foreach ($rows as $r) $count[$r['type']] = (int)$r['c'];
        $n = fn($t) => $count[$t] ?? 0;

        $country = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$capital], 's');

        // Decide the next building by priority.
        $energyUsers = $n('mine') + $n('oil_rig') + $n('factory') + $n('lab') + $n('bank');
        $choice = null;
        if ($n('power_plant') === 0 || $energyUsers > $n('power_plant') * 2) {
            $choice = 'power_plant';
        } elseif ($n('farm') < 2) {
            $choice = 'farm';
        } elseif ((int)$country['minerals'] >= 55 && $n('mine') < 3) {
            $choice = 'mine';
        } elseif ((int)$country['oil'] >= 55 && $n('oil_rig') < 2) {
            $choice = 'oil_rig';
        } elseif ($n('bank') < 1) {
            $choice = 'bank';
        } elseif ($n('housing') < 2) {
            $choice = 'housing';
        } elseif ($n('lab') < 1) {
            $choice = 'lab';
        } else {
            $choice = 'factory';
        }

        // Keep a gold reserve scaled by difficulty (easier AI hoards less efficiently).
        $reserve = [250, 150, 80][max(0, min(2, (int)$player['ai_level'] - 1))];
        $cost = GameConfig::building($choice)['cost'] ?? [];
        if ((float)$player['gold'] - ($cost['gold'] ?? 0) < $reserve) return;

        $res = Build::start($db, $match, $player, $capital, $choice);
        if ($res['ok']) {
            $events[] = ['type' => 'ai_build', 'data' => ['player' => (int)$player['id'], 'type' => $choice, 'country' => $capital]];
        }
    }

    /**
     * Answer every pending proposal addressed to this AI (GAME_RULES §7):
     *  - alliance: accept if not at war with the proposer AND they share an enemy,
     *  - truce:    accept if the AI is losing (lower world share than the proposer),
     *  - access:   grant only to current allies.
     */
    private static function answerProposals(DB $db, array $match, array $player, array &$events): void {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];
        $me      = (int)$player['id'];

        $pending = Diplomacy::pendingFor($db, $matchId, $me, $tick);
        if (!$pending) return;

        $shares = Tick::worldShares($db, $matchId);   // cached-free; small query

        foreach ($pending as $p) {
            $from = (int)$p['from_player'];
            $type = $p['type'];
            $accept = false;

            if ($type === 'alliance') {
                $accept = !Diplomacy::atWar($db, $matchId, $me, $from)
                       && self::sharesEnemy($db, $matchId, $me, $from);
            } elseif ($type === 'truce') {
                $accept = ($shares[$me] ?? 0.0) < ($shares[$from] ?? 0.0);
            } elseif ($type === 'access') {
                $accept = Diplomacy::areAllied($db, $matchId, $me, $from);
            }

            Diplomacy::respond($db, $matchId, (int)$p['id'], $me, $accept, $tick);
            $events[] = ['type' => $accept ? 'proposal_accepted' : 'proposal_declined', 'data' => [
                'id' => (int)$p['id'], 'type' => $type, 'from' => $from, 'to' => $me,
            ]];
        }
    }

    /**
     * When the AI has no active research project, start the cheapest tech it meets
     * the requirements and can afford (GAME_RULES §8). Keeps the tree exercised
     * without steering the AI toward strikes.
     */
    private static function maybeResearch(DB $db, array $match, array $player, array &$events): void {
        $matchId = (int)$match['id'];
        $pid     = (int)$player['id'];
        if (Research::activeProject($db, $matchId, $pid)) return;

        foreach (['artillery', 'air', 'srbm', 'mrbm', 'icbm'] as $key) {
            if (Research::isDone($db, $matchId, $pid, $key)) continue;
            if (!Research::requirementsMet($db, $matchId, $pid, $key)['ok']) continue;
            $t = GameConfig::TECH[$key];
            // Only spend when it won't drain the whole treasury.
            if ((float)$player['gold'] < (float)$t['gold'] * 1.5) break;
            if ((float)$player['research'] < (float)$t['research']) break;
            $res = Research::start($db, $match, $player, $key);
            if ($res['ok']) {
                $events[] = ['type' => 'research_started', 'data' => ['player' => $pid, 'tech' => $key]];
            }
            break;
        }
    }

    /** True if some third active player is at war with both $a and $b. */
    private static function sharesEnemy(DB $db, int $matchId, int $a, int $b): bool {
        $others = $db->select(
            "SELECT `id` FROM `match_players` WHERE `match_id`=? AND `status`='active' AND `id` NOT IN (?, ?)",
            [$matchId, $a, $b], 'iii'
        ) ?: [];
        foreach ($others as $o) {
            $x = (int)$o['id'];
            if (Diplomacy::atWar($db, $matchId, $a, $x) && Diplomacy::atWar($db, $matchId, $b, $x)) {
                return true;
            }
        }
        return false;
    }
}
