<?php
// POST /api/diplomacy/respond { match_id, id, accept } — accept/decline a proposal.
// On accept the effect (alliance / truce / access) is applied (GAME_RULES §7).
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Diplomacy.php';
require_method('POST');

$auth = require_auth();
[$matchId, $propId] = require_fields(['match_id', 'id']);
$matchId = (int)$matchId;
$propId  = (int)$propId;
$accept  = filter_var(in('accept', false), FILTER_VALIDATE_BOOLEAN);

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me   = require_player($matchId, $auth->user);
$tick = (int)$match['current_tick'];

$res = Diplomacy::respond(db(), $matchId, $propId, (int)$me['id'], $accept, $tick);
if (!$res['ok']) json_err($res['message']);

$evt = $accept ? 'proposal_accepted' : 'proposal_declined';
realtime_emit($matchId, $evt, [
    'id' => $propId, 'type' => $res['type'], 'from' => $res['from'], 'to' => (int)$me['id'],
]);

json_ok(['id' => $propId, 'type' => $res['type'], 'from' => $res['from'], 'accepted' => $accept]);
