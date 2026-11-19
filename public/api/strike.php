<?php
// POST /api/strike { match_id, kind, target, from? } -> fire a strike (GAME_RULES §9).
// kind: artillery|air|srbm|mrbm|icbm|nuclear. `from` is a stack id for artillery/air.
require __DIR__ . '/../../utils/bootstrap.php';
require_once __DIR__ . '/../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../utils/engine/Strike.php';
require_method('POST');

$auth = require_auth();
[$matchId, $kind, $target] = require_fields(['match_id', 'kind', 'target']);
$matchId = (int)$matchId;
$kind    = (string)$kind;
$target  = (string)$target;
$from    = in('from', null);
$from    = ($from === null || $from === '') ? null : (int)$from;

$db = db();
$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);

$events = [];
$res = Strike::execute($db, $match, $me, $kind, $target, $from, $events);
if (!$res['ok']) json_err($res['message']);

// Persist strike events to the match log and push them to the room.
$tick = (int)$match['current_tick'];
foreach ($events as $e) {
    $db->execute(
        "INSERT INTO `match_events` (`match_id`, `tick`, `type`, `data`) VALUES (?, ?, ?, ?)",
        [$matchId, $tick, $e['type'], json_encode($e['data'] ?? [])], 'iiss'
    );
    realtime_emit($matchId, $e['type'], $e['data'] ?? []);
}

json_ok($res['data'] ?? ['kind' => $kind, 'target' => $target]);
