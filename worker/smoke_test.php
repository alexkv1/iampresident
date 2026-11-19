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
    foreach (['armies','buildings','territories','match_players','match_events','diplomacy','trades','chat_messages','training','arsenal'] as $t) {
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

// =============================================================================
// Phase-3: economy of war — upkeep, desertion, training, manpower, start scale,
// weighted victory shares (deterministic). GAME_RULES §1, §1a, §5.
// =============================================================================
require_once __DIR__ . '/../utils/engine/Training.php';
require_once __DIR__ . '/../utils/engine/Economy.php';

line();
echo "PHASE-3: economy of war (upkeep / desertion / training / shares)\n";
line();

// --- Fresh phase-3 match (same __SMOKE__ tag so cleanup wipes it next run) ----
$db->execute(
    "INSERT INTO `matches` (`name`,`mode`,`status`,`max_players`,`tick_interval_sec`,`current_tick`,`host_user`)
     VALUES (?, 'single', 'active', 4, 20, 0, ?)",
    [$TAG, $uid], 'si'
);
$p3 = (int)$db->lastInsertId();

// Use real countries so area/gdp/pop seed the share maths. SWE (human), USA (big AI).
$db->execute("INSERT INTO `match_players` (`match_id`,`user`,`display_name`,`country_code`,`color`,`slot`,`is_host`,`pop`) VALUES (?,?,?, 'SWE','#e6194b',0,1,?)",
    [$p3, $uid, 'You (Sweden)', 10600000], 'iisi');
$S = (int)$db->lastInsertId();                              // Sweden (human)
$db->execute("INSERT INTO `match_players` (`match_id`,`is_ai`,`display_name`,`country_code`,`color`,`slot`,`pop`) VALUES (?,1,?, 'USA','#3cb44b',1,?)",
    [$p3, 'CPU USA', 331000000], 'isi');
$Uusa = (int)$db->lastInsertId();                          // USA (AI)

// Board: one neutral territory per country, then claim SWE and USA.
$db->execute("INSERT INTO `territories` (`match_id`,`country_code`) SELECT ?, `code` FROM `countries`
              ON DUPLICATE KEY UPDATE `is_capital`=`is_capital`", [$p3], 'i');
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`='SWE'", [$S, $p3], 'ii');
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`='USA'", [$Uusa, $p3], 'ii');

$match3 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p3], 'i');

// --- (g) startScale applied to starting stockpiles (MatchSetup) ----------------
// Run a tiny isolated MatchSetup-style check: s = startScale(gdp_md); START*s.
$sweCountry = $db->selectOne("SELECT * FROM `countries` WHERE `code`='SWE'", [], '');
$sSwe = GameConfig::startScale((float)$sweCountry['gdp_md']);
$expGold = GameConfig::START['gold'] * $sSwe;
// Drive the real MatchSetup path on a throwaway lobby to confirm it writes START*s.
$db->execute("INSERT INTO `matches` (`name`,`mode`,`status`,`max_players`,`tick_interval_sec`,`host_user`,`settings`)
              VALUES (?, 'single','lobby',2,20,?,?)", [$TAG, $uid, json_encode([])], 'sis');
$lob = (int)$db->lastInsertId();
$db->execute("INSERT INTO `match_players` (`match_id`,`user`,`display_name`,`country_code`,`color`,`slot`,`is_host`,`is_ready`) VALUES (?,?,?, 'SWE','#e6194b',0,1,1)",
    [$lob, $uid, 'Setup SWE'], 'iis');
$setupId = (int)$db->lastInsertId();
$lobRow = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$lob], 'i');
MatchSetup::start($db, $lobRow);
$seed = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$setupId], 'i');
check('(g) startScale applied to starting gold',
    abs((float)$seed['gold'] - $expGold) < 1.0 && abs($sSwe - sqrt((float)$sweCountry['gdp_md'] / 500000)) < 1e-6,
    sprintf('s=%.4f gold=%.0f (expected %.0f = START %d × s)', $sSwe, (float)$seed['gold'], $expGold, GameConfig::START['gold']));
// Clean the throwaway lobby's board/players so it doesn't skew the p3 share totals.
foreach (['armies','buildings','territories','match_players','match_events'] as $t) $db->execute("DELETE FROM `$t` WHERE `match_id`=?", [$lob], 'i');
$db->execute("DELETE FROM `matches` WHERE `id`=?", [$lob], 'i');

// --- (h) upkeep deducted before production ------------------------------------
// Give Sweden a known stack and fat stockpiles, no buildings -> net change = -upkeep.
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?,'SWE',?, 'SWE')",
    [$p3, $S, json_encode(['infantry' => 10, 'armor' => 5])], 'iis');
$db->execute("UPDATE `match_players` SET `gold`=10000,`food`=10000,`oil`=10000,`energy`=0,`minerals`=0,`research`=0 WHERE `id`=?", [$S], 'i');
$armiesS = $db->select("SELECT `units` FROM `armies` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$expUp = Economy::upkeep($armiesS);  // infantry 10×(g1,f1) + armor 5×(g3,f1,o1) = g25,f15,o5
$goldBefore = 10000.0; $foodBefore = 10000.0; $oilBefore = 10000.0;
$match3 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p3], 'i');
Tick::process($db, $match3);
$sAfter = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
// No buildings, so the only resource movement is upkeep (minus tiny pop tax on gold).
$goldDrop = $goldBefore - (float)$sAfter['gold'];
$oilDrop  = $oilBefore  - (float)$sAfter['oil'];
check('(h) upkeep deducted before production',
    $expUp['gold'] == 25 && $expUp['oil'] == 5 && $oilDrop == $expUp['oil'] && $goldDrop >= 0,
    sprintf('upkeep g=%.0f f=%.0f o=%.0f; oilDrop=%.0f goldDrop=%.1f', $expUp['gold'], $expUp['food'], $expUp['oil'], $oilDrop, $goldDrop));

