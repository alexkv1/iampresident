<?php
// Shared unit-training logic (GAME_RULES §1a) used by the army/train API and the tick.
// Batches of 5 (TRAIN_BATCH). Cost + manpower paid on start; the batch joins the
// country's own stack when ready_tick is reached (handled in Tick::completeTraining).

require_once __DIR__ . '/GameConfig.php';
require_once __DIR__ . '/Combat.php';

final class Training {

    /** Units a player currently has in service: every unit in every army stack. */
    public static function unitsInArmies(DB $db, int $matchId, int $player): int {
        $rows = $db->select(
            "SELECT `units` FROM `armies` WHERE `match_id` = ? AND `player` = ?",
            [$matchId, $player], 'ii'
        ) ?: [];
        $n = 0;
        foreach ($rows as $a) foreach (Combat::units($a) as $c) $n += (int)$c;
        return $n;
    }

    /** Units a player has queued in training (counts toward the manpower cap). */
    public static function unitsInTraining(DB $db, int $matchId, int $player): int {
        return (int)($db->selectOne(
            "SELECT COALESCE(SUM(`count`), 0) c FROM `training` WHERE `match_id` = ? AND `player` = ?",
            [$matchId, $player], 'ii'
        )['c'] ?? 0);
    }

    /** Manpower in use = units in armies + units queued in training. */
    public static function manpowerUsed(DB $db, int $matchId, int $player): int {
        return self::unitsInArmies($db, $matchId, $player) + self::unitsInTraining($db, $matchId, $player);
    }

    /** Training slots in a country: 1 barracks + 1 per active Factory there (0 if occupied). */
    public static function slots(DB $db, int $matchId, int $player, string $code, int $currentTick): int {
        $terr = $db->selectOne(
            "SELECT * FROM `territories` WHERE `match_id` = ? AND `country_code` = ?",
            [$matchId, $code], 'is'
        );
        if (!$terr || (int)$terr['owner'] !== $player) return 0;
        $occupied = $terr['occupied_until'] !== null && (int)$terr['occupied_until'] > $currentTick;
        if ($occupied) return 0;
        $factories = (int)($db->selectOne(
            "SELECT COUNT(*) c FROM `buildings`
              WHERE `match_id` = ? AND `country_code` = ? AND `player` = ?
                AND `type` = 'factory' AND `status` = 'active'",
            [$matchId, $code, $player], 'isi'
        )['c'] ?? 0);
        return 1 + $factories;
    }

    /** A player's in-progress training batches (for the HUD: slot usage + ready timers). */
    public static function listForPlayer(DB $db, int $matchId, int $player): array {
        $rows = $db->select(
            "SELECT `country_code`, `unit`, `count`, `ready_tick` FROM `training`
              WHERE `match_id` = ? AND `player` = ? ORDER BY `ready_tick`, `id`",
            [$matchId, $player], 'ii'
        ) ?: [];
        return array_map(fn($r) => [
            'country_code' => $r['country_code'],
            'unit'         => $r['unit'],
            'count'        => (int)$r['count'],
            'ready_tick'   => (int)$r['ready_tick'],
        ], $rows);
    }

    /** Batches already training in a country (one occupies one slot). */
    public static function busySlots(DB $db, int $matchId, int $player, string $code): int {
        return (int)($db->selectOne(
            "SELECT COUNT(*) c FROM `training` WHERE `match_id` = ? AND `player` = ? AND `country_code` = ?",
            [$matchId, $player, $code], 'iis'
        )['c'] ?? 0);
    }

    /**
     * Whether a unit's unlock tech has been researched (level 1). Infantry/armor/navy
     * have unlock = null and are always available.
     */
    public static function techUnlocked(DB $db, int $matchId, int $player, ?string $tech): bool {
        if ($tech === null) return true;
        $row = $db->selectOne(
            "SELECT 1 FROM `player_tech` WHERE `match_id` = ? AND `player` = ? AND `tech_key` = ? AND `level` = 1",
            [$matchId, $player, $tech], 'iis'
        );
        return $row !== null;
    }

