<?php
// Research tree (GAME_RULES §8). One project at a time per player; research points
// and gold (and minerals for nukes) are paid up front; the project completes after
// `days`. Techs gate units (artillery/air), missiles and warheads.
require_once __DIR__ . '/GameConfig.php';

final class Research {

    /** Level of a tech for a player: 1 = researched, 0 = not (or in progress). */
    public static function techLevel(DB $db, int $matchId, int $player, string $key): int {
        $r = $db->selectOne(
            "SELECT `level` FROM `player_tech` WHERE `match_id`=? AND `player`=? AND `tech_key`=?",
            [$matchId, $player, $key], 'iis'
        );
        return $r ? (int)$r['level'] : 0;
    }

    public static function isDone(DB $db, int $matchId, int $player, string $key): bool {
        return self::techLevel($db, $matchId, $player, $key) === 1;
    }

    /** Map of completed tech_key => 1 (for match/get). */
    public static function levels(DB $db, int $matchId, int $player): array {
        $out = [];
        foreach ($db->select(
            "SELECT `tech_key`, `level` FROM `player_tech` WHERE `match_id`=? AND `player`=?",
            [$matchId, $player], 'ii'
        ) ?: [] as $r) {
            $out[$r['tech_key']] = (int)$r['level'];
        }
        return $out;
    }

    /** The in-progress project row (level 0) for a player, or null. */
    public static function activeProject(DB $db, int $matchId, int $player): ?array {
        return $db->selectOne(
            "SELECT * FROM `player_tech` WHERE `match_id`=? AND `player`=? AND `level`=0 ORDER BY `started_tick` LIMIT 1",
            [$matchId, $player], 'ii'
        );
    }

    /** Count of the player's active Research Labs (for the nuclear requirement). */
    public static function labCount(DB $db, int $matchId, int $player): int {
        return (int)($db->selectOne(
            "SELECT COUNT(*) c FROM `buildings`
              WHERE `match_id`=? AND `player`=? AND `type`='lab' AND `status`='active'",
            [$matchId, $player], 'ii'
        )['c'] ?? 0);
    }

    /**
     * Are a tech's requirements met? Returns {ok, reasons[]}. Checks prerequisite
     * techs (must be done) and the nuclear lab requirement.
     */
    public static function requirementsMet(DB $db, int $matchId, int $player, string $key): array {
        $t = GameConfig::TECH[$key] ?? null;
        if (!$t) return ['ok' => false, 'reasons' => ['Unknown technology.']];
        $reasons = [];
        foreach (($t['requires'] ?? []) as $req) {
            if (!self::isDone($db, $matchId, $player, $req)) {
                $reasons[] = 'Research ' . (GameConfig::TECH[$req]['name'] ?? $req) . ' first.';
            }
        }
        if (isset($t['labs'])) {
            $have = self::labCount($db, $matchId, $player);
            if ($have < (int)$t['labs']) {
                $reasons[] = 'Needs ' . (int)$t['labs'] . ' Research Labs (' . $have . ').';
            }
        }
        return ['ok' => count($reasons) === 0, 'reasons' => $reasons];
    }