// --- (i) desertion when broke (no gold/food to pay upkeep) --------------------
$db->execute("UPDATE `match_players` SET `gold`=0,`food`=0,`oil`=0 WHERE `id`=?", [$S], 'i');
// Reset the stack to a clean 10 infantry + 5 armor so losses are predictable.
$db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?,'SWE',?, 'SWE')",
    [$p3, $S, json_encode(['infantry' => 100, 'armor' => 40]), ], 'iis');
$match3 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p3], 'i');
$evDes = Tick::process($db, $match3);
$stackAfter = $db->selectOne("SELECT `units` FROM `armies` WHERE `match_id`=? AND `player`=? AND `moving_to` IS NULL", [$p3, $S], 'ii');
$ua = $stackAfter ? Combat::units($stackAfter) : [];
// 5% desertion: floor(100*0.95)=95 inf, floor(40*0.95)=38 armor.
$gotDesEvent = false; foreach ($evDes as $e) if ($e['type'] === 'desertion') $gotDesEvent = true;
check('(i) desertion when gold & food are zero',
    ($ua['infantry'] ?? 0) === 95 && ($ua['armor'] ?? 0) === 38 && $gotDesEvent,
    sprintf('inf=%d (exp 95) armor=%d (exp 38) event=%s', $ua['infantry'] ?? -1, $ua['armor'] ?? -1, $gotDesEvent ? 'yes' : 'no'));

// --- (j) oil grounding flag ----------------------------------------------------
// After (i) oil is 0, Sweden fields armor -> isGrounded true.
check('(j) isGrounded true when oil is 0 (armor/navy/air cannot move)',
    Economy::isGrounded($db, $p3, $S) === true,
    'oil=' . (float)$db->selectOne("SELECT `oil` FROM `match_players` WHERE `id`=?", [$S], 'i')['oil']);

// --- (k) manpower-cap refusal --------------------------------------------------
// Reset Sweden: fund it, pop 10.6M -> limit floor(10.6M*0.01/1000)=106. Fill to 105
// used, then a batch of 5 (-> 110) must be refused.
$db->execute("UPDATE `match_players` SET `gold`=100000,`minerals`=100000,`oil`=100000,`food`=100000,`pop`=10600000 WHERE `id`=?", [$S], 'i');
$db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$db->execute("DELETE FROM `training` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?,'SWE',?, 'SWE')",
    [$p3, $S, json_encode(['infantry' => 105]), ], 'iis');
$limit = GameConfig::manpowerLimit(10600000);
$meRow = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$match3 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p3], 'i');
$resCap = Training::start($db, $match3, $meRow, 'SWE', 'infantry');
check('(k) manpower-cap refusal (105 used + 5 > 106 limit)',
    $limit === 106 && !$resCap['ok'] && str_contains($resCap['message'], 'manpower'),
    sprintf('limit=%d msg="%s"', $limit, $resCap['message']));

// --- (l) tech-locked unit refused ---------------------------------------------
$db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');  // free manpower
$meRow = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$resTech = Training::start($db, $match3, $meRow, 'SWE', 'artillery');   // needs tech 'artillery'
check('(l) tech-locked unit refused (no artillery tech)',
    !$resTech['ok'] && str_contains(strtolower($resTech['message']), 'research'),
    'msg="' . $resTech['message'] . '"');

// --- (m) a batch of 5 trains and completes into the stack ---------------------
// Clean slate: Sweden owns SWE, no army, funded. Train infantry (build_days 2).
$db->execute("DELETE FROM `training` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$meRow = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$goldPre = (float)$meRow['gold'];
$resTrain = Training::start($db, $match3, $meRow, 'SWE', 'infantry');
$meAfterStart = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$costPaid = $goldPre - (float)$meAfterStart['gold'];   // 40 gold × 5 = 200
$expReady = (int)$match3['current_tick'] + (int)GameConfig::UNITS['infantry']['build_days'];
$startOk = $resTrain['ok'] && $resTrain['count'] === 5 && $resTrain['ready_tick'] === $expReady && $costPaid == 200;
// Advance until the batch completes; it should merge into a SWE stack of 5 infantry.
$completed = false; $joined = 0;
for ($i = 0; $i < 4 && !$completed; $i++) {
    $match3 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p3], 'i');
    $evT = Tick::process($db, $match3);
    foreach ($evT as $e) if ($e['type'] === 'training_complete' && ($e['data']['player'] ?? 0) === $S) $completed = true;
}
$trained = $db->selectOne("SELECT `units` FROM `armies` WHERE `match_id`=? AND `player`=? AND `country_code`='SWE' AND `moving_to` IS NULL", [$p3, $S], 'ii');
$joined = $trained ? (Combat::units($trained)['infantry'] ?? 0) : 0;
$noTrainingLeft = (int)($db->selectOne("SELECT COUNT(*) c FROM `training` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii')['c'] ?? 0);
check('(m) batch of 5 trains, completes, joins the stack',
    $startOk && $completed && $joined === 5 && $noTrainingLeft === 0,
    sprintf('startOk=%d cost=%.0f ready@%d completed=%d joined=%d rowsLeft=%d',
        $startOk ? 1 : 0, $costPaid, $expReady, $completed ? 1 : 0, $joined, $noTrainingLeft));

// --- (n) slot limit with factories --------------------------------------------
// Base = 1 slot. One batch busy -> second batch refused. Add 2 active factories ->
// 3 slots, so two more batches start, then the 4th is refused.
$db->execute("DELETE FROM `training` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$db->execute("DELETE FROM `buildings` WHERE `match_id`=? AND `player`=?", [$p3, $S], 'ii');
$db->execute("UPDATE `match_players` SET `gold`=100000,`minerals`=100000 WHERE `id`=?", [$S], 'i');
$match3 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p3], 'i');
$me0 = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$b1 = Training::start($db, $match3, $me0, 'SWE', 'infantry');                 // ok (1/1)
$me0 = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$b2 = Training::start($db, $match3, $me0, 'SWE', 'infantry');                 // refuse (slot full)
// Add two active factories in SWE -> slots become 3.
$db->execute("INSERT INTO `buildings` (`match_id`,`player`,`country_code`,`type`,`status`,`complete_at_tick`) VALUES (?,?,'SWE','factory','active',0),(?,?,'SWE','factory','active',0)",
    [$p3, $S, $p3, $S], 'iiii');
$me0 = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$b3 = Training::start($db, $match3, $me0, 'SWE', 'infantry');                 // ok (2/3)
$me0 = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$b4 = Training::start($db, $match3, $me0, 'SWE', 'infantry');                 // ok (3/3)
$me0 = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$S], 'i');
$b5 = Training::start($db, $match3, $me0, 'SWE', 'infantry');                 // refuse (3/3 full)
check('(n) slot limit: 1 base + 1 per factory',
    $b1['ok'] && !$b2['ok'] && str_contains($b2['message'], 'slot')
    && $b3['ok'] && $b4['ok'] && !$b5['ok'] && str_contains($b5['message'], 'slot'),
    sprintf('base:1ok/2refused=%d,%d  +2factories:3ok/4ok/5refused=%d,%d,%d',
        $b1['ok']?1:0, $b2['ok']?1:0, $b3['ok']?1:0, $b4['ok']?1:0, $b5['ok']?1:0));

