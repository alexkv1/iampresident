<?php
// Balance simulator (GAME_RULES P2-8): run N AI-only matches for D days with seeded
// RNG and report balance metrics + degenerate-game flags.
//   php tools/sim/run.php [matches=5] [days=120] [seed=12345]
require __DIR__ . '/../../utils/bootstrap.php';
require_once __DIR__ . '/../../utils/engine/Tick.php';

$MATCHES = (int)($argv[1] ?? 5);
$DAYS    = (int)($argv[2] ?? 120);
$SEED    = (int)($argv[3] ?? 12345);
$TAG     = '__SIM__';

$db = new DB();

// Clean any previous sim run.
foreach ($db->select("SELECT id FROM `matches` WHERE `name` = ?", [$TAG], 's') ?: [] as $m) {
    $id = (int)$m['id'];
    foreach (['armies','buildings','territories','match_players','match_events','diplomacy','diplomacy_proposals','trades','chat_messages','training','arsenal','player_tech'] as $t) {
        $db->execute("DELETE FROM `$t` WHERE `match_id` = ?", [$id], 'i');
    }
    $db->execute("DELETE FROM `matches` WHERE `id` = ?", [$id], 'i');
}
$db->execute("DELETE FROM `users` WHERE `display_name` = ?", ['__SIMUSER__'], 's');
$db->execute("INSERT INTO `users` (`display_name`, `is_guest`) VALUES ('__SIMUSER__', 1)");
$uid = (int)$db->lastInsertId();

// Six AIs spread across continents so there is room to expand before they clash.
$ROSTER = [
    ['USA', 'CPU USA',    '#e6194b'],
    ['CHN', 'CPU China',  '#3cb44b'],
    ['RUS', 'CPU Russia', '#4363d8'],
    ['BRA', 'CPU Brazil', '#f58231'],
    ['IND', 'CPU India',  '#911eb4'],
    ['AUS', 'CPU Oz',     '#46f0f0'],
];

function pct(float $x): string { return number_format($x * 100, 1) . '%'; }
function line() { echo str_repeat('-', 92) . "\n"; }

$summary = [];

