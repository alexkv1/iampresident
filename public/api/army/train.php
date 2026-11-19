<?php
// POST /api/army/train { match_id, type, country_code, count? }
// Trains batches of 5 (GAME_RULES §1a). count = how many batches to start (default 1);
// each batch needs its own free slot, manpower and cost. Returns refreshed stockpiles.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Training.php';
require_method('POST');

$auth = require_auth();
[$matchId, $type, $code] = require_fields(['match_id', 'type', 'country_code']);
$matchId = (int)$matchId;
$type = (string)$type;
$code = strtoupper(substr((string)$code, 0, 3));
$batches = max(1, (int)in('count', 1));

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);

$started = [];
for ($i = 0; $i < $batches; $i++) {
    // Re-read the player each batch so manpower/cost checks see prior deductions.
    $me = db()->selectOne("SELECT * FROM `match_players` WHERE `id` = ?", [$me['id']], 'i');
    $res = Training::start(db(), $match, $me, $code, $type);
    if (!$res['ok']) {
        // Partial success is fine — report what did start, then the stopping reason.
        if (!$started) json_err($res['message']);
        break;
    }
    $started[] = ['training_id' => $res['training_id'], 'ready_tick' => $res['ready_tick'], 'count' => $res['count']];
}

$me = db()->selectOne("SELECT * FROM `match_players` WHERE `id` = ?", [$me['id']], 'i');
realtime_emit($matchId, 'training_started', ['unit' => $type, 'country' => $code, 'batches' => count($started)]);

json_ok([
    'message'   => count($started) . ' batch' . (count($started) === 1 ? '' : 'es') . ' of ' . GameConfig::TRAIN_BATCH . ' ' . $type . ' training.',
    'started'   => $started,
    'resources' => [
        'food' => (float)$me['food'], 'energy' => (float)$me['energy'], 'minerals' => (float)$me['minerals'],
        'gold' => (float)$me['gold'], 'oil' => (float)$me['oil'], 'research' => (float)$me['research'],
    ],
]);
