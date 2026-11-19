<?php
// POST /api/build/queue { match_id, country_code, type }  -> start construction.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Build.php';
require_method('POST');

$auth = require_auth();
[$matchId, $code, $type] = require_fields(['match_id', 'country_code', 'type']);
$matchId = (int)$matchId;
$code = strtoupper(substr((string)$code, 0, 3));

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);

$res = Build::start(db(), $match, $me, $code, (string)$type);
if (!$res['ok']) json_err($res['message']);

// Return refreshed stockpiles.
$me = db()->selectOne("SELECT * FROM `match_players` WHERE `id` = ?", [$me['id']], 'i');
realtime_emit($matchId, 'match_updated', ['build' => $type, 'country' => $code]);

json_ok([
    'message'          => $res['message'],
    'building_id'      => $res['building_id'] ?? null,
    'complete_at_tick' => $res['complete_at_tick'] ?? null,
    'resources'        => [
        'food' => (float)$me['food'], 'energy' => (float)$me['energy'], 'minerals' => (float)$me['minerals'],
        'gold' => (float)$me['gold'], 'oil' => (float)$me['oil'], 'research' => (float)$me['research'],
    ],
]);
