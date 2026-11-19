<?php
// POST /api/diplomacy/propose { match_id, player, type } — offer alliance|truce|access.
// The other side must accept (GAME_RULES §7). Proposals expire after 3 ticks.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Diplomacy.php';
require_method('POST');

$auth = require_auth();
[$matchId, $to, $type] = require_fields(['match_id', 'player', 'type']);
$matchId = (int)$matchId;
$to      = (int)$to;
$type    = (string)$type;

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me   = require_player($matchId, $auth->user);
$tick = (int)$match['current_tick'];

$res = Diplomacy::propose(db(), $matchId, (int)$me['id'], $to, $type, $tick);
if (!$res['ok']) json_err($res['message']);

realtime_emit($matchId, 'proposal', [
    'id' => $res['id'], 'from' => (int)$me['id'], 'to' => $to,
    'type' => $type, 'expires_tick' => $res['expires_tick'],
]);

json_ok(['id' => $res['id'], 'type' => $type, 'to' => $to, 'expires_tick' => $res['expires_tick']]);
