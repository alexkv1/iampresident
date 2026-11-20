<?php
// GET /api/match/get?match_id=&since_event=  -> full match state for the client.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Training.php';
require_once __DIR__ . '/../../../utils/engine/Economy.php';
require_once __DIR__ . '/../../../utils/engine/Research.php';
require_once __DIR__ . '/../../../utils/engine/Arsenal.php';
require_once __DIR__ . '/../../../utils/engine/Vision.php';
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

// Real per-tick net resource change for the requester, so the HUD can show an honest
// "+/- per day" instead of only subtracting army upkeep. Mirrors Tick.php's economy step:
// production×efficiency + pop tax − pop consumption − oil burned, then minus army upkeep.
$ecoBuildings = db()->select(
    "SELECT b.`type`, b.`level`, c.`farmland`, c.`minerals`, c.`oil`
       FROM `buildings` b
       JOIN `countries` c ON c.`code` = b.`country_code`
       LEFT JOIN `territories` t ON t.`match_id` = b.`match_id` AND t.`country_code` = b.`country_code`
      WHERE b.`match_id` = ? AND b.`player` = ? AND b.`status` = 'active'
        AND NOT (b.`type` = 'farm' AND t.`ruined_until` IS NOT NULL AND t.`ruined_until` > ?)",
    [$matchId, (int)$me['id'], (int)$match['current_tick']], 'iii'
) ?: [];
$ecoHome = db()->selectOne("SELECT `start_pop` FROM `countries` WHERE `code` = ?", [$me['country_code']], 's');
$ecoBasePopCap = (float)($ecoHome['start_pop'] ?? 1_000_000) * GameConfig::BASE_POP_CAP;
$eco = Economy::step($me, $ecoBuildings, $ecoBasePopCap);
$myDelta = [];
foreach (GameConfig::RESOURCES as $res) {
    $myDelta[$res] = (float)$eco['stock'][$res] - (float)$me[$res];   // production side of the tick
}
$myDelta['gold'] -= $myUpkeep['gold'];   // army upkeep is charged separately each tick
$myDelta['food'] -= $myUpkeep['food'];
$myDelta['oil']  -= $myUpkeep['oil'];
foreach ($myDelta as $k => $v) $myDelta[$k] = (int)round($v);

// In-progress research project (player_tech row at level 0) so the HUD can show a progress
// bar + "ready Day X" and mark the other techs as waiting instead of silently failing.
$rp = Research::activeProject(db(), $matchId, $myId);
$researchActive = null;
if ($rp) {
    $rt = GameConfig::TECH[$rp['tech_key']] ?? null;
    $rDays = $rt ? (int)$rt['days'] : 0;
    $researchActive = [
        'key'          => $rp['tech_key'],
        'started_tick' => (int)$rp['started_tick'],
        'days'         => $rDays,
        'ready_tick'   => (int)$rp['started_tick'] + $rDays,
    ];
}

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

// Fog of war (GAME_RULES §10): only armies the requester may see, a defence map
// (null = fogged enemy country), and the set of visible country codes.
$curTick = (int)$match['current_tick'];
$visibleArmies = [];
foreach (Vision::armies(db(), $matchId, $myId) as $a) {
    $visibleArmies[] = [
        'id'             => (int)$a['id'],
        'player'         => (int)$a['player'],
        'country_code'   => $a['country_code'],
        'units'          => Combat::units($a),
        'moving_to'      => $a['moving_to'],
        'origin'         => $a['origin'],
        'kind'           => $a['kind'],
        'path'           => $a['path'] ? json_decode($a['path'], true) : null,
        'depart_tick'    => $a['depart_tick'] !== null ? (int)$a['depart_tick'] : null,
        'arrive_at_tick' => $a['arrive_at_tick'] !== null ? (int)$a['arrive_at_tick'] : null,
        'mine'           => (int)$a['player'] === $myId,
    ];
}
$defence = Vision::defenceMap(db(), $matchId, $myId, $curTick);
$vision  = array_keys(Vision::visible(db(), $matchId, $myId));

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
        // In-progress training batches {country_code, unit, count, ready_tick} so the HUD can
        // show slots used/free and a ready-Day timer per batch.
        'training'     => Training::listForPlayer(db(), $matchId, $myId),
        // Honest net per-tick change per resource (production − consumption − upkeep), plus
        // the current energy efficiency (0..1) and population cap, for the HUD to display.
        'delta'        => $myDelta,
        'efficiency'   => round($eco['efficiency'], 3),
        'pop_cap'      => (int)round($eco['pop_cap']),
        // Tech levels (key=>0|1), the in-progress project, and strategic arsenal stock (§8, §9).
        'tech'            => Research::levels(db(), $matchId, $myId),
        'research_active' => $researchActive,
        'arsenal'         => Arsenal::stocks(db(), $matchId, $myId),
    ],
    'players'     => $players,
    'territories' => $territories,
    'buildings'   => $buildings,
    'armies'      => $visibleArmies,
    'defence'     => $defence,
    'vision'      => $vision,
    'events'      => $events,
    'diplomacy'   => $relations,
    'proposals'   => $proposals,
    'catalog'     => GameConfig::BUILDINGS,
]);
