<?php
// GET /api/match/get?match_id=&since_event=  -> full match state for the client.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';

$auth = require_auth();
$matchId = (int)in('match_id', 0);
if (!$matchId) json_err('Missing match_id.');

$match = load_match($matchId);
$me = require_player($matchId, $auth->user);
$since = (int)in('since_event', 0);

// Territory counts per owner.
$counts = [];
foreach (db()->select("SELECT `owner`, COUNT(*) c FROM `territories` WHERE `match_id` = ? AND `owner` IS NOT NULL GROUP BY `owner`", [$matchId], 'i') ?: [] as $r) {
    $counts[(int)$r['owner']] = (int)$r['c'];
}

$players = [];
foreach (db()->select("SELECT * FROM `match_players` WHERE `match_id` = ? ORDER BY `slot`", [$matchId], 'i') ?: [] as $p) {
    $pub = player_public($p, true);
    $pub['territories'] = $counts[(int)$p['id']] ?? 0;
    $players[] = $pub;
}

$territories = db()->select(
    "SELECT `country_code`, `owner`, `is_capital` FROM `territories` WHERE `match_id` = ? AND `owner` IS NOT NULL",
    [$matchId], 'i'
) ?: [];

$buildings = db()->select(
    "SELECT `id`, `country_code`, `type`, `status`, `level`, `complete_at_tick`
       FROM `buildings` WHERE `match_id` = ? AND `player` = ? ORDER BY `id`",
    [$matchId, $me['id']], 'ii'
) ?: [];

$events = db()->select(
    "SELECT `id`, `tick`, `type`, `data` FROM `match_events`
      WHERE `match_id` = ? AND `id` > ? ORDER BY `id` ASC LIMIT 100",
    [$matchId, $since], 'ii'
) ?: [];
foreach ($events as &$e) { $e['data'] = $e['data'] ? json_decode($e['data'], true) : null; }
unset($e);

json_ok([
    'match' => [
        'id'                => (int)$match['id'],
        'name'              => $match['name'],
        'mode'              => $match['mode'],
        'status'            => $match['status'],
        'current_tick'      => (int)$match['current_tick'],
        'tick_interval_sec' => (int)$match['tick_interval_sec'],
        'next_tick_at'      => $match['next_tick_at'],
        'max_players'       => (int)$match['max_players'],
        'host_user'         => (int)$match['host_user'],
        'winner_player'     => $match['winner_player'] !== null ? (int)$match['winner_player'] : null,
        'join_code'         => ((int)$match['host_user'] === $auth->user) ? $match['join_code'] : null,
    ],
    'me' => [
        'player_id'    => (int)$me['id'],
        'is_host'      => (int)$me['is_host'],
        'country_code' => $me['country_code'],
        'is_ready'     => (int)$me['is_ready'],
        'color'        => $me['color'],
    ],
    'players'     => $players,
    'territories' => $territories,
    'buildings'   => $buildings,
    'events'      => $events,
    'catalog'     => GameConfig::BUILDINGS,
]);
