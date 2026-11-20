<?php
// Resource trading between players (GAME_RULES §7). A player offers to GIVE some resources
// in exchange to RECEIVE some back; the other player accepts (resources transfer atomically)
// or declines. Pending offers expire after EXPIRE_TICKS.
require_once __DIR__ . '/GameConfig.php';

final class Trade {

    const EXPIRE_TICKS = 4;
    const MAX_PER_RES  = 1_000_000;   // sanity cap per resource in one offer

    /** Keep only known resources with positive integer amounts. */
    private static function clean(array $m): array {
        $out = [];
        foreach (GameConfig::RESOURCES as $r) {
            $v = (int)($m[$r] ?? 0);
            if ($v > 0) $out[$r] = min($v, self::MAX_PER_RES);
        }
        return $out;
    }

    /**
     * Offer a trade: $from gives $give and receives $receive from $to.
     * @return array {ok, message?, id?}
     */
    public static function propose(DB $db, array $match, int $from, int $to, array $give, array $receive): array {
        $matchId = (int)$match['id'];
        if ($from === $to) return ['ok' => false, 'message' => 'You can’t trade with yourself.'];
        $toRow = $db->selectOne("SELECT `id` FROM `match_players` WHERE `match_id`=? AND `id`=? AND `status`='active'", [$matchId, $to], 'ii');
        if (!$toRow) return ['ok' => false, 'message' => 'That player isn’t in the match.'];

        $give = self::clean($give);
        $receive = self::clean($receive);
        if (!$give && !$receive) return ['ok' => false, 'message' => 'Add at least one resource to the offer.'];

        $me = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$from], 'i');
        foreach ($give as $r => $v) {
            if ((float)$me[$r] < $v) return ['ok' => false, 'message' => 'You don’t have enough ' . $r . ' to offer that.'];
        }
        // Cap concurrent pending offers to the same player (avoid spam).
        $pending = (int)($db->selectOne(
            "SELECT COUNT(*) c FROM `trades` WHERE `match_id`=? AND `from_player`=? AND `to_player`=? AND `status`='pending'",
            [$matchId, $from, $to], 'iii'
        )['c'] ?? 0);
        if ($pending >= 3) return ['ok' => false, 'message' => 'You already have offers pending with them.'];

        $db->execute(
            "INSERT INTO `trades` (`match_id`,`from_player`,`to_player`,`give`,`receive`,`status`)
             VALUES (?,?,?,?,?,'pending')",
            [$matchId, $from, $to, json_encode($give), json_encode($receive)], 'iiiss'
        );
        return ['ok' => true, 'id' => $db->lastInsertId(), 'give' => $give, 'receive' => $receive];
    }

    /**
     * Accept or decline a pending offer addressed to $responder. On accept, resources transfer
     * atomically (both sides re-validated). @return array {ok, message?, accepted?}
     */
    public static function respond(DB $db, array $match, int $tradeId, int $responder, bool $accept): array {
        $matchId = (int)$match['id'];
        $t = $db->selectOne("SELECT * FROM `trades` WHERE `id`=? AND `match_id`=? AND `status`='pending'", [$tradeId, $matchId], 'ii');
        if (!$t) return ['ok' => false, 'message' => 'That offer is no longer on the table.'];
        if ((int)$t['to_player'] !== $responder) return ['ok' => false, 'message' => 'That offer isn’t addressed to you.'];

        if (!$accept) {
            $db->execute("UPDATE `trades` SET `status`='declined' WHERE `id`=?", [$tradeId], 'i');
            return ['ok' => true, 'accepted' => false];
        }

        $give = json_decode($t['give'], true) ?: [];
        $receive = json_decode($t['receive'], true) ?: [];
        $from = (int)$t['from_player'];
        $to = (int)$t['to_player'];

        $fromRow = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$from], 'i');
        $toRow   = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$to], 'i');
        if (!$fromRow || !$toRow) return ['ok' => false, 'message' => 'A player is no longer in the match.'];
        foreach ($give as $r => $v) if ((float)$fromRow[$r] < $v) return ['ok' => false, 'message' => 'They can no longer afford this trade.'];
        foreach ($receive as $r => $v) if ((float)$toRow[$r] < $v) return ['ok' => false, 'message' => 'You can’t afford what this asks for.'];

        $db->begin();
        try {
            foreach ($give as $r => $v) {
                $db->execute("UPDATE `match_players` SET `$r`=`$r`-? WHERE `id`=?", [$v, $from], 'di');
                $db->execute("UPDATE `match_players` SET `$r`=`$r`+? WHERE `id`=?", [$v, $to], 'di');
            }
            foreach ($receive as $r => $v) {
                $db->execute("UPDATE `match_players` SET `$r`=`$r`-? WHERE `id`=?", [$v, $to], 'di');
                $db->execute("UPDATE `match_players` SET `$r`=`$r`+? WHERE `id`=?", [$v, $from], 'di');
            }
            $db->execute("UPDATE `trades` SET `status`='accepted' WHERE `id`=?", [$tradeId], 'i');
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollback();
            return ['ok' => false, 'message' => 'Trade failed, please try again.'];
        }
        return ['ok' => true, 'accepted' => true, 'give' => $give, 'receive' => $receive, 'from' => $from, 'to' => $to];
    }

    /** Pending offers touching a player, for match/get. dir = 'in' (to me) / 'out' (from me). */
    public static function listFor(DB $db, int $matchId, int $player): array {
        $rows = $db->select(
            "SELECT * FROM `trades` WHERE `match_id`=? AND `status`='pending' AND (`from_player`=? OR `to_player`=?) ORDER BY `id` DESC",
            [$matchId, $player, $player], 'iii'
        ) ?: [];
        return array_map(fn($t) => [
            'id'      => (int)$t['id'],
            'from'    => (int)$t['from_player'],
            'to'      => (int)$t['to_player'],
            'give'    => json_decode($t['give'], true) ?: [],
            'receive' => json_decode($t['receive'], true) ?: [],
            'dir'     => ((int)$t['to_player'] === $player ? 'in' : 'out'),
        ], $rows);
    }
}
