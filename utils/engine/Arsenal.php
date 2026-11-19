<?php
// Strategic arsenal (GAME_RULES §9): missiles (SRBM/MRBM/ICBM) and nuclear warheads.
// Built one at a time per item in the capital, then stocked and spent on strikes.
require_once __DIR__ . '/GameConfig.php';
require_once __DIR__ . '/Research.php';

final class Arsenal {

    public static function row(DB $db, int $matchId, int $player, string $item): ?array {
        return $db->selectOne(
            "SELECT * FROM `arsenal` WHERE `match_id`=? AND `player`=? AND `item`=?",
            [$matchId, $player, $item], 'iis'
        );
    }

    public static function stock(DB $db, int $matchId, int $player, string $item): int {
        $r = self::row($db, $matchId, $player, $item);
        return $r ? (int)$r['stock'] : 0;
    }

    /** Stock of every arsenal item for a player (for match/get). */
    public static function stocks(DB $db, int $matchId, int $player): array {
        $out = [];
        foreach (array_keys(GameConfig::ARSENAL) as $k) $out[$k] = 0;
        foreach ($db->select(
            "SELECT `item`, `stock`, `in_production`, `ready_tick` FROM `arsenal` WHERE `match_id`=? AND `player`=?",
            [$matchId, $player], 'ii'
        ) ?: [] as $r) {
            $out[$r['item']] = [
                'stock'         => (int)$r['stock'],
                'in_production' => (int)$r['in_production'],
                'ready_tick'    => $r['ready_tick'] !== null ? (int)$r['ready_tick'] : null,
            ];
        }
        return $out;
    }

    /**
     * Start building one arsenal item (GAME_RULES §9). Validates its tech, enforces
     * one build in production per item, pays the cost, and schedules it at tick+days.
     * Returns {ok, message?, ready_tick?}.
     */
    public static function build(DB $db, array $match, array $player, string $item): array {
        $matchId = (int)$match['id'];
        $pid     = (int)$player['id'];
        $tick    = (int)$match['current_tick'];

        $cfg = GameConfig::ARSENAL[$item] ?? null;
        if (!$cfg) return ['ok' => false, 'message' => 'Unknown arsenal item.'];
        if (!Research::isDone($db, $matchId, $pid, $cfg['tech'])) {
            return ['ok' => false, 'message' => 'Research ' . (GameConfig::TECH[$cfg['tech']]['name'] ?? $cfg['tech']) . ' first.'];
        }

        $row = self::row($db, $matchId, $pid, $item);
        $maxInProd = (int)($cfg['max_in_production'] ?? 1);
        $inProd = $row ? (int)$row['in_production'] : 0;
        if ($inProd >= $maxInProd) {
            return ['ok' => false, 'message' => $cfg['name'] . ' is already in production.'];
        }

        foreach (($cfg['cost'] ?? []) as $res => $amt) {
            if ((float)($player[$res] ?? 0) < $amt) {
                return ['ok' => false, 'message' => 'Not enough ' . $res . '.'];
            }
        }
        // Pay.
        $set = []; $vals = []; $types = '';
        foreach (($cfg['cost'] ?? []) as $res => $amt) { $set[] = "`$res`=`$res`-?"; $vals[] = $amt; $types .= 'd'; }
        if ($set) {
            $vals[] = $pid; $types .= 'i';
            $db->execute("UPDATE `match_players` SET " . implode(',', $set) . " WHERE `id`=?", $vals, $types);
        }

        $ready = $tick + (int)$cfg['days'];
        $db->execute(
            "INSERT INTO `arsenal` (`match_id`,`player`,`item`,`stock`,`in_production`,`ready_tick`)
             VALUES (?,?,?,0,?,?)
             ON DUPLICATE KEY UPDATE `in_production`=`in_production`+?, `ready_tick`=VALUES(`ready_tick`)",
            [$matchId, $pid, $item, 1, $ready, 1], 'iisiii'
        );
        return ['ok' => true, 'ready_tick' => $ready, 'days' => (int)$cfg['days']];
    }

    /** Move finished builds into stock this tick. Emits `arsenal_ready`. */
    public static function advance(DB $db, array $match, array &$events): void {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];

        $rows = $db->select(
            "SELECT * FROM `arsenal` WHERE `match_id`=? AND `in_production` > 0 AND `ready_tick` IS NOT NULL AND `ready_tick` <= ?",
            [$matchId, $tick], 'ii'
        ) ?: [];
        foreach ($rows as $r) {
            $n = (int)$r['in_production'];
            $db->execute(
                "UPDATE `arsenal` SET `stock`=`stock`+?, `in_production`=0, `ready_tick`=NULL WHERE `id`=?",
                [$n, (int)$r['id']], 'ii'
            );
            $events[] = ['type' => 'arsenal_ready', 'data' => [
                'player' => (int)$r['player'], 'item' => $r['item'], 'count' => $n,
            ]];
        }
    }

    /** Spend one unit of an item for a strike. Returns false if the stock is empty. */
    public static function consume(DB $db, int $matchId, int $player, string $item): bool {
        $row = self::row($db, $matchId, $player, $item);
        if (!$row || (int)$row['stock'] <= 0) return false;
        $db->execute("UPDATE `arsenal` SET `stock`=`stock`-1 WHERE `id`=?", [(int)$row['id']], 'i');
        return true;
    }
}