for ($g = 0; $g < $MATCHES; $g++) {
    mt_srand($SEED + $g);   // seed the combat RNG (Combat uses mt_rand by default)

    $db->execute(
        "INSERT INTO `matches` (`name`,`mode`,`status`,`max_players`,`tick_interval_sec`,`current_tick`,`host_user`,`settings`)
         VALUES (?, 'single', 'lobby', 8, 20, 0, ?, ?)",
        [$TAG, $uid, json_encode(['sim' => true])], 'sis'
    );
    $mid = (int)$db->lastInsertId();
    foreach ($ROSTER as $i => $r) {
        $db->execute(
            "INSERT INTO `match_players` (`match_id`,`is_ai`,`ai_level`,`display_name`,`country_code`,`color`,`slot`,`is_ready`) VALUES (?,1,2,?,?,?,?,1)",
            [$mid, $r[1], $r[0], $r[2], $i], 'isssi'
        );
    }
    $match = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$mid], 'i');
    $res = MatchSetup::start($db, $match);
    if (!$res['ok']) { echo "match $g START FAILED: {$res['message']}\n"; continue; }

    $firstConquest = null;
    $nukeUsed = false;
    $winner = null; $winDay = null;
    $starveDays = 0;
    $curve = [];   // day => leader share

    for ($day = 1; $day <= $DAYS; $day++) {
        $match = $db->selectOne("SELECT * FROM `matches` WHERE `id`=?", [$mid], 'i');
        if ($match['status'] === 'ended') break;
        $events = Tick::process($db, $match);

        foreach ($events as $e) {
            if ($firstConquest === null && $e['type'] === 'conquest') $firstConquest = $day;
            if ($e['type'] === 'nuclear_strike') $nukeUsed = true;
            if ($e['type'] === 'match_ended') { $winner = (int)($e['data']['winner'] ?? 0); $winDay = $day; }
        }

        // Starvation: any active player at (near) zero food this day.
        $starving = (int)($db->selectOne(
            "SELECT COUNT(*) c FROM `match_players` WHERE `match_id`=? AND `status`='active' AND `food` < 1", [$mid], 'i'
        )['c'] ?? 0);
        if ($starving > 0) $starveDays++;

        if ($day % 20 === 0 || $day === 1) {
            $shares = Tick::worldShares($db, $mid);
            $curve[$day] = $shares ? max($shares) : 0.0;
        }
    }

    // End-of-match army vs manpower.
    $players = $db->select("SELECT * FROM `match_players` WHERE `match_id`=? AND `status`='active'", [$mid], 'i') ?: [];
    $totUnits = 0; $totLimit = 0; $np = 0;
    foreach ($players as $p) {
        $u = 0;
        foreach ($db->select("SELECT `units` FROM `armies` WHERE `match_id`=? AND `player`=?", [$mid, (int)$p['id']], 'ii') ?: [] as $a) {
            foreach (Combat::units($a) as $c) $u += (int)$c;
        }
        $totUnits += $u;
        $totLimit += GameConfig::manpowerLimit((float)$p['pop']);
        $np++;
    }
    $avgArmy  = $np ? $totUnits / $np : 0;
    $avgLimit = $np ? $totLimit / $np : 0;

    $endShares = Tick::worldShares($db, $mid);
    $leadShare = $endShares ? max($endShares) : 0.0;

    $summary[] = compact('g', 'firstConquest', 'nukeUsed', 'winner', 'winDay', 'starveDays', 'curve', 'avgArmy', 'avgLimit', 'leadShare', 'np');

    // Per-match report.
    line();
    echo "MATCH " . ($g + 1) . " (seed " . ($SEED + $g) . ")\n";
    line();
    printf("  first conquest : %s\n", $firstConquest === null ? 'NONE' : "day $firstConquest");
    printf("  winner         : %s\n", $winner === null ? "none by day $DAYS" : "player $winner on day $winDay");
    printf("  nuke used      : %s\n", $nukeUsed ? 'yes' : 'no');
    printf("  starvation days: %d / %d\n", $starveDays, $DAYS);
    printf("  avg army       : %.1f units  (avg manpower limit %.0f, %.0f%% filled)\n",
        $avgArmy, $avgLimit, $avgLimit > 0 ? 100 * $avgArmy / $avgLimit : 0);
    echo "  leader share   : ";
    foreach ($curve as $d => $s) echo "d$d=" . pct($s) . "  ";
    echo "(end " . pct($leadShare) . ")\n";

    $flags = [];
    if ($firstConquest === null || $firstConquest > 60) $flags[] = 'no/late conquest (>day 60)';
    if ($winDay !== null && $winDay < 30) $flags[] = "winner before day 30 (day $winDay)";
    if ($starveDays > $DAYS * 0.25) $flags[] = "chronic starvation ($starveDays days)";
    if ($avgLimit > 0 && $avgArmy < 0.15 * $avgLimit) $flags[] = 'armies tiny vs manpower (<15%)';
    if ($flags) echo "  ⚠ DEGENERATE : " . implode('; ', $flags) . "\n";
}

// Aggregate.
line();
echo "AGGREGATE over " . count($summary) . " matches\n";
line();
$conq = array_values(array_filter(array_map(fn($s) => $s['firstConquest'], $summary), fn($x) => $x !== null));
$wins = array_values(array_filter(array_map(fn($s) => $s['winDay'], $summary), fn($x) => $x !== null));
$nukes = count(array_filter($summary, fn($s) => $s['nukeUsed']));
printf("  matches with a conquest : %d / %d\n", count($conq), count($summary));
printf("  avg first-conquest day  : %s\n", $conq ? number_format(array_sum($conq) / count($conq), 1) : 'n/a');
printf("  matches with a winner   : %d / %d\n", count($wins), count($summary));
printf("  avg winning day         : %s\n", $wins ? number_format(array_sum($wins) / count($wins), 1) : 'n/a');
printf("  matches with a nuke     : %d / %d\n", $nukes, count($summary));
printf("  avg army fill at end    : %s\n", $summary
    ? pct(array_sum(array_map(fn($s) => $s['avgLimit'] > 0 ? $s['avgArmy'] / $s['avgLimit'] : 0, $summary)) / count($summary))
    : 'n/a');

$db->close();
echo "\nSim complete.\n";
