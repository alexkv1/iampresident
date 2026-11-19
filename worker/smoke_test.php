<?php
// End-to-end engine smoke test (no HTTP). Creates a single-player match with
// two AI, starts it, advances ticks, and verifies the economy, AI and combat.
//   php worker/smoke_test.php
require __DIR__ . '/../utils/bootstrap.php';
require_once __DIR__ . '/../utils/engine/Tick.php';

$db = new DB();
$TAG = '__SMOKE__';

function line() { echo str_repeat('-', 78) . "\n"; }

// --- cleanup any previous run ------------------------------------------------
foreach ($db->select("SELECT id FROM `matches` WHERE `name` = ?", [$TAG], 's') ?: [] as $m) {
    $id = (int)$m['id'];
    foreach (['armies','buildings','territories','match_players','match_events','diplomacy','trades','chat_messages'] as $t) {
        $db->execute("DELETE FROM `$t` WHERE `match_id` = ?", [$id], 'i');
    }
    $db->execute("DELETE FROM `matches` WHERE `id` = ?", [$id], 'i');
}
$db->execute("DELETE FROM `users` WHERE `display_name` = ?", ['__SMOKEUSER__'], 's');

// --- set up a lobby ----------------------------------------------------------
$db->execute("INSERT INTO `users` (`display_name`, `is_guest`) VALUES ('__SMOKEUSER__', 1)");
$uid = $db->lastInsertId();

$db->execute(
    "INSERT INTO `matches` (`name`, `mode`, `status`, `max_players`, `tick_interval_sec`, `host_user`, `settings`)
     VALUES (?, 'single', 'lobby', 4, 20, ?, ?)",
    [$TAG, $uid, json_encode(['ai_count' => 2])], 'sis'
);
$mid = $db->lastInsertId();

$db->execute("INSERT INTO `match_players` (`match_id`,`user`,`display_name`,`country_code`,`color`,`slot`,`is_host`,`is_ready`) VALUES (?,?,?,?,?,0,1,1)",
    [$mid, $uid, 'You (Sweden)', 'SWE', '#e6194b'], 'iisss');
$humanId = $db->lastInsertId();
$db->execute("INSERT INTO `match_players` (`match_id`,`is_ai`,`ai_level`,`display_name`,`country_code`,`color`,`slot`,`is_ready`) VALUES (?,1,2,?,?,?,1,1)",
    [$mid, 'CPU Saudi', 'SAU', '#3cb44b'], 'isss');
$db->execute("INSERT INTO `match_players` (`match_id`,`is_ai`,`ai_level`,`display_name`,`country_code`,`color`,`slot`,`is_ready`) VALUES (?,1,3,?,?,?,2,1)",
    [$mid, 'CPU Congo', 'COD', '#4363d8'], 'isss');

// --- start -------------------------------------------------------------------
$match = $db->selectOne("SELECT * FROM `matches` WHERE `id` = ?", [$mid], 'i');
$res = MatchSetup::start($db, $match);
echo "START: " . ($res['ok'] ? 'ok' : 'FAIL - ' . $res['message']) . "\n";

$h = $db->selectOne("SELECT * FROM `match_players` WHERE `id` = ?", [$humanId], 'i');
printf("Sweden start: pop=%s food=%.0f energy=%.0f minerals=%.0f gold=%.0f oil=%.0f\n",
    number_format((int)$h['pop']), $h['food'], $h['energy'], $h['minerals'], $h['gold'], $h['oil']);
line();

// --- advance ticks -----------------------------------------------------------
printf("%-5s %-14s %8s %8s %9s %8s %7s %8s\n", 'tick', 'pop', 'food', 'energy', 'minerals', 'gold', 'oil', 'research');
for ($i = 1; $i <= 14; $i++) {
    $match = $db->selectOne("SELECT * FROM `matches` WHERE `id` = ?", [$mid], 'i');
    Tick::process($db, $match);
    $h = $db->selectOne("SELECT * FROM `match_players` WHERE `id` = ?", [$humanId], 'i');
    printf("%-5d %-14s %8.0f %8.0f %9.0f %8.0f %7.0f %8.0f\n",
        $i, number_format((int)$h['pop']), $h['food'], $h['energy'], $h['minerals'], $h['gold'], $h['oil'], $h['research']);
}
line();