// --- (o) weighted victory shares sum ~1 across all owned land -----------------
// Claim the WHOLE board for the two p3 players so every country is owned; the sum of
// weighted shares over owners must be ~1.0 (full world owned).
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `owner` IS NULL", [$S, $p3], 'ii');
$shares3 = Tick::worldShares($db, $p3);
$sumShares = array_sum($shares3);
check('(o) weighted world shares sum to ~1 when the whole world is owned',
    abs($sumShares - 1.0) < 1e-6,
    sprintf('Σshares=%.6f over %d owners', $sumShares, count($shares3)));

// --- (p) victory fires at DOMINATION_SHARE ------------------------------------
// Sweden now owns every country -> share = 1.0 >= 0.60 -> match ends with Sweden.
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=?", [$S, $p3], 'ii');
$db->execute("UPDATE `match_players` SET `status`='defeated' WHERE `id`=?", [$Uusa], 'i');
$evVic = [];
// Re-run just the victory check via a fresh tick.
$match3 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p3], 'i');
Tick::process($db, $match3);
$ended = $db->selectOne("SELECT `status`,`winner_player` FROM `matches` WHERE `id`=?", [$p3], 'i');
check('(p) victory at DOMINATION_SHARE (Sweden owns the world)',
    $ended['status'] === 'ended' && (int)$ended['winner_player'] === $S,
    sprintf('status=%s winner=%s (Sweden=%d)', $ended['status'], var_export($ended['winner_player'], true), $S));

line();
echo "PHASE-3 RESULT: " . ($pass) . " passed, " . ($fail) . " failed (cumulative with phase-2)\n";

// =============================================================================
// Phase-4: occupation and diplomacy (deterministic). GAME_RULES §6, §7.
// =============================================================================
require_once __DIR__ . '/../utils/engine/Occupation.php';
require_once __DIR__ . '/../utils/engine/Diplomacy.php';

$p4pass0 = $pass; $p4fail0 = $fail;
line();
echo "PHASE-4: occupation & diplomacy (unrest / revolt / proposals / truce)\n";
line();

// --- Fresh phase-4 match (same __SMOKE__ tag so cleanup wipes it next run) -----
$db->execute(
    "INSERT INTO `matches` (`name`,`mode`,`status`,`max_players`,`tick_interval_sec`,`current_tick`,`host_user`)
     VALUES (?, 'single', 'active', 8, 20, 0, ?)",
    [$TAG, $uid], 'si'
);
$p4 = (int)$db->lastInsertId();

$mkP = function (string $country, string $name, int $slot, bool $ai = true) use ($db, $p4, $uid) {
    if ($ai) {
        $db->execute("INSERT INTO `match_players` (`match_id`,`is_ai`,`display_name`,`country_code`,`color`,`slot`,`pop`) VALUES (?,1,?,?, '#888888',?,10000000)",
            [$p4, $name, $country, $slot], 'issi');
    } else {
        $db->execute("INSERT INTO `match_players` (`match_id`,`user`,`display_name`,`country_code`,`color`,`slot`,`is_host`,`pop`) VALUES (?,?,?,?, '#e6194b',?,1,10000000)",
            [$p4, $uid, $name, $country, $slot], 'iissi');
    }
    return (int)$db->lastInsertId();
};
$O     = $mkP('DEU', 'You (Germany)', 0, false);   // occupier / human / proposer
$V     = $mkP('FRA', 'CPU France',    1);           // victim / responder
$C     = $mkP('ESP', 'CPU Spain',     2);           // expiry-test target
$Mally = $mkP('ITA', 'CPU Italy',     3);           // AI that should accept an alliance
$Mdecl = $mkP('POL', 'CPU Poland',    4);           // AI that should decline
$E     = $mkP('UKR', 'CPU Ukraine',   5);           // common enemy

