<?php
// GET /api/army/plan?match_id=&target=XXX
// Returns the attack plan for a target in the EXACT shape MatchHud.jsx planFor()
// builds: { invade:[landOpt, seaOpt], strike:[artillery, air, missile, nuke] }.
// The server is authoritative; the client only renders this.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Diplomacy.php';
require_once __DIR__ . '/../../../utils/engine/Movement.php';
require_once __DIR__ . '/../../../utils/engine/Combat.php';

$auth = require_auth();
$matchId = (int)in('match_id', 0);
$target  = strtoupper(substr((string)in('target', ''), 0, 3));
if (!$matchId) json_err('Missing match_id.');
if (!$target)  json_err('Missing target.');

$db = db();
$match = load_match($matchId);
$me = require_player($matchId, $auth->user);
$meId = (int)$me['id'];
$tick = (int)$match['current_tick'];

$targetCountry = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$target], 's');
if (!$targetCountry) json_err('Unknown target country.');

$owner = Movement::ownerOf($db, $matchId, $target);
$block = Movement::attackBlock($db, $matchId, $meId, $target, $tick);

// My idle stacks with at least one land unit.
$myStacks = $db->select(
    "SELECT * FROM `armies`
      WHERE `match_id` = ? AND `player` = ? AND `moving_to` IS NULL",
    [$matchId, $meId], 'ii'
) ?: [];

$passable = Movement::passableFn($db, $matchId, $meId);
$navyCap  = (int)GameConfig::UNITS['navy']['capacity'];

$winChance = function (float $A, float $D): float {
    if ($D <= 0) return 1.0;
    $w = 0;
    for ($i = 0; $i < 40; $i++) {
        for ($j = 0; $j < 40; $j++) {
            if ($A * (0.85 + 0.3 * ($i + 0.5) / 40) > $D * (0.85 + 0.3 * ($j + 0.5) / 40)) $w++;
        }
    }
    return $w / 1600;
};

$land = []; $sea = [];
foreach ($myStacks as $a) {
    $units = Combat::units($a);
    if (Movement::landUnitCount($units) <= 0) continue;
    $at = $a['country_code'];
    $atk = Combat::attackStrength($units);

    $path = Movement::landPath($db, $at, $target, $passable);
    if ($path) {
        $km = Movement::pathKm($db, $path);
        $land[] = [
            'kind'     => 'land',
            'ok'       => true,
            'armyId'   => (int)$a['id'],
            'codes'    => $path,
            'km'       => round($km, 1),
            'days'     => Movement::days($km, Movement::stackSpeed($units)),
            'strength' => $atk,
            'fromName' => Movement::cname($db, $at),
            'via'      => array_map(fn($c) => Movement::cname($db, $c), array_slice($path, 1, -1)),
        ];
    }

    if (($units['navy'] ?? 0) && Movement::coastal($db, $at) && Movement::coastal($db, $target)) {
        $cap  = (int)$units['navy'] * $navyCap;
        $need = Movement::landUnitCount($units);
        $km   = Movement::km($db, $at, $target) * GameConfig::SEA_FACTOR;
        if ($cap >= $need) {
            $sea[] = [
                'kind'     => 'sea',
                'ok'       => true,
                'armyId'   => (int)$a['id'],
                'codes'    => [$at, $target],
                'km'       => round($km, 1),
                'days'     => Movement::days($km, GameConfig::SEA_SPEED),
                'strength' => (int)round($atk * GameConfig::AMPHIB_MULT),
                'fromName' => Movement::cname($db, $at),
                'via'      => [],
            ];
        } else {
            $more = (int)ceil(($need - $cap) / $navyCap);
            $sea[] = [
                'kind'   => 'sea',
                'ok'     => false,
                'reason' => 'Needs ' . $more . ' more ships in ' . Movement::cname($db, $at)
                          . ' (' . $cap . '/' . $need . ' units).',
            ];
        }
    }
}

// pick(): the fastest ok option (then strongest), else the first option.
$pick = function (array $arr) {
    $ok = array_values(array_filter($arr, fn($x) => !empty($x['ok'])));
    usort($ok, fn($x, $y) => ($x['days'] <=> $y['days']) ?: ($y['strength'] <=> $x['strength']));
    return $ok[0] ?? ($arr[0] ?? null);
};

// Blockers across all stacks (shortest list), using an all-passable probe path.
$blockers = null;
foreach ($myStacks as $a) {
    $gp = Movement::landPath($db, $a['country_code'], $target, fn() => true);
    if (!$gp) continue;
    $b = [];
    foreach (array_slice($gp, 1, -1) as $c) {
        if ($passable($c)) continue;
        $oo = Movement::ownerOf($db, $matchId, $c);
        $label = Movement::cname($db, $c);
        if ($oo === null) $label .= ' (neutral)';
        elseif (Diplomacy::areAllied($db, $matchId, $meId, $oo)) $label .= ' (ally, no access)';
        $b[] = $label;
    }
    if ($blockers === null || count($b) < count($blockers)) $blockers = $b;
}

