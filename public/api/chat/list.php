<?php
// GET /api/chat/list?match_id=&since_id=  -> recent chat messages.
require __DIR__ . '/../../../utils/bootstrap.php';

$auth = require_auth();
$matchId = (int)in('match_id', 0);
if (!$matchId) json_err('Missing match_id.');
$since = (int)in('since_id', 0);

require_player($matchId, $auth->user);

$rows = db()->select(
    "SELECT c.`id`, c.`player`, c.`scope`, c.`body`, c.`date_created`,
            p.`display_name` AS name, p.`color`
       FROM `chat_messages` c
       LEFT JOIN `match_players` p ON p.`id` = c.`player`
      WHERE c.`match_id` = ? AND c.`id` > ?
      ORDER BY c.`id` ASC LIMIT 100",
    [$matchId, $since], 'ii'
) ?: [];

json_ok(['messages' => $rows]);
