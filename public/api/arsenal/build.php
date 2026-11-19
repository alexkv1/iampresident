<?php
// POST /api/arsenal/build { match_id, item } -> build a missile / warhead (GAME_RULES §9).
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Research.php';
require_once __DIR__ . '/../../../utils/engine/Arsenal.php';
require_method('POST');

$auth = require_auth();
[$matchId, $item] = require_fields(['match_id', 'item']);
$matchId = (int)$matchId;
$item    = (string)$item;

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);

$res = Arsenal::build(db(), $match, $me, $item);
if (!$res['ok']) json_err($res['message']);

realtime_emit($matchId, 'arsenal_building', [
    'player' => (int)$me['id'], 'item' => $item, 'ready_tick' => $res['ready_tick'],
]);

json_ok(['item' => $item, 'ready_tick' => $res['ready_tick'], 'days' => $res['days']]);
