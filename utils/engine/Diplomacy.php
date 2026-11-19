<?php
// Diplomatic relationship helpers. Pairs are stored with player_a < player_b.

final class Diplomacy {

    /** Get the state between two players ('neutral' if no row). */
    public static function state(DB $db, int $matchId, int $p1, int $p2): string {
        [$a, $b] = $p1 < $p2 ? [$p1, $p2] : [$p2, $p1];
        $row = $db->selectOne(
            "SELECT `state` FROM `diplomacy` WHERE `match_id` = ? AND `player_a` = ? AND `player_b` = ?",
            [$matchId, $a, $b], 'iii'
        );
        return $row['state'] ?? 'neutral';
    }

    /** Set (upsert) the state between two players. */
    public static function set(DB $db, int $matchId, int $p1, int $p2, string $state): void {
        [$a, $b] = $p1 < $p2 ? [$p1, $p2] : [$p2, $p1];
        $db->execute(
            "INSERT INTO `diplomacy` (`match_id`, `player_a`, `player_b`, `state`)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE `state` = VALUES(`state`), `date_updated` = NOW()",
            [$matchId, $a, $b, $state], 'iiis'
        );
    }

    public static function areAllied(DB $db, int $matchId, int $p1, int $p2): bool {
        return self::state($db, $matchId, $p1, $p2) === 'allied';
    }

    public static function atWar(DB $db, int $matchId, int $p1, int $p2): bool {
        return self::state($db, $matchId, $p1, $p2) === 'war';
    }
}