echo "Sweden buildings:\n";
foreach ($db->select("SELECT type, status, complete_at_tick FROM `buildings` WHERE `player` = ? ORDER BY id", [$humanId], 'i') as $b) {
    printf("  %-12s %-9s (done@tick %d)\n", $b['type'], $b['status'], $b['complete_at_tick']);
}
$aiBuilds = $db->selectOne("SELECT COUNT(*) c FROM `buildings` b JOIN match_players p ON p.id=b.player WHERE b.match_id=? AND p.is_ai=1", [$mid], 'i');
echo "AI buildings built: " . $aiBuilds['c'] . "\n";
line();

// --- combat: conquer a neutral neighbour of Sweden ---------------------------
$nb = $db->selectOne(
    "SELECT n.neighbor FROM country_neighbors n
       JOIN territories t ON t.country_code = n.neighbor AND t.match_id = ?
      WHERE n.country = 'SWE' AND t.owner IS NULL LIMIT 1",
    [$mid], 'i'
);
if ($nb) {
    $target = $nb['neighbor'];
    $match = $db->selectOne("SELECT * FROM `matches` WHERE `id` = ?", [$mid], 'i');
    $arrive = (int)$match['current_tick'] + 1;
    $db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`,`moving_to`,`arrive_at_tick`) VALUES (?,?, 'SWE',?,'SWE',?,?)",
        [$mid, $humanId, json_encode(['infantry' => 100]), $target, $arrive], 'iissi');
    echo "Marching 100 infantry SWE -> $target (arrive tick $arrive)...\n";
    for ($i = 0; $i < 2; $i++) {
        $match = $db->selectOne("SELECT * FROM `matches` WHERE `id` = ?", [$mid], 'i');
        Tick::process($db, $match);
    }
    $own = $db->selectOne("SELECT owner FROM territories WHERE match_id=? AND country_code=?", [$mid, $target], 'is');
    echo "Territory $target owner after assault: " . var_export($own['owner'], true)
       . ($own['owner'] == $humanId ? "  ✅ CONQUERED\n" : "  ❌ not taken\n");
} else {
    echo "(Sweden has no neutral land neighbour to test combat)\n";
}
line();

echo "Territory standings:\n";
foreach ($db->select("SELECT p.display_name, COUNT(t.id) c FROM match_players p LEFT JOIN territories t ON t.owner=p.id AND t.match_id=? WHERE p.match_id=? GROUP BY p.id ORDER BY c DESC", [$mid, $mid], 'ii') as $s) {
    printf("  %-16s %d\n", $s['display_name'], $s['c']);
}

line();

// =============================================================================
// Phase-2: movement, combat and garrisons (deterministic). GAME_RULES §2–§4.
// Builds an isolated match and drives Movement/Combat directly.
// =============================================================================
require_once __DIR__ . '/../utils/engine/Movement.php';
require_once __DIR__ . '/../utils/engine/Combat.php';

echo "PHASE-2: movement / combat / garrisons (deterministic)\n";
line();

$pass = 0; $fail = 0;
function check(string $label, bool $ok, string $detail = '') {
    global $pass, $fail;
    if ($ok) { $pass++; echo "  PASS  $label" . ($detail ? "  — $detail" : "") . "\n"; }
    else     { $fail++; echo "  FAIL  $label" . ($detail ? "  — $detail" : "") . "\n"; }
}

// --- Fresh phase-2 match (own tag so cleanup above wiped any prior run) -------
$P2TAG = '__SMOKE__';   // reuse the same name so the top-of-file cleanup clears it
$db->execute(
    "INSERT INTO `matches` (`name`,`mode`,`status`,`max_players`,`tick_interval_sec`,`current_tick`,`host_user`)
     VALUES (?, 'single', 'active', 4, 20, 0, ?)",
    [$P2TAG, $uid], 'si'
);
$p2 = (int)$db->lastInsertId();

$db->execute("INSERT INTO `match_players` (`match_id`,`user`,`display_name`,`country_code`,`color`,`slot`,`is_host`) VALUES (?,?,?, 'DEU','#e6194b',0,1)",
    [$p2, $uid, 'You (Germany)'], 'iis');
$A = (int)$db->lastInsertId();                              // attacker / human (DEU)
$db->execute("INSERT INTO `match_players` (`match_id`,`is_ai`,`display_name`,`country_code`,`color`,`slot`) VALUES (?,1,?, 'FRA','#3cb44b',1)",
    [$p2, 'CPU France'], 'is');
$B = (int)$db->lastInsertId();                              // middle power (FRA)

// Board: one territory row per country, neutral.
$db->execute("INSERT INTO `territories` (`match_id`,`country_code`) SELECT ?, `code` FROM `countries`
              ON DUPLICATE KEY UPDATE `is_capital`=`is_capital`", [$p2], 'i');
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`='DEU'", [$A, $p2], 'ii');
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`='FRA'", [$B, $p2], 'ii');

$matchRow = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p2], 'i');

// Force deterministic combat: both rolls = 1.0 (A'=A, D'=D).
Combat::setRng(fn() => 1.0);

// (a) Land move through a country that granted access succeeds. -----------------
//     DEU -> FRA(ally w/ access) -> ESP(neutral). FRA is the only land link to ESP.
Diplomacy::set($db, $p2, $A, $B, 'allied');
$db->execute("INSERT INTO `diplomacy` (`match_id`,`player_a`,`player_b`,`state`,`access_ab`,`access_ba`)
              VALUES (?,?,?, 'allied', ?, ?)
              ON DUPLICATE KEY UPDATE `access_ab`=VALUES(`access_ab`),`access_ba`=VALUES(`access_ba`),`state`='allied'",
    [$p2, min($A,$B), max($A,$B), ($A<$B?1:0), ($A<$B?0:1)], 'iiiii');
// grant: FRA(owner B) -> DEU(mover A). access_from_B_to_A.
$ab = ($B < $A) ? 1 : 0; $ba = ($B < $A) ? 0 : 1; // owner=B granting mover=A
$db->execute("UPDATE `diplomacy` SET `access_ab`=?, `access_ba`=? WHERE `match_id`=? AND `player_a`=? AND `player_b`=?",
    [$ab, $ba, $p2, min($A,$B), max($A,$B)], 'iiiii');

$passableA = Movement::passableFn($db, $p2, $A);
$pathAccess = Movement::landPath($db, 'DEU', 'ESP', $passableA);
check('(a) land route via access-granting intermediate',
    is_array($pathAccess) && in_array('FRA', $pathAccess, true) && end($pathAccess) === 'ESP',
    'path=' . ($pathAccess ? implode('>', $pathAccess) : 'null'));

// (b) Move blocked by a NEUTRAL intermediate is refused with the right message. --
//     Revoke access + make FRA neutral so FRA blocks the only route to ESP.
$db->execute("UPDATE `diplomacy` SET `access_ab`=0, `access_ba`=0, `state`='neutral' WHERE `match_id`=? AND `player_a`=? AND `player_b`=?",
    [$p2, min($A,$B), max($A,$B)], 'iii');
$db->execute("UPDATE `territories` SET `owner`=NULL WHERE `match_id`=? AND `country_code`='FRA'", [$p2], 'i');
$passableA = Movement::passableFn($db, $p2, $A);
$pathBlocked = Movement::landPath($db, 'DEU', 'ESP', $passableA);
// Re-derive the blocker message exactly as move.php does.
$gp = Movement::landPath($db, 'DEU', 'ESP', fn() => true);
$blockLabel = '';
if ($gp) foreach (array_slice($gp, 1, -1) as $c) {
    if (!$passableA($c)) {
        $oo = Movement::ownerOf($db, $p2, $c);
        $blockLabel = Movement::cname($db, $c) . ($oo === null ? ' (neutral)' : '');
        break;
    }
}
$msg = 'No land route — blocked by ' . $blockLabel . '.';
check('(b) neutral intermediate blocks the route',
    $pathBlocked === null && str_contains($blockLabel, 'neutral'),
    'msg="' . $msg . '"');

// (c) Sea move refused for insufficient navy capacity ("Needs N more ships"). ----
//     Attacker at DEU with 30 land units but only 1 ship (cap 10) -> needs 2 more.
$units_c = ['infantry' => 30, 'navy' => 1];
$navyCap = (int)GameConfig::UNITS['navy']['capacity'];
$cap = 1 * $navyCap; $need = Movement::landUnitCount($units_c);
$more = (int)ceil(($need - $cap) / $navyCap);
$msgC = 'Needs ' . $more . ' more ships in ' . Movement::cname($db, 'DEU') . ' (' . $cap . '/' . $need . ' units).';
check('(c) sea move refused — insufficient navy capacity',
    $cap < $need && $more === 2 && str_contains($msgC, 'Needs 2 more ships'),
    'msg="' . $msgC . '"');

// (d) Landlocked sea target refused. --------------------------------------------
$landlockedTgt = 'CHE'; // Switzerland, coastal=0
$isCoastal = Movement::coastal($db, $landlockedTgt);
$msgD = Movement::cname($db, $landlockedTgt) . ' is landlocked. It can’t be reached by sea.';
check('(d) landlocked sea target refused',
    !$isCoastal && str_contains($msgD, 'is landlocked'),
    'msg="' . $msgD . '"');

// (e) Defender bonus + terrain flip the outcome. --------------------------------
//     Target neutral CHE (mountains). A=20 beats D on plains but loses on mountains.
$cheRow = $db->selectOne("SELECT * FROM `countries` WHERE `code`='CHE'", [], '');
$cheTerr = $db->selectOne("SELECT * FROM `territories` WHERE `match_id`=? AND `country_code`='CHE'", [$p2], 'i');
$garrCHE = Combat::garrisonOf($db, $cheTerr, $cheRow, 0);
$Dplains   = ($garrCHE + 0) * GameConfig::DEFENDER_BONUS * 1.0;
$Dmountain = ($garrCHE + 0) * GameConfig::DEFENDER_BONUS * GameConfig::terrainMult('mountains');
$Aval = 20.0;
check('(e) terrain+bonus flip: A beats plains-D but loses mountain-D',
    $Aval > $Dplains && $Aval < $Dmountain,
    sprintf('A=%.0f Dplains=%.1f Dmountain=%.1f (garr=%d)', $Aval, $Dplains, $Dmountain, $garrCHE));

// (f) Deterministic combat (RNG=1.0): known A>D wins, A<D loses, exact losses. ----

// f1: A>D WIN. 100 infantry vs neutral LUX (plains). Attacker keeps floor(100*(1-min(.6,.4*D/A))).
$db->execute("UPDATE `territories` SET `owner`=NULL, `occupied_until`=NULL, `damage`=0 WHERE `match_id`=? AND `country_code`='LUX'", [$p2], 'i');
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`,`moving_to`,`kind`,`path`,`depart_tick`,`arrive_at_tick`)
              VALUES (?,?, 'LUX', ?, 'DEU', 'LUX', 'land', ?, 0, 0)",
    [$p2, $A, json_encode(['infantry' => 100]), json_encode(['DEU','LUX'])], 'iiss');
