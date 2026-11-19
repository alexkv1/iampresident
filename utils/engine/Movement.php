<?php
// Strategic movement: centroids, great-circle distance, land/sea routing.
// Reproduces ui_kits/game/hud/hudGeo.js so the server and client agree exactly
// (GAME_RULES §2). All tunables live in GameConfig.

final class Movement {

    /** Per-match centroid cache: [matchKeyIgnored => [code => [lon,lat]]]. Static per process. */
    private static array $centCache = [];
    private static bool  $centLoaded = false;

    /**
     * Load every country centroid (lon/lat) once. The DB already stores the
     * hudGeo centroid (gen_countries.js applies the same CENTROID_OVERRIDE and
     * centroidOf), so no extra override is needed here.
     */
    public static function loadCentroids(DB $db): array {
        if (self::$centLoaded) return self::$centCache;
        self::$centCache = [];
        foreach ($db->select("SELECT `code`, `lon`, `lat` FROM `countries`") ?: [] as $r) {
            if ($r['lon'] === null || $r['lat'] === null) continue;
            self::$centCache[$r['code']] = [(float)$r['lon'], (float)$r['lat']];
        }
        self::$centLoaded = true;
        return self::$centCache;
    }

    /** Centroid [lon,lat] for one country, or null. */
    public static function centroid(DB $db, string $code): ?array {
        self::loadCentroids($db);
        return self::$centCache[$code] ?? null;
    }

    /** Great-circle separation of two centroids in degrees (hudGeo.angleDeg). */
    public static function angleDeg(array $a, array $b): float {
        $r = M_PI / 180;
        $d = sin($a[1] * $r) * sin($b[1] * $r)
           + cos($a[1] * $r) * cos($b[1] * $r) * cos(($a[0] - $b[0]) * $r);
        $d = max(-1.0, min(1.0, $d));
        return acos($d) / $r;
    }

    /** Great-circle distance between two countries in km (hudGeo.km). */
    public static function km(DB $db, string $a, string $b): float {
        $ca = self::centroid($db, $a);
        $cb = self::centroid($db, $b);
        if (!$ca || !$cb) return 0.0;
        return self::angleDeg($ca, $cb) * GameConfig::KM_PER_DEG;
    }

    /** Sum of leg distances × ROAD_FACTOR for a path of codes (hudGeo.pathKm). */
    public static function pathKm(DB $db, array $codes): float {
        $s = 0.0;
        for ($i = 0; $i < count($codes) - 1; $i++) {
            $s += self::km($db, $codes[$i], $codes[$i + 1]);
        }
        return $s * GameConfig::ROAD_FACTOR;
    }

    /** Land neighbours of a country (from country_neighbors — already includes hudGeo EXTRA_LINKS). */
    public static function neighbors(DB $db, string $code): array {
        $out = [];
        foreach ($db->select("SELECT `neighbor` FROM `country_neighbors` WHERE `country` = ?", [$code], 's') ?: [] as $r) {
            $out[] = $r['neighbor'];
        }
        return $out;
    }

    /**
     * Shortest land path from -> to where every INTERMEDIATE country passes
     * $passable(code). The target itself may be anything attackable (hudGeo.landPath).
     * Returns a list of codes [from, ..., to] or null if no route.
     */
    public static function landPath(DB $db, string $from, string $to, callable $passable): ?array {
        if ($from === $to) return [$from];

        // Preload the whole adjacency map once for this BFS (one query).
        $adj = [];
        foreach ($db->select("SELECT `country`, `neighbor` FROM `country_neighbors`") ?: [] as $r) {
            $adj[$r['country']][] = $r['neighbor'];
        }

        $prev = [$from => null];
        $q = [$from];
        while ($q) {
            $c = array_shift($q);
            foreach ($adj[$c] ?? [] as $n) {
                if (array_key_exists($n, $prev)) continue;
                if ($n !== $to && !$passable($n)) continue;
                $prev[$n] = $c;
                if ($n === $to) {
                    $path = [$to];
                    $x = $c;
                    while ($x !== null) { array_unshift($path, $x); $x = $prev[$x]; }
                    return $path;
                }
                $q[] = $n;
            }
        }
        return null;
    }

