<?php
// POST /api/trade/respond { match_id, id, accept } — accept/decline a trade offer (§7).
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Trade.php';
require_method('POST');

$auth = require_auth();
[$matchId, $tradeId] = require_fields(['match_id', 'id']);
$matchId = (int)$matchId;
$tradeId = (int)$tradeId;
$accept  = filter_var(in('accept', false), FILTER_VALIDATE_BOOLEAN);

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);

$res = Trade::respond(db(), $match, $tradeId, (int)$me['id'], $accept);
if (!$res['ok']) json_err($res['message']);

realtime_emit($matchId, $accept ? 'trade_accepted' : 'trade_declined', [
    'id' => $tradeId, 'to' => (int)$me['id'], 'from' => $res['from'] ?? null,
]);

json_ok(['id' => $tradeId, 'accepted' => !!$res['accepted']]);
