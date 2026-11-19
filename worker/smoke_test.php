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
    $db->execute("INSERT INTO `armies` (`match_id`,`player`,`country_code`,`type`,`count`,`moving_to`,`arrive_at_tick`) VALUES (?,?, 'SWE','infantry',100,?,?)",
        [$mid, $humanId, $target, $arrive], 'iisi');
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

$db->close();
echo "\nSmoke test complete.\n";