$db->execute("INSERT INTO `territories` (`match_id`,`country_code`) SELECT ?, `code` FROM `countries`
              ON DUPLICATE KEY UPDATE `is_capital`=`is_capital`", [$p4], 'i');
foreach ([['DEU',$O],['FRA',$V],['ESP',$C],['ITA',$Mally],['POL',$Mdecl],['UKR',$E]] as $cl) {
    $db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`=?", [$cl[1], $p4, $cl[0]], 'iis');
}
$m4 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p4], 'i');

// Base neutral garrison of LUX for the occupation maths.
$luxC = $db->selectOne("SELECT * FROM `countries` WHERE `code`='LUX'", [], '');
$luxPopM = (float)$luxC['start_pop'] * GameConfig::POP_SCALE;
$luxGarr = GameConfig::neutralGarrison($luxPopM, (int)$luxC['land_slots']);

$resetLux = function (int $unrest, ?int $prev) use ($db, $p4, $O) {
    $db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `country_code`='LUX'", [$p4], 'i');
    $db->execute(
        "UPDATE `territories` SET `owner`=?, `occupied_until`=?, `unrest`=?, `damage`=0, `prev_owner`=?
          WHERE `match_id`=? AND `country_code`='LUX'",
        [$O, 10 /*until*/, $unrest, $prev, $p4], 'iiiii'
    );
};

// --- (q) unrest: +8 with no stack, −10 with a strong garrison -------------------
$m4['current_tick'] = 0;
$resetLux(20, $V);                                   // occupied, no stack
$evQ = [];
Occupation::process($db, $m4, $evQ);
$unrestNoStack = (int)$db->selectOne("SELECT `unrest` FROM `territories` WHERE `match_id`=? AND `country_code`='LUX'", [$p4], 'i')['unrest'];

$resetLux(20, $V);                                   // occupied, strong stack (>= half garrison)
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?, 'LUX', ?, 'LUX')",
    [$p4, $O, json_encode(['infantry' => max(2, $luxGarr)])], 'iis');
$evQ2 = [];
Occupation::process($db, $m4, $evQ2);
$unrestStrong = (int)$db->selectOne("SELECT `unrest` FROM `territories` WHERE `match_id`=? AND `country_code`='LUX'", [$p4], 'i')['unrest'];
check('(q) unrest +8 no-stack, −10 strong garrison',
    $unrestNoStack === 28 && $unrestStrong === 10,
    sprintf('noStack=%d (exp 28) strong=%d (exp 10) garr=%d', $unrestNoStack, $unrestStrong, $luxGarr));

// --- (r) revolt at 100: prev owner reclaims, weak occupier stack driven out -----
$resetLux(99, $V);                                   // unrest 99, prev owner = V (alive)
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?, 'LUX', ?, 'LUX')",
    [$p4, $O, json_encode(['infantry' => 1])], 'iis');   // weak (< half garrison) -> +2 -> 100
$evR = [];
Occupation::process($db, $m4, $evR);
$luxAfter = $db->selectOne("SELECT * FROM `territories` WHERE `match_id`=? AND `country_code`='LUX'", [$p4], 'i');
$occStackGone = (int)($db->selectOne("SELECT COUNT(*) c FROM `armies` WHERE `match_id`=? AND `player`=? AND `country_code`='LUX'", [$p4, $O], 'ii')['c'] ?? 0);
$gotRevolt = false; foreach ($evR as $e) if ($e['type'] === 'revolt' && $e['data']['country'] === 'LUX') $gotRevolt = true;
check('(r) revolt returns land to prev owner, occupier stack removed',
    (int)$luxAfter['owner'] === $V && $luxAfter['occupied_until'] === null && $occStackGone === 0 && $gotRevolt,
    sprintf('owner=%s occupied_until=%s stackGone=%d event=%s',
        var_export($luxAfter['owner'], true), var_export($luxAfter['occupied_until'], true), $occStackGone === 0 ? 1 : 0, $gotRevolt ? 'yes' : 'no'));

// --- (s) integration: occupied_until reached -> integrated, unrest cleared ------
$db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `country_code`='LUX'", [$p4], 'i');
$db->execute("UPDATE `territories` SET `owner`=?, `occupied_until`=5, `unrest`=40, `prev_owner`=? WHERE `match_id`=? AND `country_code`='LUX'", [$O, $V, $p4], 'iii');
$m4['current_tick'] = 5;                             // tick >= occupied_until
$evS = [];
Occupation::process($db, $m4, $evS);
$luxInt = $db->selectOne("SELECT * FROM `territories` WHERE `match_id`=? AND `country_code`='LUX'", [$p4], 'i');
$gotIntegrated = false; foreach ($evS as $e) if ($e['type'] === 'integrated' && $e['data']['country'] === 'LUX') $gotIntegrated = true;
check('(s) integration after occupied_until',
    $luxInt['occupied_until'] === null && (int)$luxInt['unrest'] === 0 && (int)$luxInt['owner'] === $O && $gotIntegrated,
    sprintf('occupied_until=%s unrest=%d event=%s', var_export($luxInt['occupied_until'], true), (int)$luxInt['unrest'], $gotIntegrated ? 'yes' : 'no'));

// --- (t) alliance proposal: propose + accept -> state allied --------------------
$pr = Diplomacy::propose($db, $p4, $O, $V, 'alliance', 0);
$resp = $pr['ok'] ? Diplomacy::respond($db, $p4, (int)$pr['id'], $V, true, 0) : ['ok' => false];
$stateT = Diplomacy::state($db, $p4, $O, $V);
$propRow = $db->selectOne("SELECT `status` FROM `diplomacy_proposals` WHERE `id`=?", [(int)($pr['id'] ?? 0)], 'i');
check('(t) alliance proposal accepted -> allied',
    $pr['ok'] && $resp['ok'] && $stateT === 'allied' && ($propRow['status'] ?? '') === 'accepted',
    sprintf('state=%s propStatus=%s', $stateT, $propRow['status'] ?? 'none'));

// Reset O–V to neutral for the truce test.
Diplomacy::set($db, $p4, $O, $V, 'neutral');

// --- (u) truce: accept -> state truce; declare-war refused; attackBlock wording --
$prU = Diplomacy::propose($db, $p4, $O, $V, 'truce', 0);
Diplomacy::respond($db, $p4, (int)$prU['id'], $V, true, 0);
$stateU = Diplomacy::state($db, $p4, $O, $V);
$truceLeft = Diplomacy::truceLeft($db, $p4, $O, $V, 0);
$war = Diplomacy::declareWar($db, $p4, $O, $V, 0);                  // must be refused
$block = Movement::attackBlock($db, $p4, $O, 'FRA', 0);            // FRA is V's land
check('(u) truce blocks war + attack for 10 days',
    $stateU === 'truce' && $truceLeft === GameConfig::TRUCE_DAYS && !$war['ok']
    && str_contains($war['message'], 'Truce') && is_string($block) && str_contains($block, 'Truce'),
    sprintf('state=%s left=%d warRefused=%d block="%s"', $stateU, $truceLeft, !$war['ok'] ? 1 : 0, is_string($block) ? $block : var_export($block, true)));

// --- (v) access: accept -> directional access only ------------------------------
$prV = Diplomacy::propose($db, $p4, $O, $V, 'access', 0);          // O wants to cross V's land
Diplomacy::respond($db, $p4, (int)$prV['id'], $V, true, 0);        // V grants O
$accessOtoV = Diplomacy::hasAccess($db, $p4, $V, $O);             // owner V granted mover O -> true
$accessVtoO = Diplomacy::hasAccess($db, $p4, $O, $V);             // reverse -> false
$passO = Movement::passableFn($db, $p4, $O);
$canCrossFRA = $passO('FRA');
check('(v) access is directional (V grants O only)',
    $accessOtoV === true && $accessVtoO === false && $canCrossFRA === true,
    sprintf('O-through-V=%d V-through-O=%d passFRA=%d', $accessOtoV ? 1 : 0, $accessVtoO ? 1 : 0, $canCrossFRA ? 1 : 0));

// --- (w) proposal expiry after 3 ticks ------------------------------------------
$prW = Diplomacy::propose($db, $p4, $O, $C, 'alliance', 0);       // expires_tick = 0 + 3
$m4exp = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p4], 'i');
$m4exp['current_tick'] = GameConfig::PROPOSAL_EXPIRE;             // tick 3 -> expires_tick <= tick
$evW = [];
Diplomacy::maintain($db, $m4exp, $evW);
$wStatus = $db->selectOne("SELECT `status` FROM `diplomacy_proposals` WHERE `id`=?", [(int)$prW['id']], 'i')['status'];
$lateResp = Diplomacy::respond($db, $p4, (int)$prW['id'], $C, true, GameConfig::PROPOSAL_EXPIRE);
check('(w) proposal expires after 3 ticks and can’t be accepted late',
    $wStatus === 'expired' && !$lateResp['ok'],
    sprintf('status=%s lateAcceptRefused=%d', $wStatus, !$lateResp['ok'] ? 1 : 0));

// --- (x) AI answers proposals: accept with a shared enemy, decline without -------
// Shared enemy E is at war with both O and the ally-accepting AI.
Diplomacy::set($db, $p4, $O, $E, 'war');
Diplomacy::set($db, $p4, $Mally, $E, 'war');
$prAcc = Diplomacy::propose($db, $p4, $O, $Mally, 'alliance', 0);
$prDec = Diplomacy::propose($db, $p4, $O, $Mdecl, 'alliance', 0); // Mdecl shares no enemy
$m4ai = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p4], 'i');
$evAI = [];
$allyRow  = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$Mally], 'i');
$declRow  = $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$Mdecl], 'i');
AI::act($db, $m4ai, $allyRow, $evAI);
AI::act($db, $m4ai, $declRow, $evAI);
$stateAcc = Diplomacy::state($db, $p4, $O, $Mally);
$stateDec = Diplomacy::state($db, $p4, $O, $Mdecl);
$accStatus = $db->selectOne("SELECT `status` FROM `diplomacy_proposals` WHERE `id`=?", [(int)$prAcc['id']], 'i')['status'];
$decStatus = $db->selectOne("SELECT `status` FROM `diplomacy_proposals` WHERE `id`=?", [(int)$prDec['id']], 'i')['status'];
check('(x) AI accepts alliance with a shared enemy, declines without',
    $stateAcc === 'allied' && $accStatus === 'accepted' && $stateDec !== 'allied' && $decStatus === 'declined',
    sprintf('shared=%s/%s noShared=%s/%s', $stateAcc, $accStatus, $stateDec, $decStatus));

// --- (y) declare-war is unilateral and clears pending proposals -----------------
$prPend = Diplomacy::propose($db, $p4, $Mdecl, $O, 'truce', 0);    // Mdecl -> O pending
$dw = Diplomacy::declareWar($db, $p4, $O, $Mdecl, 0);
$stateY = Diplomacy::state($db, $p4, $O, $Mdecl);
$pendStatus = $db->selectOne("SELECT `status` FROM `diplomacy_proposals` WHERE `id`=?", [(int)$prPend['id']], 'i')['status'];
check('(y) declare-war sets war and clears pending proposals',
    $dw['ok'] && $stateY === 'war' && $pendStatus === 'declined',
    sprintf('state=%s pending=%s', $stateY, $pendStatus));

line();
echo "PHASE-4 RESULT: " . ($pass - $p4pass0) . " passed, " . ($fail - $p4fail0) . " failed\n";

// =============================================================================
// Phase-5: research and strikes (deterministic). GAME_RULES §8, §9.
// =============================================================================
require_once __DIR__ . '/../utils/engine/Research.php';
require_once __DIR__ . '/../utils/engine/Arsenal.php';
require_once __DIR__ . '/../utils/engine/Strike.php';

$p5pass0 = $pass; $p5fail0 = $fail;
line();
echo "PHASE-5: research & strikes (tech / missiles / barrage / air / nuke)\n";
line();

$db->execute(
    "INSERT INTO `matches` (`name`,`mode`,`status`,`max_players`,`tick_interval_sec`,`current_tick`,`host_user`)
     VALUES (?, 'single', 'active', 8, 20, 0, ?)",
    [$TAG, $uid], 'si'
);
$p5 = (int)$db->lastInsertId();
$db->execute("INSERT INTO `match_players` (`match_id`,`user`,`display_name`,`country_code`,`color`,`slot`,`is_host`,`pop`) VALUES (?,?,?, 'DEU','#e6194b',0,1,?)",
    [$p5, $uid, 'You (Germany)', 50000000], 'iisi');
$O = (int)$db->lastInsertId();
$db->execute("INSERT INTO `match_players` (`match_id`,`is_ai`,`display_name`,`country_code`,`color`,`slot`,`pop`) VALUES (?,1,?, 'FRA','#3cb44b',1,?)",
    [$p5, 'CPU France', 100000000], 'isi');
$V = (int)$db->lastInsertId();
$db->execute("INSERT INTO `match_players` (`match_id`,`is_ai`,`display_name`,`country_code`,`color`,`slot`,`pop`) VALUES (?,1,?, 'POL','#4363d8',2,10000000)",
    [$p5, 'CPU Poland'], 'is');
$W = (int)$db->lastInsertId();

$db->execute("INSERT INTO `territories` (`match_id`,`country_code`) SELECT ?, `code` FROM `countries`
              ON DUPLICATE KEY UPDATE `is_capital`=`is_capital`", [$p5], 'i');
foreach ([['DEU',$O],['FRA',$V],['POL',$W]] as $cl) {
    $db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`=?", [$cl[1], $p5, $cl[0]], 'iis');
}
$m5 = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p5], 'i');   // current_tick = 0

