<?php
// POST /api/research/start { match_id, key } -> begin a research project (GAME_RULES §8).
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Research.php';
require_method('POST');

$auth = require_auth();
[$matchId, $key] = require_fields(['match_id', 'key']);
$matchId = (int)$matchId;
$key     = (string)$key;

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);

$res = Research::start(db(), $match, $me, $key);
if (!$res['ok']) json_err($res['message']);

realtime_emit($matchId, 'research_started', [
    'player' => (int)$me['id'], 'tech' => $key, 'ready_tick' => $res['ready_tick'],
]);

json_ok(['tech' => $key, 'ready_tick' => $res['ready_tick'], 'days' => $res['days']]);
