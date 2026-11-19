<?php
// POST /api/chat/send { match_id, body, scope? }  -> post a chat message.
require __DIR__ . '/../../../utils/bootstrap.php';
require_method('POST');

$auth = require_auth();
[$matchId, $body] = require_fields(['match_id', 'body']);
$matchId = (int)$matchId;
$body = mb_substr(trim((string)$body), 0, 500);
if ($body === '') json_err('Empty message.');
$scope = in('scope', 'all') === 'team' ? 'team' : 'all';

$match = load_match($matchId);
$me = require_player($matchId, $auth->user);

db()->execute(
    "INSERT INTO `chat_messages` (`match_id`, `player`, `scope`, `body`) VALUES (?, ?, ?, ?)",
    [$matchId, $me['id'], $scope, $body], 'iiss'
);
$id = db()->lastInsertId();

realtime_emit($matchId, 'chat', [
    'id' => $id, 'player' => (int)$me['id'], 'name' => $me['display_name'],
    'color' => $me['color'], 'scope' => $scope, 'body' => $body,
]);
json_ok(['id' => $id]);