$fund = function (int $pid) use ($db) {
    $db->execute("UPDATE `match_players` SET `gold`=200000,`minerals`=200000,`oil`=100000,`research`=100000,`food`=100000 WHERE `id`=?", [$pid], 'i');
};
$fund($O);
$reO = fn() => $db->selectOne("SELECT * FROM `match_players` WHERE `id`=?", [$O], 'i');

// --- (aa) research: gating, payment, completion --------------------------------
$meO = $reO();
$airLocked = Research::start($db, $m5, $meO, 'air');                       // requires artillery -> refused
$meO = $reO();
$startArt = Research::start($db, $m5, $meO, 'artillery');                  // ok; pays 300 research + 1500 gold
$meO = $reO();
$paidR = 100000 - (float)$meO['research'];
$paidG = 200000 - (float)$meO['gold'];
// Complete it: advance research at started+days.
$m5done = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p5], 'i');
$m5done['current_tick'] = (int)GameConfig::TECH['artillery']['days'];      // 0 + 4
$evR5 = [];
Research::advance($db, $m5done, $evR5);
$artDone = Research::isDone($db, $p5, $O, 'artillery');
$gotResComplete = false; foreach ($evR5 as $e) if ($e['type'] === 'research_complete' && ($e['data']['tech'] ?? '') === 'artillery') $gotResComplete = true;
check('(aa) research gates, pays up front, completes after days',
    !$airLocked['ok'] && str_contains($airLocked['message'], 'Artillery')
    && $startArt['ok'] && $paidR == 300 && $paidG == 1500 && $artDone && $gotResComplete,
    sprintf('airLocked="%s" paidR=%.0f paidG=%.0f done=%d', $airLocked['message'], $paidR, $paidG, $artDone ? 1 : 0));

