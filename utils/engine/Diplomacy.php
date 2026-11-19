<?php
// Diplomatic relationship helpers. Pairs are stored with player_a < player_b.
require_once __DIR__ . '/GameConfig.php';

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

    /** Grant directional military access from $granter (owner) to $grantee (mover). */
    public static function grantAccess(DB $db, int $matchId, int $granter, int $grantee): void {
        [$a, $b] = $granter < $grantee ? [$granter, $grantee] : [$grantee, $granter];
        // Ensure the pair row exists (keeps whatever state it already has).
        $db->execute(
            "INSERT INTO `diplomacy` (`match_id`,`player_a`,`player_b`,`state`)
             VALUES (?,?,?,'neutral')
             ON DUPLICATE KEY UPDATE `date_updated` = NOW()",
            [$matchId, $a, $b], 'iii'
        );
        $col = ($granter === $a) ? 'access_ab' : 'access_ba';   // granter is a => access_ab
        $db->execute(
            "UPDATE `diplomacy` SET `$col` = 1, `date_updated` = NOW()
              WHERE `match_id`=? AND `player_a`=? AND `player_b`=?",
            [$matchId, $a, $b], 'iii'
        );
    }

    // --- Proposals (GAME_RULES §7) ------------------------------------------

    /** A pending, unexpired proposal row by id, or null. */
    public static function proposal(DB $db, int $matchId, int $propId): ?array {
        return $db->selectOne(
            "SELECT * FROM `diplomacy_proposals` WHERE `id`=? AND `match_id`=?",
            [$propId, $matchId], 'ii'
        );
    }

    /** Pending proposals addressed to $player that have not yet expired. */
    public static function pendingFor(DB $db, int $matchId, int $player, int $tick): array {
        return $db->select(
            "SELECT * FROM `diplomacy_proposals`
              WHERE `match_id`=? AND `to_player`=? AND `status`='pending' AND `expires_tick` > ?
              ORDER BY `id`",
            [$matchId, $player, $tick], 'iii'
        ) ?: [];
    }

    /**
     * Create a proposal from $from to $to (GAME_RULES §7). Returns {ok, id?, message?}.
     * Refuses self-proposals, proposing a state you already hold, and duplicates.
     */
    public static function propose(DB $db, int $matchId, int $from, int $to, string $type, int $tick): array {
        if (!in_array($type, ['alliance', 'truce', 'access'], true)) {
            return ['ok' => false, 'message' => 'Unknown proposal type.'];
        }
        if ($from === $to) return ['ok' => false, 'message' => 'You can’t send that to yourself.'];

        $other = $db->selectOne("SELECT `id`,`status` FROM `match_players` WHERE `id`=? AND `match_id`=?", [$to, $matchId], 'ii');
        if (!$other) return ['ok' => false, 'message' => 'No such player.'];
        if ($other['status'] !== 'active') return ['ok' => false, 'message' => 'That nation is out of the game.'];

        $state = self::state($db, $matchId, $from, $to);
        if ($type === 'alliance' && $state === 'allied') {
            return ['ok' => false, 'message' => 'You are already allied.'];
        }
        if ($type === 'truce') {
            if (self::truceLeft($db, $matchId, $from, $to, $tick) > 0) {
                return ['ok' => false, 'message' => 'A truce is already in force.'];
            }
            if ($state === 'allied') return ['ok' => false, 'message' => 'Allies are already at peace.'];
        }
        if ($type === 'access' && self::hasAccess($db, $matchId, $to, $from)) {
            return ['ok' => false, 'message' => 'You already have access.'];
        }

        // One pending proposal of each type per direction.
        $dup = $db->selectOne(
            "SELECT `id` FROM `diplomacy_proposals`
              WHERE `match_id`=? AND `from_player`=? AND `to_player`=? AND `type`=? AND `status`='pending' AND `expires_tick` > ?",
            [$matchId, $from, $to, $type, $tick], 'iiisi'
        );
        if ($dup) return ['ok' => false, 'message' => 'That proposal is already pending.'];

        $db->execute(
            "INSERT INTO `diplomacy_proposals` (`match_id`,`from_player`,`to_player`,`type`,`expires_tick`,`status`)
             VALUES (?,?,?,?,?,'pending')",
            [$matchId, $from, $to, $type, $tick + GameConfig::PROPOSAL_EXPIRE], 'iiisi'
        );
        return ['ok' => true, 'id' => (int)$db->lastInsertId(), 'expires_tick' => $tick + GameConfig::PROPOSAL_EXPIRE];
    }

    /**
     * Respond to a proposal as $responder (GAME_RULES §7). On accept, applies the
     * effect (alliance / truce / access). Returns {ok, type?, from?, message?}.
     */
    public static function respond(DB $db, int $matchId, int $propId, int $responder, bool $accept, int $tick): array {
        $p = self::proposal($db, $matchId, $propId);
        if (!$p) return ['ok' => false, 'message' => 'Proposal not found.'];
        if ((int)$p['to_player'] !== $responder) return ['ok' => false, 'message' => 'That proposal isn’t addressed to you.'];
        if ($p['status'] !== 'pending' || (int)$p['expires_tick'] <= $tick) {
            return ['ok' => false, 'message' => 'That proposal is no longer open.'];
        }

        $from = (int)$p['from_player'];
        $type = $p['type'];

        if ($accept) self::applyAccepted($db, $matchId, $from, $responder, $type, $tick);

        $db->execute("UPDATE `diplomacy_proposals` SET `status`=? WHERE `id`=?",
            [$accept ? 'accepted' : 'declined', $propId], 'si');

        return ['ok' => true, 'type' => $type, 'from' => $from, 'accepted' => $accept];
    }

    /** Apply an accepted proposal's effect. $from proposed; $to accepted. */
    public static function applyAccepted(DB $db, int $matchId, int $from, int $to, string $type, int $tick): void {
        if ($type === 'alliance') {
            self::set($db, $matchId, $from, $to, 'allied');
        } elseif ($type === 'truce') {
            [$a, $b] = $from < $to ? [$from, $to] : [$to, $from];
            $db->execute(
                "INSERT INTO `diplomacy` (`match_id`,`player_a`,`player_b`,`state`,`truce_until`)
                 VALUES (?,?,?,'truce',?)
                 ON DUPLICATE KEY UPDATE `state`='truce', `truce_until`=VALUES(`truce_until`), `date_updated`=NOW()",
                [$matchId, $a, $b, $tick + GameConfig::TRUCE_DAYS], 'iiii'
            );
        } elseif ($type === 'access') {
            // $to (the accepter) owns land and grants $from passage through it.
            self::grantAccess($db, $matchId, $to, $from);
        }
    }

    /**
     * Declare war unilaterally (GAME_RULES §7). Refused while a truce holds.
     * Returns {ok, message?}. Clears any pending proposals between the pair.
     */
    public static function declareWar(DB $db, int $matchId, int $from, int $to, int $tick): array {
        if ($from === $to) return ['ok' => false, 'message' => 'You can’t declare war on yourself.'];
        if (self::atWar($db, $matchId, $from, $to)) return ['ok' => false, 'message' => 'You are already at war.'];
        $left = self::truceLeft($db, $matchId, $from, $to, $tick);
        if ($left > 0) {
            return ['ok' => false, 'message' => 'Truce · ' . $left . ' days left. Truces can’t be broken.'];
        }
        self::set($db, $matchId, $from, $to, 'war');
        $db->execute(
            "UPDATE `diplomacy_proposals` SET `status`='declined'
              WHERE `match_id`=? AND `status`='pending'
                AND ((`from_player`=? AND `to_player`=?) OR (`from_player`=? AND `to_player`=?))",
            [$matchId, $from, $to, $to, $from], 'iiiii'
        );
        return ['ok' => true];
    }

    /**
     * Per-tick maintenance (GAME_RULES §7): expire stale proposals and end elapsed
     * truces (state -> neutral, `truce_ended` event). $match carries current_tick.
     */
    public static function maintain(DB $db, array $match, array &$events): void {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];

        // Expire proposals whose window has closed.
        $db->execute(
            "UPDATE `diplomacy_proposals` SET `status`='expired'
              WHERE `match_id`=? AND `status`='pending' AND `expires_tick` <= ?",
            [$matchId, $tick], 'ii'
        );

        // End truces that have run their course.
        $ended = $db->select(
            "SELECT `player_a`,`player_b` FROM `diplomacy`
              WHERE `match_id`=? AND `state`='truce' AND `truce_until` IS NOT NULL AND `truce_until` <= ?",
            [$matchId, $tick], 'ii'
        ) ?: [];
        if ($ended) {
            $db->execute(
                "UPDATE `diplomacy` SET `state`='neutral', `truce_until`=NULL, `date_updated`=NOW()
                  WHERE `match_id`=? AND `state`='truce' AND `truce_until` IS NOT NULL AND `truce_until` <= ?",
                [$matchId, $tick], 'ii'
            );
            foreach ($ended as $e) {
                $events[] = ['type' => 'truce_ended', 'data' => [
                    'a' => (int)$e['player_a'], 'b' => (int)$e['player_b'],
                ]];
            }
        }
    }
}
