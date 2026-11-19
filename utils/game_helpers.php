<?php
// Small helpers shared across game API endpoints.

/** Current leader row for a country, or null. */
function get_leader(string $code): ?array {
    return db()->selectOne("SELECT `name`, `title` FROM `country_leaders` WHERE `code` = ?", [$code], 's');
}

/**
 * The persona a player adopts when leading a country: the real leader if we
 * have one, otherwise a generic "<Title> of <Country>". Returns [name, title].
 */
function leader_persona(string $code, string $countryName): array {
    $l = get_leader($code);
    if ($l) return ['name' => $l['name'], 'title' => $l['title']];
    // No seeded leader: the generic name already reads as a title, so leave title null.
    return ['name' => 'President of ' . $countryName, 'title' => null];
}

/** Load a match row or stop with 404. */
function load_match(int $id): array {
    $m = db()->selectOne("SELECT * FROM `matches` WHERE `id` = ?", [$id], 'i');
    if (!$m) json_err('Match not found.', 404);
    return $m;
}

/** The requesting user's match_players row, or null. */
function my_player(int $matchId, int $userId): ?array {
    return db()->selectOne(
        "SELECT * FROM `match_players` WHERE `match_id` = ? AND `user` = ?",
        [$matchId, $userId], 'ii'
    );
}

/** Require that the current user is a player in the match; returns their row. */
function require_player(int $matchId, int $userId): array {
    $p = my_player($matchId, $userId);
    if (!$p) json_err('You are not in this match.', 403);
    return $p;
}

/** Public-facing view of a player row (numbers are floored for display). */
function player_public(array $p, bool $full): array {
    $out = [
        'id'           => (int)$p['id'],
        'display_name' => $p['display_name'],
        'leader_title' => $p['leader_title'] ?? null,
        'is_ai'        => (int)$p['is_ai'],
        'color'        => $p['color'],
        'slot'         => (int)$p['slot'],
        'is_host'      => (int)$p['is_host'],
        'is_ready'     => (int)$p['is_ready'],
        'country_code' => $p['country_code'],
        'status'       => $p['status'],
        'pop'          => (int)$p['pop'],
    ];
    if ($full) {
        foreach (['food', 'energy', 'minerals', 'gold', 'oil', 'research'] as $r) {
            $out[$r] = (float)$p[$r];
        }
    }
    return $out;
}