// --- (bb) arsenal: one-at-a-time build + completion into stock -------------------
$db->execute("INSERT INTO `player_tech` (`match_id`,`player`,`tech_key`,`level`) VALUES (?,?,'srbm',1)
              ON DUPLICATE KEY UPDATE `level`=1", [$p5, $O], 'ii');         // grant SRBM tech
$fund($O);
$meO = $reO();
$goldPre = (float)$meO['gold'];
$b1 = Arsenal::build($db, $m5, $meO, 'srbm');                              // ok; pays 800 gold
$meO = $reO();
$paidMissile = $goldPre - (float)$meO['gold'];
$b2 = Arsenal::build($db, $m5, $meO, 'srbm');                              // refused: already in production
$m5ars = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p5], 'i');
$m5ars['current_tick'] = (int)GameConfig::ARSENAL['srbm']['days'];         // 0 + 3
$evA5 = [];
Arsenal::advance($db, $m5ars, $evA5);
$srbmStock = Arsenal::stock($db, $p5, $O, 'srbm');
check('(bb) arsenal builds one at a time and stocks on completion',
    $b1['ok'] && $paidMissile == 800 && !$b2['ok'] && str_contains($b2['message'], 'production') && $srbmStock === 1,
    sprintf('paid=%.0f secondRefused=%d stock=%d', $paidMissile, !$b2['ok'] ? 1 : 0, $srbmStock));

