<?php
// Resolves army movement arrivals and battles for one tick.

final class Combat {

    const NEUTRAL_GARRISON = 8;   // defence value of an unclaimed country
    const OWNED_GARRISON   = 4;   // base defence of a claimed country with no army

    /** Strength of a single army row. */
    private static function strength(array $army): float {
        $atk = GameConfig::UNITS[$army['type']]['attack'] ?? 1;
        return (int)$army['count'] * $atk;
    }

    /** Process every army whose movement completes on/before the current tick. */
    public static function resolveArrivals(DB $db, array $match, array &$events): void {
        $matchId = (int)$match['id'];
        $tick = (int)$match['current_tick'];

        $arriving = $db->select(
            "SELECT * FROM `armies`
              WHERE `match_id` = ? AND `moving_to` IS NOT NULL AND `arrive_at_tick` <= ?",
            [$matchId, $tick], 'ii'
        );
        if (!$arriving) return;

        foreach ($arriving as $army) {
            $dest = $army['moving_to'];
            $attacker = (int)$army['player'];

            // Land the army at its destination.
            $db->execute(
                "UPDATE `armies` SET `country_code` = ?, `moving_to` = NULL, `arrive_at_tick` = NULL WHERE `id` = ?",
                [$dest, $army['id']], 'si'
            );

            $terr = $db->selectOne(
                "SELECT * FROM `territories` WHERE `match_id` = ? AND `country_code` = ?",
                [$matchId, $dest], 'is'
            );
            if (!$terr) continue;
            $owner = $terr['owner'] !== null ? (int)$terr['owner'] : null;

            // Friendly / own territory -> just reinforce.
            if ($owner === $attacker) continue;
            if ($owner !== null && Diplomacy::areAllied($db, $matchId, $attacker, $owner)) continue;

            // Gather defenders (armies at dest not belonging to attacker or allies).
            $defArmies = $db->select(
                "SELECT * FROM `armies` WHERE `match_id` = ? AND `country_code` = ? AND `moving_to` IS NULL AND `player` <> ?",
                [$matchId, $dest, $attacker], 'isi'
            ) ?: [];
            $defStrength = ($owner === null) ? self::NEUTRAL_GARRISON : self::OWNED_GARRISON;
            foreach ($defArmies as $d) {
                if ($owner !== null && Diplomacy::areAllied($db, $matchId, $attacker, (int)$d['player'])) continue;
                $defStrength += self::strength($d);
            }

            $atkStrength = self::strength($army);

            if ($atkStrength > $defStrength) {
                // Attacker wins: destroy hostile defenders, take the territory.
                foreach ($defArmies as $d) {
                    if ($owner !== null && Diplomacy::areAllied($db, $matchId, $attacker, (int)$d['player'])) continue;
                    $db->execute("DELETE FROM `armies` WHERE `id` = ?", [$d['id']], 'i');
                }
                // Attacker takes losses proportional to the fight.
                $lossRatio = $atkStrength > 0 ? min(0.9, $defStrength / $atkStrength) : 0;
                $remaining = max(1, (int)floor((int)$army['count'] * (1 - $lossRatio)));
                $db->execute("UPDATE `armies` SET `count` = ? WHERE `id` = ?", [$remaining, $army['id']], 'ii');

                $db->execute("UPDATE `territories` SET `owner` = ? WHERE `id` = ?", [$attacker, $terr['id']], 'ii');

                $events[] = ['type' => 'conquest', 'data' => [
                    'country' => $dest, 'to' => $attacker, 'from' => $owner,
                ]];

                if ($owner !== null) self::checkDefeat($db, $matchId, $owner, $events);
            } else {
                // Attacker loses: army destroyed (or badly mauled).
                $lossRatio = $defStrength > 0 ? min(1.0, $atkStrength / $defStrength) : 1.0;
                $remaining = (int)floor((int)$army['count'] * $lossRatio * 0.5);
                if ($remaining <= 0) {
                    $db->execute("DELETE FROM `armies` WHERE `id` = ?", [$army['id']], 'i');
                } else {
                    $db->execute("UPDATE `armies` SET `count` = ? WHERE `id` = ?", [$remaining, $army['id']], 'ii');
                }
                $events[] = ['type' => 'battle_repelled', 'data' => [
                    'country' => $dest, 'attacker' => $attacker, 'defender' => $owner,
                ]];
            }
        }
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