$seaReason = !Movement::coastal($db, $target)
    ? Movement::cname($db, $target) . ' is landlocked. It can’t be reached by sea.'
    : 'Needs a coastal stack with Navy ships (10 units per ship).';

$landPick = $pick($land);
$seaPick  = $pick($sea);
$invade = [
    $landPick ?: (($blockers && count($blockers))
        ? ['kind' => 'land', 'ok' => false, 'blockers' => array_slice($blockers, 0, 3)]
        : ['kind' => 'land', 'ok' => false, 'reason' => 'No land connection. Ship by sea or strike from range.']),
    $seaPick ?: ['kind' => 'sea', 'ok' => false, 'reason' => $seaReason],
];

$hasAccess = ($owner !== null) && ($owner === $meId || Diplomacy::hasAccess($db, $matchId, $owner, $meId));
if ($block === 'allied' && !$hasAccess) {
    $oname = Movement::playerLandName($db, $matchId, $owner);
    $invade = array_map(fn($x) => ['kind' => $x['kind'], 'ok' => false,
        'reason' => 'Needs military access from ' . $oname . ' (Diplomacy).'], $invade);
} elseif ($block && $block !== 'allied') {
    $invade = array_map(fn($x) => ['kind' => $x['kind'], 'ok' => false, 'reason' => $block], $invade);
}

// Defence shown in the UI (garrison/militia + stationed defenders) × bonuses (§3).
$terr = $db->selectOne(
    "SELECT * FROM `territories` WHERE `match_id` = ? AND `country_code` = ?",
    [$matchId, $target], 'is'
);
$garrison = $terr ? Combat::garrisonOf($db, $terr, $targetCountry, $tick) : 0;
$defSum = 0.0;
if ($owner !== null) {
    $defStacks = $db->select(
        "SELECT * FROM `armies`
          WHERE `match_id` = ? AND `country_code` = ? AND `moving_to` IS NULL AND `player` = ?",
        [$matchId, $target, $owner], 'isi'
    ) ?: [];
    foreach ($defStacks as $d) $defSum += Combat::defenceStrength(Combat::units($d));
}
$terrainMult = GameConfig::terrainMult($targetCountry['terrain'] ?? 'plains');
$D = round(($garrison + $defSum) * GameConfig::DEFENDER_BONUS * $terrainMult);

// Fog: an enemy (non-neutral, not me) hides its defence/odds (§10) — handled by
// vision elsewhere; here we attach odds whenever the target is known.
foreach ($invade as &$x) {
    if (!empty($x['ok']) && $block !== 'allied') {
        $x['odds'] = $winChance((float)$x['strength'], (float)$D);
    }
}
unset($x);

// ---- Strikes (shape-faithful; strike mechanics land in a later phase) -------
$techDone = [];
foreach ($db->select("SELECT `tech_key` FROM `player_tech` WHERE `match_id` = ? AND `player` = ? AND `level` = 1",
    [$matchId, $meId], 'ii') ?: [] as $t) $techDone[$t['tech_key']] = true;
$techActive = [];
foreach ($db->select("SELECT `tech_key` FROM `player_tech` WHERE `match_id` = ? AND `player` = ? AND `level` = 0",
    [$matchId, $meId], 'ii') ?: [] as $t) $techActive[$t['tech_key']] = true;

$noStrike = ($block && $block !== 'allied') ? $block
          : ($block === 'allied' ? 'You can’t strike an ally.' : null);

$techName = fn($k) => GameConfig::TECH[$k]['name'] ?? $k;
$lockFor = function ($k) use ($techDone, $techActive, $techName) {
    if (!empty($techDone[$k])) return null;
    return 'Research ' . $techName($k) . (!empty($techActive[$k]) ? ' (in progress)' : '');
};

$neighbors = Movement::neighbors($db, $target);
$strike = [];

