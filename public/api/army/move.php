<?php
// POST /api/army/move { army_id, target, kind='land'|'sea' }
// Order a stack to march. Validates ownership, idle, war/truce (§7), builds the
// path and timing, and stores the move (GAME_RULES §2). Emits `march_started`.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Diplomacy.php';
require_once __DIR__ . '/../../../utils/engine/Movement.php';
require_once __DIR__ . '/../../../utils/engine/Combat.php';
require_method('POST');

$auth = require_auth();
[$armyId, $target] = require_fields(['army_id', 'target']);
$armyId = (int)$armyId;
$target = strtoupper(substr((string)$target, 0, 3));
$kind   = in('kind', 'land');
if ($kind !== 'land' && $kind !== 'sea') json_err('Invalid move kind.');

$db = db();

// The stack must exist, belong to the caller, be in this match, and be idle.
$army = $db->selectOne("SELECT * FROM `armies` WHERE `id` = ?", [$armyId], 'i');
if (!$army) json_err('Army not found.', 404);
$matchId = (int)$army['match_id'];

$match = load_match($matchId);
if ($match['status'] !== 'active') json_err('The match is not running.', 409);
$me = require_player($matchId, $auth->user);
if ((int)$army['player'] !== (int)$me['id']) json_err('That army is not yours.', 403);
if ($army['moving_to'] !== null) json_err('That army is already on the move.');

$from = $army['country_code'];
if ($target === $from) json_err('The army is already there.');

$tick = (int)$match['current_tick'];
$units = Combat::units($army);
if (!$units) json_err('That army has no units.');

$targetCountry = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$target], 's');
if (!$targetCountry) json_err('Unknown target country.');

$owner = Movement::ownerOf($db, $matchId, $target);

// --- §7 attack permission (reuses the mockup wording) -----------------------
$block = Movement::attackBlock($db, $matchId, (int)$me['id'], $target, $tick);
if ($block === 'allied') {
    // Allied target: you may reinforce it (handled on arrival as a merge) only if
    // it's your ally's land; marching to attack an ally is not allowed.
    if (!($owner !== null && Diplomacy::areAllied($db, $matchId, (int)$me['id'], $owner))) {
        json_err('Needs military access from ' . Movement::playerLandName($db, $matchId, $owner) . ' (Diplomacy).');
    }
    // allied-land reinforce is allowed; fall through.
} elseif ($block !== null) {
    json_err($block);
}

// --- Path + timing ----------------------------------------------------------
if ($kind === 'sea') {
    if (!Movement::coastal($db, $from)) {
        json_err(Movement::cname($db, $from) . ' is landlocked. It can’t be reached by sea.');
    }
    if (!Movement::coastal($db, $target)) {
        json_err(Movement::cname($db, $target) . ' is landlocked. It can’t be reached by sea.');
    }
    $navy = (int)($units['navy'] ?? 0);
    $need = Movement::landUnitCount($units);
    $cap  = $navy * (int)GameConfig::UNITS['navy']['capacity'];
    if ($cap < $need) {
        $more = (int)ceil(($need - $cap) / (int)GameConfig::UNITS['navy']['capacity']);
        json_err('Needs ' . $more . ' more ships in ' . Movement::cname($db, $from)
               . ' (' . $cap . '/' . $need . ' units).');
    }
    $codes = [$from, $target];
    $km    = Movement::km($db, $from, $target) * GameConfig::SEA_FACTOR;
    $speed = GameConfig::SEA_SPEED;
} else {
    $passable = Movement::passableFn($db, $matchId, (int)$me['id']);
    $codes = Movement::landPath($db, $from, $target, $passable);
    if (!$codes) {
        // Identify blockers for a clearer message (mockup blockers list).
        $gp = Movement::landPath($db, $from, $target, fn() => true);
        if ($gp) {
            $blockers = [];
            foreach (array_slice($gp, 1, -1) as $c) {
                if (!$passable($c)) {
                    $oo = Movement::ownerOf($db, $matchId, $c);
                    $label = Movement::cname($db, $c);
                    if ($oo === null) $label .= ' (neutral)';
                    elseif (Diplomacy::areAllied($db, $matchId, (int)$me['id'], $oo)) $label .= ' (ally, no access)';
                    $blockers[] = $label;
                }
            }
            if ($blockers) {
                json_err('No land route — blocked by ' . implode(', ', array_slice($blockers, 0, 3)) . '.');
            }
        }
        json_err('No land connection. Ship by sea or strike from range.');
    }
    $km    = Movement::pathKm($db, $codes);
    $speed = Movement::stackSpeed($units);
}

$days   = Movement::days($km, $speed);
$arrive = $tick + $days;

$db->execute(
    "UPDATE `armies`
        SET `moving_to` = ?, `path` = ?, `kind` = ?, `origin` = ?,
            `depart_tick` = ?, `arrive_at_tick` = ?
      WHERE `id` = ?",
    [$target, json_encode($codes), $kind, $from, $tick, $arrive, $armyId],
    'ssssiii'
);

realtime_emit($matchId, 'march_started', [
    'army_id' => $armyId, 'player' => (int)$me['id'],
    'from' => $from, 'to' => $target, 'kind' => $kind, 'arrive_at_tick' => $arrive,
]);

json_ok([
    'army_id'        => $armyId,
    'from'           => $from,
    'to'             => $target,
    'kind'           => $kind,
    'codes'          => $codes,
    'km'             => round($km, 1),
    'days'           => $days,
    'depart_tick'    => $tick,
    'arrive_at_tick' => $arrive,
]);