    /**
     * Start training one batch of 5 of $type in $code (GAME_RULES §1a).
     * Deducts cost×5 on start, inserts a `training` row due at current_tick + build_days.
     * @return array {ok:bool, message:string, training_id?:int, ready_tick?:int, count?:int}
     */
    public static function start(DB $db, array $match, array $player, string $code, string $type): array {
        $cfg = GameConfig::unit($type);
        if (!$cfg) return ['ok' => false, 'message' => 'Unknown unit type.'];

        $matchId = (int)$match['id'];
        $pid     = (int)$player['id'];
        $tick    = (int)$match['current_tick'];
        $batch   = GameConfig::TRAIN_BATCH;

        // Must own the country and it must not be under occupation.
        $terr = $db->selectOne(
            "SELECT * FROM `territories` WHERE `match_id` = ? AND `country_code` = ?",
            [$matchId, $code], 'is'
        );
        if (!$terr || (int)$terr['owner'] !== $pid) {
            return ['ok' => false, 'message' => 'You do not control this country.'];
        }
        if ($terr['occupied_until'] !== null && (int)$terr['occupied_until'] > $tick) {
            return ['ok' => false, 'message' => 'This country is occupied — it can’t train units yet.'];
        }

        // Tech lock (GAME_RULES §1).
        if (!self::techUnlocked($db, $matchId, $pid, $cfg['unlock'] ?? null)) {
            return ['ok' => false, 'message' => 'Research ' . $cfg['name'] . ' first.'];
        }

        // Manpower cap (GAME_RULES §1): used = armies + training; limit = 1% of population.
        $limit = GameConfig::manpowerLimit((float)$player['pop']);
        $used  = self::manpowerUsed($db, $matchId, $pid);
        if ($used + $batch > $limit) {
            return ['ok' => false, 'message' =>
                'Not enough manpower: ' . $used . '/' . $limit . ' in service, a batch needs ' . $batch . ' more.'];
        }

        // Free training slot (GAME_RULES §1a): 1 + active Factories, minus batches in progress.
        $slots = self::slots($db, $matchId, $pid, $code, $tick);
        $busy  = self::busySlots($db, $matchId, $pid, $code);
        if ($busy >= $slots) {
            return ['ok' => false, 'message' =>
                'No free training slot here (' . $busy . '/' . $slots . ' busy). Build a Factory for more.'];
        }

        // Afford cost × batch.
        $cost = [];
        foreach (($cfg['cost'] ?? []) as $res => $amt) {
            $cost[$res] = $amt * $batch;
            if ((float)$player[$res] < $cost[$res]) {
                return ['ok' => false, 'message' => 'Not enough ' . $res . ' to train a batch of ' . $batch . '.'];
            }
        }

        // Pay and queue.
        $db->begin();
        foreach ($cost as $res => $amt) {
            $db->execute("UPDATE `match_players` SET `$res` = `$res` - ? WHERE `id` = ?", [$amt, $pid], 'di');
        }
        $readyTick = $tick + (int)$cfg['build_days'];
        $db->execute(
            "INSERT INTO `training` (`match_id`, `player`, `country_code`, `unit`, `count`, `ready_tick`)
             VALUES (?, ?, ?, ?, ?, ?)",
            [$matchId, $pid, $code, $type, $batch, $readyTick], 'iissii'
        );
        $id = $db->lastInsertId();
        $db->commit();

        return ['ok' => true, 'message' => 'Training started.', 'training_id' => $id,
                'ready_tick' => $readyTick, 'count' => $batch];
    }

    /**
     * Complete every batch whose ready_tick has arrived (GAME_RULES §1a). The batch
     * joins the owning player's own stack in that country (merge, else create a row,
     * origin = country). Deletes the training row and appends a `training_complete`
     * event. Returns the number of batches completed.
     */
    public static function complete(DB $db, array $match, array &$events): int {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];

        $rows = $db->select(
            "SELECT * FROM `training` WHERE `match_id` = ? AND `ready_tick` <= ?",
            [$matchId, $tick], 'ii'
        ) ?: [];

        foreach ($rows as $row) {
            $player = (int)$row['player'];
            $code   = (string)$row['country_code'];
            $unit   = (string)$row['unit'];
            $count  = (int)$row['count'];

            // Merge into the player's own stationed stack there, else create one.
            $stack = $db->selectOne(
                "SELECT * FROM `armies`
                  WHERE `match_id` = ? AND `player` = ? AND `country_code` = ? AND `moving_to` IS NULL
                  LIMIT 1",
                [$matchId, $player, $code], 'iis'
            );
            if ($stack) {
                $merged = Combat::mergeUnits(Combat::units($stack), [$unit => $count]);
                $db->execute("UPDATE `armies` SET `units` = ? WHERE `id` = ?",
                    [json_encode($merged), (int)$stack['id']], 'si');
            } else {
                $db->execute(
                    "INSERT INTO `armies` (`match_id`, `player`, `country_code`, `units`, `origin`)
                     VALUES (?, ?, ?, ?, ?)",
                    [$matchId, $player, $code, json_encode([$unit => $count]), $code], 'iisss'
                );
            }

            $db->execute("DELETE FROM `training` WHERE `id` = ?", [(int)$row['id']], 'i');

            $events[] = ['type' => 'training_complete', 'data' => [
                'player' => $player, 'country' => $code, 'unit' => $unit, 'count' => $count,
            ]];
        }

        return count($rows);
    }
}
