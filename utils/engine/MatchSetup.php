<?php
// Turns a lobby into a live game: assign countries, build the board, seed economies.

final class MatchSetup {

    /** Start a match. Returns [ok, message]. */
    public static function start(DB $db, array $match): array {
        if ($match['status'] !== 'lobby') {
            return ['ok' => false, 'message' => 'Match is not in the lobby.'];
        }

        $players = $db->select(
            "SELECT * FROM `match_players` WHERE `match_id` = ? ORDER BY `slot`",
            [$match['id']], 'i'
        ) ?: [];
        if (count($players) < 1) {
            return ['ok' => false, 'message' => 'No players in the match.'];
        }

        // Ensure every player has a (unique) home country.
        $taken = [];
        foreach ($players as $p) if ($p['country_code']) $taken[$p['country_code']] = true;
        foreach ($players as &$p) {
            if (!$p['country_code']) {
                $p['country_code'] = self::randomFreeCountry($db, array_keys($taken));
                $taken[$p['country_code']] = true;
                $db->execute("UPDATE `match_players` SET `country_code` = ? WHERE `id` = ?",
                    [$p['country_code'], $p['id']], 'si');
            }
        }
        unset($p);

        $db->begin();

        // Board: one territory row per country, all neutral to start.
        $db->execute(
            "INSERT INTO `territories` (`match_id`, `country_code`)
             SELECT ?, `code` FROM `countries`
             ON DUPLICATE KEY UPDATE `is_capital` = `is_capital`",
            [$match['id']], 'i'
        );

        $slot = 0;
        foreach ($players as $p) {
            $home = $p['country_code'];
            $country = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$home], 's');
            if (!$country) continue;

            // Claim the capital.
            $db->execute(
                "UPDATE `territories` SET `owner` = ?, `is_capital` = 1 WHERE `match_id` = ? AND `country_code` = ?",
                [$p['id'], $match['id'], $home], 'iis'
            );

            // Seed stockpiles, population and colour. Starting food scales with
            // population so a big nation gets the same reaction window as a small one.
            $color = $p['color'] !== '#cccccc' ? $p['color'] : GameConfig::COLORS[$slot % count(GameConfig::COLORS)];
            $popM = (float)$country['start_pop'] * GameConfig::POP_SCALE;
            $startFood = max(
                GameConfig::START['food'],
                ceil($popM * GameConfig::FOOD_PER_POP * GameConfig::FOOD_GRACE_TICKS)
            );
            // Adopt the country's current leader (also refreshes humans to the latest name).
            $persona = leader_persona($home, $country['name']);
            $db->execute(
                "UPDATE `match_players`
                    SET `pop` = ?, `food` = ?, `energy` = ?, `minerals` = ?, `gold` = ?, `oil` = ?, `research` = 0,
                        `color` = ?, `display_name` = ?, `leader_title` = ?
                  WHERE `id` = ?",
                [
                    (int)$country['start_pop'],
                    $startFood, GameConfig::START['energy'], GameConfig::START['minerals'],
                    GameConfig::START['gold'], GameConfig::START['oil'],
                    $color, $persona['name'], $persona['title'], $p['id'],
                ],
                'idddddsssi'   // pop(i) food energy minerals gold oil(5×d) color display_name leader_title(3×s) id(i)
            );

            // Starting buildings, already active.
            foreach (GameConfig::START_BUILDINGS as $type) {
                $db->execute(
                    "INSERT INTO `buildings` (`match_id`, `player`, `country_code`, `type`, `status`, `complete_at_tick`)
                     VALUES (?, ?, ?, ?, 'active', 0)",
                    [$match['id'], $p['id'], $home, $type], 'iiss'
                );
            }

            // Starting army in the capital (GAME_RULES §5): infantry round(5 + 1.5·√popM),
            // armor round(2·s) with s = startScale(gdp_md). Stored as a units-JSON stack.
            $s = GameConfig::startScale((float)$country['gdp_md']);
            $infantry = (int)round(5 + 1.5 * sqrt(max(0.0, $popM)));
            $armor    = (int)round(2 * $s);
            $units = [];
            if ($infantry > 0) $units['infantry'] = $infantry;
            if ($armor > 0)    $units['armor'] = $armor;
            if ($units) {
                $db->execute(
                    "INSERT INTO `armies` (`match_id`, `player`, `country_code`, `units`, `origin`)
                     VALUES (?, ?, ?, ?, ?)",
                    [$match['id'], $p['id'], $home, json_encode($units), $home], 'iisss'
                );
            }
            $slot++;
        }

        $interval = max(5, (int)$match['tick_interval_sec']);
        $db->execute(
            "UPDATE `matches`
                SET `status` = 'active', `current_tick` = 0, `date_started` = NOW(),
                    `next_tick_at` = DATE_ADD(NOW(), INTERVAL ? SECOND)
              WHERE `id` = ?",
            [$interval, $match['id']], 'ii'
        );

        $db->execute(
            "INSERT INTO `match_events` (`match_id`, `tick`, `type`, `data`) VALUES (?, 0, 'match_started', ?)",
            [$match['id'], json_encode(['players' => count($players)])], 'is'
        );

        $db->commit();
        return ['ok' => true, 'message' => 'Match started.'];
    }

    private static function randomFreeCountry(DB $db, array $taken): string {
        $placeholders = $taken ? implode(',', array_fill(0, count($taken), '?')) : "''";
        $sql = "SELECT `code` FROM `countries`" . ($taken ? " WHERE `code` NOT IN ($placeholders)" : "")
             . " ORDER BY RAND() LIMIT 1";
        $row = $db->selectOne($sql, $taken, str_repeat('s', count($taken)));
        return $row['code'] ?? 'SWE';
    }
}
