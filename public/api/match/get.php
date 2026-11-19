<?php
// GET /api/match/get?match_id=&since_event=  -> full match state for the client.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Training.php';
require_once __DIR__ . '/../../../utils/engine/Economy.php';
require_once __DIR__ . '/../../../utils/engine/Research.php';
require_once __DIR__ . '/../../../utils/engine/Arsenal.php';
require_once __DIR__ . '/../../../utils/engine/Tick.php';

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

// Weighted world shares per player (GAME_RULES §5).
$shares = Tick::worldShares(db(), $matchId);

$players = [];
foreach (db()->select("SELECT * FROM `match_players` WHERE `match_id` = ? ORDER BY `slot`", [$matchId], 'i') ?: [] as $p) {
    $pub = player_public($p, true);
    $pub['territories'] = $counts[(int)$p['id']] ?? 0;
    $pub['share'] = round($shares[(int)$p['id']] ?? 0.0, 4);
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

// Army economy for the requester (GAME_RULES §1): manpower in use vs limit, and the
// per-tick upkeep the client should subtract from the displayed resource deltas.
$myArmies = db()->select("SELECT `units` FROM `armies` WHERE `match_id` = ? AND `player` = ?", [$matchId, $me['id']], 'ii') ?: [];
$myUpkeep = Economy::upkeep($myArmies);
$manpower = [
    'used'  => Training::manpowerUsed(db(), $matchId, (int)$me['id']),
    'limit' => GameConfig::manpowerLimit((float)$me['pop']),
];

// Diplomacy relations touching the requester, plus proposals in flight (GAME_RULES §7).
$myId = (int)$me['id'];
$relations = [];
foreach (db()->select("SELECT * FROM `diplomacy` WHERE `match_id`=? AND (`player_a`=? OR `player_b`=?)", [$matchId, $myId, $myId], 'iii') ?: [] as $d) {
    $a = (int)$d['player_a']; $b = (int)$d['player_b'];
    $mineIsA = ($a === $myId);
    $relations[] = [
        'player'          => $mineIsA ? $b : $a,
        'state'           => $d['state'],
        'truce_until'     => $d['truce_until'] !== null ? (int)$d['truce_until'] : null,
        'access_granted'  => ($mineIsA ? (int)$d['access_ab'] : (int)$d['access_ba']) === 1, // I let them through
        'access_received' => ($mineIsA ? (int)$d['access_ba'] : (int)$d['access_ab']) === 1, // I may cross theirs
    ];
}
$proposals = [];
foreach (db()->select(
    "SELECT * FROM `diplomacy_proposals`
      WHERE `match_id`=? AND `status`='pending' AND `expires_tick` > ? AND (`to_player`=? OR `from_player`=?)
      ORDER BY `id`",
    [$matchId, (int)$match['current_tick'], $myId, $myId], 'iiii') ?: [] as $p) {
    $proposals[] = [
        'id' => (int)$p['id'], 'from' => (int)$p['from_player'], 'to' => (int)$p['to_player'],
        'type' => $p['type'], 'expires_tick' => (int)$p['expires_tick'],
        'incoming' => (int)$p['to_player'] === $myId,
    ];
}

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
        // Manpower {used,limit} and per-tick army upkeep {gold,food,oil}. The
        // economy deltas the client derives from building output are GROSS of
        // upkeep — subtract this `upkeep` per resource to show the net change.
        'manpower'     => $manpower,
        'upkeep'       => ['gold' => $myUpkeep['gold'], 'food' => $myUpkeep['food'], 'oil' => $myUpkeep['oil']],
        // Tech levels (key=>0|1) and strategic arsenal stock (GAME_RULES §8, §9).
        'tech'         => Research::levels(db(), $matchId, $myId),
        'arsenal'      => Arsenal::stocks(db(), $matchId, $myId),
    ],
    'players'     => $players,
    'territories' => $territories,
    'buildings'   => $buildings,
    'events'      => $events,
    'diplomacy'   => $relations,
    'proposals'   => $proposals,
    'catalog'     => GameConfig::BUILDINGS,
]);