    /** Count of land units in a units JSON map. */
    public static function landUnitCount(array $units): int {
        $n = 0;
        foreach ($units as $k => $c) {
            if (GameConfig::isLandUnit((string)$k)) $n += (int)$c;
        }
        return $n;
    }

    /** Stack speed = slowest present land unit (navy/air excluded) — hudGeo.stackSpeed. */
    public static function stackSpeed(array $units): int {
        $min = null;
        foreach ($units as $k => $c) {
            if ((int)$c <= 0) continue;
            if ($k === 'navy' || $k === 'air') continue;
            $u = GameConfig::unit((string)$k);
            if (!$u) continue;
            $sp = (int)$u['speed'];
            if ($min === null || $sp < $min) $min = $sp;
        }
        return $min ?? 0;
    }

    /** Days for a march: max(1, ceil(km / speed)). */
    public static function days(float $km, int $speed): int {
        if ($speed <= 0) return 1;
        return max(1, (int)ceil($km / $speed));
    }

    /** Is a country coastal (sea-route endpoint)? */
    public static function coastal(DB $db, string $code): bool {
        $r = $db->selectOne("SELECT `coastal` FROM `countries` WHERE `code` = ?", [$code], 's');
        return $r ? ((int)$r['coastal'] === 1) : false;
    }

    /** Owner (match_players.id) of a country in a match, or null if neutral/unknown. */
    public static function ownerOf(DB $db, int $matchId, string $code): ?int {
        $t = $db->selectOne(
            "SELECT `owner` FROM `territories` WHERE `match_id` = ? AND `country_code` = ?",
            [$matchId, $code], 'is'
        );
        if (!$t || $t['owner'] === null) return null;
        return (int)$t['owner'];
    }

    /** Display name of a country (hudGeo cname). */
    public static function cname(DB $db, string $code): string {
        $r = $db->selectOne("SELECT `name` FROM `countries` WHERE `code` = ?", [$code], 's');
        return $r['name'] ?? $code;
    }

    /**
     * Build the passable(code) predicate for a mover (hudGeo passable = hasAccess(ownerOf)):
     * an intermediate country is passable if it is the mover's own land, or belongs to a
     * player who has granted the mover military access (GAME_RULES §2/§7).
     */
    public static function passableFn(DB $db, int $matchId, int $mover): callable {
        return function (string $code) use ($db, $matchId, $mover): bool {
            $owner = self::ownerOf($db, $matchId, $code);
            if ($owner === null) return false;             // neutral blocks
            if ($owner === $mover) return true;            // own land
            return Diplomacy::hasAccess($db, $matchId, $owner, $mover);
        };
    }

    /**
     * Attack-permission block for marching into a target's land (hudGeo attackBlock),
     * returning the exact refusal string, 'allied', or null if allowed.
     *   null      -> allowed (neutral target, own, or at war)
     *   'allied'  -> target is an ally (needs access instead)
     *   string    -> truce / declare-war refusal wording
     */
    public static function attackBlock(DB $db, int $matchId, int $mover, string $target, int $tick): ?string {
        $owner = self::ownerOf($db, $matchId, $target);
        if ($owner === null) return null;                  // neutral: attack anytime
        if ($owner === $mover) return null;                // own land: reinforce
        $state = Diplomacy::state($db, $matchId, $mover, $owner);
        if ($state === 'war') return null;
        if ($state === 'allied') return 'allied';
        $left = Diplomacy::truceLeft($db, $matchId, $mover, $owner, $tick);
        $oname = self::cname($db, $target);
        $pname = self::playerLandName($db, $matchId, $owner);
        if ($left > 0) {
            return 'Truce with ' . $pname . ' · ' . $left . ' days left. Truces can’t be broken.';
        }
        return 'Declare war on ' . $pname . ' first (Diplomacy).';
    }

    /** A player's display name for diplomacy wording (their leader persona). */
    public static function playerLandName(DB $db, int $matchId, int $playerId): string {
        $p = $db->selectOne("SELECT `display_name` FROM `match_players` WHERE `id` = ?", [$playerId], 'i');
        return $p['display_name'] ?? ('Player ' . $playerId);
    }
}
