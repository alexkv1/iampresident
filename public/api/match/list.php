<?php
// GET /api/match/list  -> open online lobbies + the user's own matches.
require __DIR__ . '/../../../utils/bootstrap.php';

$auth = require_auth();

$open = db()->select(
    "SELECT m.`id`, m.`name`, m.`mode`, m.`max_players`, m.`tick_interval_sec`,
            (SELECT COUNT(*) FROM `match_players` p WHERE p.`match_id` = m.`id`) AS players
       FROM `matches` m
      WHERE m.`status` = 'lobby' AND m.`mode` = 'online'
      ORDER BY m.`date_created` DESC
      LIMIT 50"
) ?: [];

$mine = db()->select(
    "SELECT m.`id`, m.`name`, m.`mode`, m.`status`, m.`join_code`, m.`current_tick`,
            (SELECT COUNT(*) FROM `match_players` p WHERE p.`match_id` = m.`id`) AS players
       FROM `matches` m
       JOIN `match_players` mp ON mp.`match_id` = m.`id` AND mp.`user` = ?
      WHERE m.`status` IN ('lobby', 'active')
      ORDER BY m.`date_created` DESC
      LIMIT 50",
    [$auth->user], 'i'
) ?: [];

json_ok(['open' => $open, 'mine' => $mine]);
