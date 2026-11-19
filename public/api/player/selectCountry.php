<?php
// POST /api/player/selectCountry { match_id, country_code }  -> claim a home country in the lobby.
require __DIR__ . '/../../../utils/bootstrap.php';
require_method('POST');

$auth = require_auth();
[$matchId, $code] = require_fields(['match_id', 'country_code']);
$matchId = (int)$matchId;
$code = strtoupper(substr((string)$code, 0, 3));

$match = load_match($matchId);
if ($match['status'] !== 'lobby') json_err('Countries are locked once the match starts.', 409);

$me = require_player($matchId, $auth->user);

$country = db()->selectOne("SELECT `code`, `name` FROM `countries` WHERE `code` = ?", [$code], 's');
if (!$country) json_err('Unknown country.');

$taken = db()->selectOne(
    "SELECT `id` FROM `match_players` WHERE `match_id` = ? AND `country_code` = ? AND `id` <> ?",
    [$matchId, $code, $me['id']], 'isi'
);
if ($taken) json_err('That country is already taken.', 409);

// Adopt the country's current leader as your in-match persona.
$persona = leader_persona($code, $country['name']);
db()->execute(
    "UPDATE `match_players` SET `country_code` = ?, `display_name` = ?, `leader_title` = ? WHERE `id` = ?",
    [$code, $persona['name'], $persona['title'], $me['id']], 'sssi'
);

realtime_emit($matchId, 'lobby_update', ['player' => (int)$me['id'], 'country' => $code, 'leader' => $persona['name']]);
json_ok(['country_code' => $code, 'leader' => $persona['name'], 'leader_title' => $persona['title']]);