// Artillery barrage: a stack with artillery in a country that borders the target.
$lk = $lockFor('artillery');
$art = null;
foreach ($myStacks as $a) {
    $u = Combat::units($a);
    if (($u['artillery'] ?? 0) && in_array($a['country_code'], $neighbors, true)) {
        if (!$art || ($u['artillery'] > ($art['_g'] ?? 0))) { $art = ['row' => $a, '_g' => (int)$u['artillery']]; }
    }
}
if ($lk) {
    $strike[] = ['kind' => 'artillery', 'ok' => false, 'locked' => true, 'reason' => $lk];
} elseif ($noStrike) {
    $strike[] = ['kind' => 'artillery', 'ok' => false, 'reason' => $noStrike];
} elseif ($art) {
    $g = $art['_g']; $fromName = Movement::cname($db, $art['row']['country_code']);
    $strike[] = ['kind' => 'artillery', 'ok' => true, 'from' => $art['row']['country_code'], 'to' => $target,
        'damage' => $g * abs((int)GameConfig::STRIKES['artillery']['def']),
        'detail' => $g . ' guns in ' . $fromName . ' · ' . $g . ' minerals'];
} else {
    $strike[] = ['kind' => 'artillery', 'ok' => false,
        'reason' => 'No artillery in a country that borders ' . Movement::cname($db, $target) . '.'];
}

// Air strike: planes within range (1 500 km).
$lk = $lockFor('air');
$airRange = (int)GameConfig::STRIKES['air']['range'];
$air = null; $anyAir = false;
foreach ($myStacks as $a) {
    $u = Combat::units($a);
    if (($u['air'] ?? 0)) { $anyAir = true;
        if (Movement::km($db, $a['country_code'], $target) <= $airRange) {
            if (!$air || ($u['air'] > ($air['_p'] ?? 0))) { $air = ['row' => $a, '_p' => (int)$u['air']]; }
        }
    }
}
if ($lk) {
    $strike[] = ['kind' => 'air', 'ok' => false, 'locked' => true, 'reason' => $lk];
} elseif ($noStrike) {
    $strike[] = ['kind' => 'air', 'ok' => false, 'reason' => $noStrike];
} elseif ($air) {
    $p = $air['_p']; $fromCode = $air['row']['country_code'];
    $strike[] = ['kind' => 'air', 'ok' => true, 'from' => $fromCode, 'to' => $target,
        'damage' => $p * abs((int)GameConfig::STRIKES['air']['def']),
        'detail' => $p . ' planes from ' . Movement::cname($db, $fromCode) . ' · '
                  . round(Movement::km($db, $fromCode, $target)) . ' km'];
} else {
    $strike[] = ['kind' => 'air', 'ok' => false,
        'reason' => $anyAir ? 'Out of range (1 500 km).' : 'Train planes in Army mode first.'];
}

// Missiles: nearest-range stocked tier from the capital (arsenal stock).
$myCountry = $me['country_code'];
$dist = Movement::km($db, $myCountry, $target);
$tierOrder = ['srbm', 'mrbm', 'icbm'];
$tiers = array_values(array_filter($tierOrder, fn($k) => !empty($techDone[$k])));
$inRange = array_values(array_filter($tiers, fn($k) => (int)GameConfig::STRIKES[$k]['range'] >= $dist
    || GameConfig::STRIKES[$k]['range'] === 'global'));
$stock = [];
foreach ($db->select("SELECT `item`, `stock` FROM `arsenal` WHERE `match_id` = ? AND `player` = ?",
    [$matchId, $meId], 'ii') ?: [] as $r) $stock[$r['item']] = (int)$r['stock'];
$ready = null;
foreach ($inRange as $k) { if (($stock[$k] ?? 0) > 0) { $ready = $k; break; } }

if (!count($tiers)) {
    $strike[] = ['kind' => 'missile', 'ok' => false, 'locked' => true, 'reason' => 'Research Short-range missiles'];
} elseif ($noStrike) {
    $strike[] = ['kind' => 'missile', 'ok' => false, 'reason' => $noStrike];
} elseif ($ready) {
    $strike[] = ['kind' => 'missile', 'ok' => true, 'from' => $myCountry, 'to' => $target,
        'damage' => abs((int)GameConfig::STRIKES[$ready]['def']),
        'detail' => GameConfig::ARSENAL[$ready]['name'] . ' · ' . ($stock[$ready] ?? 0) . ' in stock'];
} else {
    $strike[] = ['kind' => 'missile', 'ok' => false,
        'reason' => !count($inRange)
            ? 'Out of range (' . round($dist) . ' km). Research longer-range missiles.'
            : 'No ' . strtolower(GameConfig::ARSENAL[$inRange[0]]['name']) . 's built.'];
}

// Nuclear: never ready in this phase.
$lk = $lockFor('nuclear');
if ($lk) {
    $strike[] = ['kind' => 'nuke', 'ok' => false, 'locked' => true, 'reason' => $lk . ' · 60 000 gold · 5 Labs'];
} else {
    $strike[] = ['kind' => 'nuke', 'ok' => false, 'reason' => 'No warhead built (15 000 gold, 10 days).'];
}

json_ok([
    'target'  => $target,
    'defence' => (int)$D,
    'invade'  => $invade,
    'strike'  => $strike,
]);
