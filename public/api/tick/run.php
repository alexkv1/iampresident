<?php
// POST /api/tick/run  (Authorization: Bearer <internal-key>)
// Advances every active match whose next_tick_at is due. Lets a cron or the
// Node server drive ticks over HTTP as an alternative to the CLI daemon.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/Tick.php';

$hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$key = conf()['internal-key'] ?? '';
if (stripos($hdr, 'Bearer ') !== 0 || substr($hdr, 7) !== $key || $key === '') {
    json_err('Unauthorized.', 401);
}

$due = db()->select(
    "SELECT * FROM `matches` WHERE `status` = 'active' AND (`next_tick_at` IS NULL OR `next_tick_at` <= NOW())",
    []
) ?: [];

$processed = [];
foreach ($due as $match) {
    $events = Tick::process(db(), $match);
    $processed[] = ['match_id' => (int)$match['id'], 'events' => count($events)];
    realtime_emit((int)$match['id'], 'tick', ['tick' => (int)$match['current_tick'] + 1]);
}

json_ok(['processed' => $processed]);
