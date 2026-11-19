<?php
// Tick worker — the game's heartbeat.
//   php worker/tick.php          run forever (systemd service)
//   php worker/tick.php --once   process all due matches once and exit (tests/cron)
//
// Advances every active match whose next_tick_at has passed. All game rules
// live in PHP; this just drives the clock.

require __DIR__ . '/../utils/bootstrap.php';
require_once __DIR__ . '/../utils/engine/Tick.php';

$once = in_array('--once', $argv, true);
$quiet = in_array('--quiet', $argv, true);

function out(string $msg, bool $quiet): void {
    if (!$quiet) fwrite(STDOUT, '[' . date('H:i:s') . "] $msg\n");
}

$running = true;
if (function_exists('pcntl_signal')) {
    pcntl_signal(SIGTERM, function () use (&$running) { $running = false; });
    pcntl_signal(SIGINT,  function () use (&$running) { $running = false; });
}

out('Tick worker started' . ($once ? ' (one-shot)' : ''), $quiet);

do {
    try {
        $db = new DB();
        $due = $db->select(
            "SELECT * FROM `matches`
              WHERE `status` = 'active' AND (`next_tick_at` IS NULL OR `next_tick_at` <= NOW())",
            []
        ) ?: [];

        foreach ($due as $match) {
            $events = Tick::process($db, $match);
            realtime_emit((int)$match['id'], 'tick', ['tick' => (int)$match['current_tick'] + 1]);
            out("match {$match['id']}: tick " . ((int)$match['current_tick'] + 1) . ', ' . count($events) . ' events', $quiet);
        }
        $db->close();
    } catch (Throwable $e) {
        out('ERROR: ' . $e->getMessage(), $quiet);
    }

    if ($once) break;
    if (function_exists('pcntl_signal_dispatch')) pcntl_signal_dispatch();
    sleep(1);
} while ($running);

out('Tick worker stopped', $quiet);