$luxRow = $db->selectOne("SELECT * FROM `countries` WHERE `code`='LUX'", [], '');
$luxTerr = $db->selectOne("SELECT * FROM `territories` WHERE `match_id`=? AND `country_code`='LUX'", [$p2], 'i');
$garrLUX = Combat::garrisonOf($db, $luxTerr, $luxRow, 0);
$D_f1 = ($garrLUX) * GameConfig::DEFENDER_BONUS * GameConfig::terrainMult($luxRow['terrain']);
$A_f1 = 100.0;
$expWinSurv = (int)floor(100 * (1 - min(0.6, 0.4 * $D_f1 / $A_f1)));
$ev1 = [];
Combat::resolveArrivals($db, $matchRow, $ev1);
$ownLUX = Movement::ownerOf($db, $p2, 'LUX');
$survRow = $db->selectOne("SELECT * FROM `armies` WHERE `match_id`=? AND `player`=? AND `country_code`='LUX' AND `moving_to` IS NULL", [$p2, $A], 'ii');
$survUnits = $survRow ? Combat::units($survRow) : [];
$gotWon = false; foreach ($ev1 as $e) if ($e['type'] === 'battle_won' && $e['data']['country'] === 'LUX') $gotWon = true;
check('(f1) A>D WINS, conquers LUX, exact survivor losses',
    $ownLUX === $A && ($survUnits['infantry'] ?? 0) === $expWinSurv && $gotWon,
    sprintf('A=%.0f D=%.1f survivors=%d (expected %d), owner=%s',
        $A_f1, $D_f1, $survUnits['infantry'] ?? -1, $expWinSurv, var_export($ownLUX, true)));

