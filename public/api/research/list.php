<?php
// GET /api/research/list?match_id= -> the tech tree with per-player status (GAME_RULES §8).
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Research.php';

$auth = require_auth();
$matchId = (int)in('match_id', 0);
if (!$matchId) json_err('Missing match_id.');

$match = load_match($matchId);
$me    = require_player($matchId, $auth->user);
$tick  = (int)$match['current_tick'];

json_ok([
    'tech'      => Research::list(db(), $matchId, (int)$me['id'], $tick),
    'research'  => (float)$me['research'],
    'gold'      => (float)$me['gold'],
    'minerals'  => (float)$me['minerals'],
    'labs'      => Research::labCount(db(), $matchId, (int)$me['id']),
]);
