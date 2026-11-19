<?php
// POST /api/player/setReady { match_id, ready }  -> toggle lobby ready state.
require __DIR__ . '/../../../utils/bootstrap.php';
require_method('POST');

$auth = require_auth();
$matchId = (int)in('match_id', 0);
if (!$matchId) json_err('Missing match_id.');
$ready = (int)in('ready', 1) ? 1 : 0;

$match = load_match($matchId);
if ($match['status'] !== 'lobby') json_err('Match already started.', 409);
$me = require_player($matchId, $auth->user);

db()->execute("UPDATE `match_players` SET `is_ready` = ? WHERE `id` = ?", [$ready, $me['id']], 'ii');
realtime_emit($matchId, 'lobby_update', ['player' => (int)$me['id'], 'ready' => $ready]);
json_ok(['ready' => $ready]);