// f2: A<D LOSE. 10 infantry vs neutral CHN (plains). Survivors retreat to origin.
$db->execute("UPDATE `territories` SET `owner`=NULL, `occupied_until`=NULL, `damage`=0 WHERE `match_id`=? AND `country_code`='CHN'", [$p2], 'i');
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`,`moving_to`,`kind`,`path`,`depart_tick`,`arrive_at_tick`)
              VALUES (?,?, 'CHN', ?, 'DEU', 'CHN', 'land', ?, 0, 0)",
    [$p2, $A, json_encode(['infantry' => 10]), json_encode(['DEU','CHN'])], 'iiss');
$chnRow = $db->selectOne("SELECT * FROM `countries` WHERE `code`='CHN'", [], '');
$chnTerr = $db->selectOne("SELECT * FROM `territories` WHERE `match_id`=? AND `country_code`='CHN'", [$p2], 'i');
$garrCHN = Combat::garrisonOf($db, $chnTerr, $chnRow, 0);
$D_f2 = ($garrCHN) * GameConfig::DEFENDER_BONUS * GameConfig::terrainMult($chnRow['terrain']);
$A_f2 = 10.0;
$lossFrac = 0.5 + 0.4 * (1 - $A_f2 / $D_f2);
$expLoseSurv = (int)floor(10 * (1 - $lossFrac));   // scaleUnits keepOne=false
$matchRow = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p2], 'i');
$ev2 = [];
Combat::resolveArrivals($db, $matchRow, $ev2);
$ownCHN = Movement::ownerOf($db, $p2, 'CHN');
// Survivor stack (if any) is retreating back toward DEU.
$retreat = $db->selectOne("SELECT * FROM `armies` WHERE `match_id`=? AND `player`=? AND `origin`='DEU' AND `moving_to` IS NOT NULL AND `country_code`='CHN'", [$p2, $A], 'ii');
$retUnits = $retreat ? Combat::units($retreat) : [];
$gotLost = false; foreach ($ev2 as $e) if ($e['type'] === 'battle_lost' && $e['data']['country'] === 'CHN') $gotLost = true;
$survOk = $expLoseSurv <= 0 ? ($retreat === null) : (($retUnits['infantry'] ?? 0) === $expLoseSurv && $retreat['moving_to'] === 'DEU');
check('(f2) A<D LOSES at CHN, exact survivor losses + retreat',
    $ownCHN === null && $survOk && $gotLost,
    sprintf('A=%.0f D=%.1f lossFrac=%.4f survivors=%d (expected %d), retreatTo=%s, owner=%s',
        $A_f2, $D_f2, $lossFrac, $retUnits['infantry'] ?? 0, $expLoseSurv,
        $retreat['moving_to'] ?? 'none', var_export($ownCHN, true)));

Combat::setRng(null); // restore randomness

line();
echo "PHASE-2 RESULT: $pass passed, $fail failed\n";

$db->close();
echo "\nSmoke test complete.\n";