    /**
     * Start researching a tech (GAME_RULES §8). Pays research points + gold (+ minerals
     * for nukes) immediately and schedules completion at tick + days. Returns
     * {ok, message?, ready_tick?}. One project at a time.
     */
    public static function start(DB $db, array $match, array $player, string $key): array {
        $matchId = (int)$match['id'];
        $pid     = (int)$player['id'];
        $tick    = (int)$match['current_tick'];

        $t = GameConfig::TECH[$key] ?? null;
        if (!$t) return ['ok' => false, 'message' => 'Unknown technology.'];
        if (self::isDone($db, $matchId, $pid, $key)) {
            return ['ok' => false, 'message' => 'Already researched.'];
        }
        if (self::activeProject($db, $matchId, $pid)) {
            return ['ok' => false, 'message' => 'A research project is already under way.'];
        }
        $req = self::requirementsMet($db, $matchId, $pid, $key);
        if (!$req['ok']) return ['ok' => false, 'message' => $req['reasons'][0]];

        $needR = (float)($t['research'] ?? 0);
        $needG = (float)($t['gold'] ?? 0);
        $needM = (float)($t['minerals'] ?? 0);
        if ((float)$player['research'] < $needR) return ['ok' => false, 'message' => 'Not enough research points.'];
        if ((float)$player['gold'] < $needG)     return ['ok' => false, 'message' => 'Not enough gold.'];
        if ($needM > 0 && (float)$player['minerals'] < $needM) return ['ok' => false, 'message' => 'Not enough minerals.'];

        $db->execute(
            "UPDATE `match_players` SET `research`=`research`-?, `gold`=`gold`-?, `minerals`=`minerals`-? WHERE `id`=?",
            [$needR, $needG, $needM, $pid], 'dddi'
        );
        $ready = $tick + (int)$t['days'];
        $db->execute(
            "INSERT INTO `player_tech` (`match_id`,`player`,`tech_key`,`level`,`progress`,`started_tick`)
             VALUES (?,?,?,0,0,?)
             ON DUPLICATE KEY UPDATE `level`=0, `progress`=0, `started_tick`=VALUES(`started_tick`)",
            [$matchId, $pid, $key, $tick], 'iisi'
        );
        return ['ok' => true, 'ready_tick' => $ready, 'days' => (int)$t['days']];
    }

    /** Complete any projects whose time is up this tick. Emits `research_complete`. */
    public static function advance(DB $db, array $match, array &$events): void {
        $matchId = (int)$match['id'];
        $tick    = (int)$match['current_tick'];

        $projects = $db->select(
            "SELECT * FROM `player_tech` WHERE `match_id`=? AND `level`=0",
            [$matchId], 'i'
        ) ?: [];
        foreach ($projects as $p) {
            $t = GameConfig::TECH[$p['tech_key']] ?? null;
            if (!$t) continue;
            $elapsed = $tick - (int)$p['started_tick'];
            if ($elapsed >= (int)$t['days']) {
                $db->execute("UPDATE `player_tech` SET `level`=1, `progress`=? WHERE `id`=?",
                    [(float)$t['days'], (int)$p['id']], 'di');
                $events[] = ['type' => 'research_complete', 'data' => [
                    'player' => (int)$p['player'], 'tech' => $p['tech_key'],
                ]];
            } else {
                $db->execute("UPDATE `player_tech` SET `progress`=? WHERE `id`=?",
                    [(float)max(0, $elapsed), (int)$p['id']], 'di');
            }
        }
    }

    /** Per-player tech catalogue with status, for GET /api/research/list. */
    public static function list(DB $db, int $matchId, int $player, int $tick): array {
        $active = self::activeProject($db, $matchId, $player);
        $out = [];
        foreach (GameConfig::TECH as $key => $t) {
            $done = self::isDone($db, $matchId, $player, $key);
            $isActive = $active && $active['tech_key'] === $key;
            $req = self::requirementsMet($db, $matchId, $player, $key);
            $status = $done ? 'done' : ($isActive ? 'researching' : ($req['ok'] ? 'available' : 'locked'));
            $entry = [
                'key'      => $key,
                'name'     => $t['name'],
                'requires' => $t['requires'],
                'research' => (int)($t['research'] ?? 0),
                'gold'     => (int)($t['gold'] ?? 0),
                'minerals' => (int)($t['minerals'] ?? 0),
                'labs'     => (int)($t['labs'] ?? 0),
                'days'     => (int)$t['days'],
                'unlocks'  => $t['unlocks'],
                'status'   => $status,
                'reasons'  => $req['reasons'],
            ];
            if ($isActive) {
                $entry['started_tick'] = (int)$active['started_tick'];
                $entry['ready_tick']   = (int)$active['started_tick'] + (int)$t['days'];
            }
            $out[] = $entry;
        }
        return $out;
    }
}
