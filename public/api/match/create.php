<?php
// POST /api/match/create { name?, mode, max_players?, tick_interval?, ai_count? }
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_method('POST');

$auth = require_auth();

$name   = trim((string)in('name', '')) ?: ($auth->display_name . "'s game");
$name   = mb_substr($name, 0, 96);
$mode   = (string)in('mode', 'online');
if (!in_array($mode, ['online', 'private', 'single'], true)) json_err('Invalid mode.');

$maxPlayers = max(2, min(12, (int)in('max_players', 8)));
$interval   = max(5, min(120, (int)in('tick_interval', 20)));
$aiCount    = max(0, min($maxPlayers - 1, (int)in('ai_count', $mode === 'single' ? 3 : 0)));

// Unique join code for private rooms.
$code = null;
if ($mode === 'private') {
    do { $code = join_code(6); }
    while (db()->selectOne("SELECT id FROM `matches` WHERE `join_code` = ?", [$code], 's'));
}

db()->execute(
    "INSERT INTO `matches` (`name`, `join_code`, `mode`, `status`, `max_players`, `tick_interval_sec`, `host_user`, `settings`)
     VALUES (?, ?, ?, 'lobby', ?, ?, ?, ?)",
    [$name, $code, $mode, $maxPlayers, $interval, $auth->user, json_encode(['ai_count' => $aiCount])],
    'sssiiis'
);
$matchId = db()->lastInsertId();

// Host as slot 0.
db()->execute(
    "INSERT INTO `match_players` (`match_id`, `user`, `display_name`, `color`, `slot`, `is_host`)
     VALUES (?, ?, ?, ?, 0, 1)",
    [$matchId, $auth->user, $auth->display_name, GameConfig::COLORS[0]],
    'iiss'
);

// Fill with AI opponents.
for ($i = 0; $i < $aiCount; $i++) {
    $slot = $i + 1;
    db()->execute(
        "INSERT INTO `match_players` (`match_id`, `is_ai`, `ai_level`, `display_name`, `color`, `slot`, `is_ready`)
         VALUES (?, 1, ?, ?, ?, ?, 1)",
        [$matchId, random_int(1, 3), 'CPU ' . $slot, GameConfig::COLORS[$slot % count(GameConfig::COLORS)], $slot],
        'iissi'
    );
}

json_ok(['match_id' => $matchId, 'join_code' => $code, 'mode' => $mode]);
