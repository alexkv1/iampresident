<?php
// POST /api/match/start { match_id }  -> host launches the match.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/Tick.php'; // pulls in MatchSetup + GameConfig
require_method('POST');

$auth = require_auth();
$matchId = (int)in('match_id', 0);
if (!$matchId) json_err('Missing match_id.');

$match = load_match($matchId);
if ((int)$match['host_user'] !== $auth->user) json_err('Only the host can start the match.', 403);

$res = MatchSetup::start(db(), $match);
if (!$res['ok']) json_err($res['message']);

realtime_emit($matchId, 'match_started', []);
json_ok(['message' => $res['message']]);
