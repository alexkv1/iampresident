<?php
// POST /api/diplomacy/declare-war { match_id, player } — unilateral war declaration.
// Refused while a truce holds (GAME_RULES §7). You must be at war to attack a player.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Diplomacy.php';
require_method('POST');

$auth = require_auth();
[$matchId, $to] = require_fields(['match_id', 'player']);
$matchId = (int)$matchId;
$to      = (int)$to;

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me   = require_player($matchId, $auth->user);
$tick = (int)$match['current_tick'];

$res = Diplomacy::declareWar(db(), $matchId, (int)$me['id'], $to, $tick);
if (!$res['ok']) json_err($res['message']);

realtime_emit($matchId, 'war', ['from' => (int)$me['id'], 'to' => $to]);

json_ok(['from' => (int)$me['id'], 'to' => $to, 'state' => 'war']);
