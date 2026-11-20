<?php
// POST /api/trade/propose { match_id, player, give, receive } — offer a resource trade (§7).
// `give` and `receive` are JSON objects, e.g. give={"gold":500}, receive={"food":300}.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Trade.php';
require_method('POST');

$auth = require_auth();
[$matchId, $to] = require_fields(['match_id', 'player']);
$matchId = (int)$matchId;
$to      = (int)$to;
$give    = json_decode((string)in('give', '{}'), true);
$receive = json_decode((string)in('receive', '{}'), true);
if (!is_array($give)) $give = [];
if (!is_array($receive)) $receive = [];

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);

$res = Trade::propose(db(), $match, (int)$me['id'], $to, $give, $receive);
if (!$res['ok']) json_err($res['message']);

realtime_emit($matchId, 'trade_offer', ['id' => $res['id'], 'from' => (int)$me['id'], 'to' => $to]);

json_ok(['id' => $res['id'], 'to' => $to]);
