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

    /** Full diplomacy row between two players (or null). Keeps a<b ordering. */
    public static function row(DB $db, int $matchId, int $p1, int $p2): ?array {
        [$a, $b] = $p1 < $p2 ? [$p1, $p2] : [$p2, $p1];
        return $db->selectOne(
            "SELECT * FROM `diplomacy` WHERE `match_id` = ? AND `player_a` = ? AND `player_b` = ?",
            [$matchId, $a, $b], 'iii'
        );
    }

    /** Remaining truce days vs a player (0 if none / expired), given current tick. */
    public static function truceLeft(DB $db, int $matchId, int $me, int $other, int $tick): int {
        $r = self::row($db, $matchId, $me, $other);
        if (!$r || $r['state'] !== 'truce' || $r['truce_until'] === null) return 0;
        return max(0, (int)$r['truce_until'] - $tick);
    }

    /**
     * Has $owner granted $mover military access? Access is directional:
     * access_ab = player_a granted player_b; access_ba = player_b granted player_a.
     */
    public static function hasAccess(DB $db, int $matchId, int $owner, int $mover): bool {
        $r = self::row($db, $matchId, $owner, $mover);
        if (!$r) return false;
        [$a] = $owner < $mover ? [$owner, $mover] : [$mover, $owner];
        // access granted by `a` to `b` is access_ab; owner is the granter.
        return $owner === $a ? ((int)$r['access_ab'] === 1) : ((int)$r['access_ba'] === 1);
    }
}
