<?php
// POST /api/admin/setLeader  (Authorization: Bearer <internal-key>)
//   { code, name, title? }
// Updates a country's current leader and propagates the new persona to every
// player of that country in matches that are still in the lobby or running —
// so a real-world election is reflected immediately, even mid-game.
require __DIR__ . '/../../../utils/bootstrap.php';
require_method('POST');

$hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$key = conf()['internal-key'] ?? '';
if (stripos($hdr, 'Bearer ') !== 0 || substr($hdr, 7) !== $key || $key === '') {
    json_err('Unauthorized.', 401);
}

[$code, $name] = require_fields(['code', 'name']);
$code = strtoupper(substr((string)$code, 0, 3));
$name = mb_substr(trim((string)$name), 0, 96);
$title = mb_substr(trim((string)in('title', 'President')), 0, 48) ?: 'President';

if (!db()->selectOne("SELECT `code` FROM `countries` WHERE `code` = ?", [$code], 's')) {
    json_err('Unknown country code.', 404);
}

db()->execute(
    "INSERT INTO `country_leaders` (`code`, `name`, `title`) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `title` = VALUES(`title`), `date_updated` = NOW()",
    [$code, $name, $title], 'sss'
);

// Propagate to live lobbies and running games.
db()->execute(
    "UPDATE `match_players` mp
       JOIN `matches` m ON m.`id` = mp.`match_id`
        SET mp.`display_name` = ?, mp.`leader_title` = ?
      WHERE mp.`country_code` = ? AND m.`status` IN ('lobby', 'active')",
    [$name, $title, $code], 'sss'
);
$updated = db()->affectedRows();

json_ok(['code' => $code, 'name' => $name, 'title' => $title, 'live_players_updated' => $updated]);