// --- (cc) artillery barrage: border range, cheapest-first kills, cooldown --------
Diplomacy::set($db, $p5, $O, $V, 'war');
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`='LUX'", [$V, $p5], 'ii');
$db->execute("DELETE FROM `armies` WHERE `match_id`=? AND `country_code` IN ('DEU','LUX')", [$p5], 'i');
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?,'DEU',?, 'DEU')",
    [$p5, $O, json_encode(['artillery' => 5])], 'iis');                     // firing stack: 5 guns
$fireId = (int)$db->lastInsertId();
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?,'LUX',?, 'LUX')",
    [$p5, $V, json_encode(['infantry' => 10, 'artillery' => 4])], 'iis');  // defenders
$fund($O);
$meO = $reO();
$evC = [];
$noBorder = Strike::execute($db, $m5, $meO, 'artillery', 'CHN', $fireId, $evC);     // DEU doesn't border CHN
$minPre = (float)$reO()['minerals'];
$evC2 = [];
$hit = Strike::execute($db, $m5, $reO(), 'artillery', 'LUX', $fireId, $evC2);       // R = 2*5 = 10
$minPost = (float)$reO()['minerals'];
$luxStack = $db->selectOne("SELECT `units` FROM `armies` WHERE `match_id`=? AND `player`=? AND `country_code`='LUX'", [$p5, $V], 'ii');
$lu = $luxStack ? Combat::units($luxStack) : [];
$evC3 = [];
$cooled = Strike::execute($db, $m5, $reO(), 'artillery', 'LUX', $fireId, $evC3);    // same tick -> refused
// R=10: 4 artillery(def1)=4, then 3 infantry(def2)=6 -> 7 destroyed, infantry 7 left, 0 to garrison.
check('(cc) artillery: border rule, cheapest-first kills, cost, cooldown',
    !$noBorder['ok'] && str_contains($noBorder['message'], 'border')
    && $hit['ok'] && ($hit['data']['units_destroyed'] ?? -1) === 7 && ($lu['infantry'] ?? -1) === 7 && !isset($lu['artillery'])
    && ($minPre - $minPost) == 5 && !$cooled['ok'] && str_contains($cooled['message'], 'struck'),
    sprintf('border=%d destroyed=%d infLeft=%d cost=%.0f cooldown=%d',
        !$noBorder['ok'] ? 1 : 0, $hit['data']['units_destroyed'] ?? -1, $lu['infantry'] ?? -1, $minPre - $minPost, !$cooled['ok'] ? 1 : 0));

// --- (dd) air strike: range + plane loss when base garrison > 20 -----------------
$db->execute("UPDATE `territories` SET `owner`=? WHERE `match_id`=? AND `country_code`='NPL'", [$O, $p5], 'ii');
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?,'NPL',?, 'NPL')",
    [$p5, $O, json_encode(['air' => 10])], 'iis');                          // 10 planes near India
$airId = (int)$db->lastInsertId();
$fund($O);
$kmNI = Movement::km($db, 'NPL', 'IND');
$oilPre = (float)$reO()['oil'];
$evD = [];
$airHit = Strike::execute($db, $m5, $reO(), 'air', 'IND', $airId, $evD);    // IND neutral garrison 60 (>20)
$oilPost = (float)$reO()['oil'];
$airStack = $db->selectOne("SELECT `units` FROM `armies` WHERE `id`=?", [$airId], 'i');
$au = $airStack ? Combat::units($airStack) : [];
$indDmg = (int)$db->selectOne("SELECT `damage` FROM `territories` WHERE `match_id`=? AND `country_code`='IND'", [$p5], 'i')['damage'];
check('(dd) air strike: in range, plane loss, def damage, oil cost',
    $airHit['ok'] && ($airHit['data']['plane_loss'] ?? -1) === 1 && ($au['air'] ?? -1) === 9 && $indDmg === 30 && ($oilPre - $oilPost) == 20,
    sprintf('km=%.0f planeLoss=%s airLeft=%d indDmg=%d oil=-%.0f', $kmNI, $airHit['data']['plane_loss'] ?? 'n/a', $au['air'] ?? -1, $indDmg, $oilPre - $oilPost));

// --- (ee) missile (SRBM): range from capital, consumes stock, -12 def ------------
$fund($O);
$evE = [];
$farMissile = Strike::execute($db, $m5, $reO(), 'srbm', 'IND', null, $evE);  // >1000 km from DEU
$evE2 = [];
$autMissile = Strike::execute($db, $m5, $reO(), 'srbm', 'AUT', null, $evE2); // AUT neutral, within 1000 km
$autDmg = (int)$db->selectOne("SELECT `damage` FROM `territories` WHERE `match_id`=? AND `country_code`='AUT'", [$p5], 'i')['damage'];
$srbmLeft = Arsenal::stock($db, $p5, $O, 'srbm');
check('(ee) SRBM: out-of-range refused, in-range spends stock for −12 def',
    !$farMissile['ok'] && str_contains($farMissile['message'], 'range')
    && $autMissile['ok'] && $autDmg === 12 && $srbmLeft === 0,
    sprintf('farRefused=%d autDmg=%d stockLeft=%d', !$farMissile['ok'] ? 1 : 0, $autDmg, $srbmLeft));

// --- (ff) nuclear strike + consequences + AI retaliation ------------------------
$db->execute("INSERT INTO `arsenal` (`match_id`,`player`,`item`,`stock`) VALUES (?,?,'warhead',1),(?,?,'warhead',1)
              ON DUPLICATE KEY UPDATE `stock`=1", [$p5, $O, $p5, $V], 'iiii');
$db->execute("INSERT INTO `buildings` (`match_id`,`player`,`country_code`,`type`,`status`,`complete_at_tick`) VALUES (?,?,'FRA','factory','active',0)", [$p5, $V], 'ii');
$db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`units`,`origin`) VALUES (?,?,'FRA',?, 'FRA')",
    [$p5, $V, json_encode(['infantry' => 5])], 'iis');
$db->execute("UPDATE `match_players` SET `pop`=100000000 WHERE `id`=?", [$V], 'i');
$db->execute("UPDATE `match_players` SET `pop`=50000000 WHERE `id`=?", [$O], 'i');
$tick5 = (int)$m5['current_tick'];
$evN = [];
$nuke = Strike::execute($db, $m5, $reO(), 'nuclear', 'FRA', null, $evN);
$fraBuildings = (int)$db->selectOne("SELECT COUNT(*) c FROM `buildings` WHERE `match_id`=? AND `country_code`='FRA'", [$p5], 'i')['c'];
$fraStacks    = (int)$db->selectOne("SELECT COUNT(*) c FROM `armies` WHERE `match_id`=? AND `country_code`='FRA' AND `moving_to` IS NULL", [$p5], 'i')['c'];
$vPop  = (int)$db->selectOne("SELECT `pop` FROM `match_players` WHERE `id`=?", [$V], 'i')['pop'];
$oPop  = (int)$db->selectOne("SELECT `pop` FROM `match_players` WHERE `id`=?", [$O], 'i')['pop'];
$fraRuin = $db->selectOne("SELECT `ruined_until` FROM `territories` WHERE `match_id`=? AND `country_code`='FRA'", [$p5], 'i')['ruined_until'];
$deuRuin = $db->selectOne("SELECT `ruined_until` FROM `territories` WHERE `match_id`=? AND `country_code`='DEU'", [$p5], 'i')['ruined_until'];
$warOW = Diplomacy::atWar($db, $p5, $O, $W);
$oWar  = Arsenal::stock($db, $p5, $O, 'warhead');
$vWar  = Arsenal::stock($db, $p5, $V, 'warhead');
$nukeEvents = 0; foreach ($evN as $e) if ($e['type'] === 'nuclear_strike') $nukeEvents++;
check('(ff) nuke devastates target, kills 40% pop, ruins land, AI war + retaliation',
    $nuke['ok'] && $fraBuildings === 0 && $fraStacks === 0 && $vPop === 60000000
    && (int)$fraRuin === $tick5 + GameConfig::NUKE_RUINED_DAYS && $warOW === true
    && $oWar === 0 && $vWar === 0 && (int)$deuRuin === $tick5 + GameConfig::NUKE_RUINED_DAYS
    && $oPop === 30000000 && $nukeEvents >= 2,
    sprintf('fraBld=%d fraStk=%d vPop=%d oPop=%d fraRuin=%s deuRuin=%s warOW=%d oWar=%d vWar=%d nukeEv=%d',
        $fraBuildings, $fraStacks, $vPop, $oPop, var_export($fraRuin, true), var_export($deuRuin, true),
        $warOW ? 1 : 0, $oWar, $vWar, $nukeEvents));

// --- (gg) ruined farmland is excluded from food production -----------------------
$db->execute("UPDATE `territories` SET `owner`=?, `ruined_until`=NULL WHERE `match_id`=? AND `country_code`='ESP'", [$O, $p5], 'ii');
$db->execute("DELETE FROM `buildings` WHERE `match_id`=? AND `country_code`='ESP'", [$p5], 'i');
$db->execute("INSERT INTO `buildings` (`match_id`,`player`,`country_code`,`type`,`status`,`complete_at_tick`) VALUES (?,?,'ESP','farm','active',0)", [$p5, $O], 'ii');
$ruinQ = "SELECT COUNT(*) c FROM `buildings` b
            JOIN `countries` c2 ON c2.`code`=b.`country_code`
            LEFT JOIN `territories` t ON t.`match_id`=b.`match_id` AND t.`country_code`=b.`country_code`
           WHERE b.`match_id`=? AND b.`player`=? AND b.`status`='active' AND b.`country_code`='ESP'
             AND NOT (b.`type`='farm' AND t.`ruined_until` IS NOT NULL AND t.`ruined_until` > ?)";
$farmWhenOk = (int)$db->selectOne($ruinQ, [$p5, $O, 0], 'iii')['c'];              // not ruined -> counted
$db->execute("UPDATE `territories` SET `ruined_until`=5 WHERE `match_id`=? AND `country_code`='ESP'", [$p5], 'i');
$farmWhenRuined = (int)$db->selectOne($ruinQ, [$p5, $O, 0], 'iii')['c'];          // ruined -> excluded
check('(gg) ruined country grows no food (farm excluded from economy)',
    $farmWhenOk === 1 && $farmWhenRuined === 0,
    sprintf('ok=%d ruined=%d', $farmWhenOk, $farmWhenRuined));

// --- (hh) strike damage to a garrison recovers over time ------------------------
$db->execute("UPDATE `territories` SET `owner`=NULL, `damage`=10, `occupied_until`=NULL WHERE `match_id`=? AND `country_code`='PRT'", [$p5], 'i');
$prtC = $db->selectOne("SELECT * FROM `countries` WHERE `code`='PRT'", [], '');
$prtBase = GameConfig::neutralGarrison((float)$prtC['start_pop'] * GameConfig::POP_SCALE, (int)$prtC['land_slots']);
$prtRec = max(1, (int)round($prtBase * GameConfig::DAMAGE_RECOVER));
$m5proc = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$p5], 'i');
Tick::process($db, $m5proc);
$prtDmg = (int)$db->selectOne("SELECT `damage` FROM `territories` WHERE `match_id`=? AND `country_code`='PRT'", [$p5], 'i')['damage'];
check('(hh) garrison damage recovers 10% of base per day',
    $prtDmg === 10 - $prtRec,
    sprintf('damage %d -> %d (recover %d of base %d)', 10, $prtDmg, $prtRec, $prtBase));

line();
echo "PHASE-5 RESULT: " . ($pass - $p5pass0) . " passed, " . ($fail - $p5fail0) . " failed\n";
echo "CUMULATIVE: " . $pass . " passed, " . $fail . " failed\n";

$db->close();
echo "\nSmoke test complete.\n";
