<?php
// POST /api/match/join { join_code } or { match_id }  -> join a lobby.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_method('POST');

$auth = require_auth();

$code    = trim((string)in('join_code', ''));
$matchId = (int)in('match_id', 0);

if ($code !== '') {
    $match = db()->selectOne("SELECT * FROM `matches` WHERE `join_code` = ?", [strtoupper($code)], 's');
} elseif ($matchId) {
    $match = db()->selectOne("SELECT * FROM `matches` WHERE `id` = ? AND `mode` = 'online'", [$matchId], 'i');
} else {
    json_err('Provide a join code or match id.');
}
if (!$match) json_err('Match not found.', 404);
if ($match['status'] !== 'lobby') json_err('This match has already started.', 409);

// Idempotent: already joined.
$existing = my_player((int)$match['id'], $auth->user);
if ($existing) json_ok(['match_id' => (int)$match['id']]);

// Capacity.
$countRow = db()->selectOne("SELECT COUNT(*) c, MAX(`slot`) m FROM `match_players` WHERE `match_id` = ?", [$match['id']], 'i');
if ((int)$countRow['c'] >= (int)$match['max_players']) json_err('This match is full.', 409);
$slot = (int)$countRow['m'] + 1;

db()->execute(
    "INSERT INTO `match_players` (`match_id`, `user`, `display_name`, `color`, `slot`)
     VALUES (?, ?, ?, ?, ?)",
    [$match['id'], $auth->user, $auth->display_name, GameConfig::COLORS[$slot % count(GameConfig::COLORS)], $slot],
    'iissi'
);

realtime_emit((int)$match['id'], 'lobby_update', ['joined' => $auth->display_name]);
json_ok(['match_id' => (int)$match['id']]);
