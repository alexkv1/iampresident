<?php
// POST /api/debug/cheat { match_id, cmd }  — developer cheat console (gated by conf['debug-cheats']).
// Commands are typed in the in-game chat prefixed with "/". Everything applies to the calling
// player (resources/tech/arsenal) or the match (speed/tick). NOT for production use.
require __DIR__ . '/../../../utils/bootstrap.php';
require_once __DIR__ . '/../../../utils/engine/GameConfig.php';
require_once __DIR__ . '/../../../utils/engine/Tick.php';
require_method('POST');

if (!(conf()['debug-cheats'] ?? false)) json_err('Debug cheats are disabled on this server.', 403);

$auth = require_auth();
$matchId = (int)in('match_id', 0);
if (!$matchId) json_err('Missing match_id.');
$match = load_match($matchId);
$me = require_player($matchId, $auth->user);
$pid = (int)$me['id'];
$db = db();

$raw  = trim((string)in('cmd', ''));
$toks = preg_split('/\s+/', $raw);
$cmd  = strtolower($toks[0] ?? '');
$a1   = $toks[1] ?? null;
$a2   = $toks[2] ?? null;

$RES = GameConfig::RESOURCES;
$TECH = array_keys(GameConfig::TECH);
$ARS = array_keys(GameConfig::ARSENAL);

$addRes = function (string $res, int $amt) use ($db, $pid) {
    $db->execute("UPDATE `match_players` SET `$res` = GREATEST(0, `$res` + ?) WHERE `id` = ?", [$amt, $pid], 'di');
};

switch ($cmd) {
    case 'help':
    case '':
        json_ok(['message' =>
            'Cheats: /rich · /give <res|all> <amt> · /gold <amt> · /unlock <tech|all> · ' .
            '/arsenal <item|all> <n> · /speed <sec> · /tick [n] · /pop <amt>. ' .
            'Res: ' . implode(',', $RES) . '. Tech: ' . implode(',', $TECH) . '. Items: ' . implode(',', $ARS) . '.']);

    case 'rich':
        foreach ($RES as $r) $db->execute("UPDATE `match_players` SET `$r` = 1000000 WHERE `id` = ?", [$pid], 'i');
        json_ok(['message' => 'All resources maxed (1 000 000 each).']);

    case 'give':
        $amt = (int)$a2;
        if ($a1 === 'all') { foreach ($RES as $r) $addRes($r, $amt); json_ok(['message' => '+' . $amt . ' to every resource.']); }
        if (!in_array($a1, $RES, true)) json_err('Unknown resource. Use: ' . implode(',', $RES));
        $addRes($a1, $amt);
        json_ok(['message' => '+' . $amt . ' ' . $a1 . '.']);

    case 'gold':
        $addRes('gold', (int)$a1);
        json_ok(['message' => '+' . (int)$a1 . ' gold.']);

    case 'pop':
        $db->execute("UPDATE `match_players` SET `pop` = ? WHERE `id` = ?", [max(100000, (int)$a1), $pid], 'ii');
        json_ok(['message' => 'Population set to ' . number_format(max(100000, (int)$a1)) . '.']);

    case 'unlock':
    case 'tech':
        $keys = ($a1 === 'all') ? $TECH : (in_array($a1, $TECH, true) ? [$a1] : null);
        if (!$keys) json_err('Unknown tech. Use: ' . implode(',', $TECH) . ' or all.');
        foreach ($keys as $k) {
            $db->execute(
                "INSERT INTO `player_tech` (`match_id`,`player`,`tech_key`,`level`,`progress`,`started_tick`)
                 VALUES (?,?,?,1,0,0) ON DUPLICATE KEY UPDATE `level`=1",
                [$matchId, $pid, $k], 'iis'
            );
        }
        json_ok(['message' => 'Researched: ' . implode(', ', $keys) . '.']);

    case 'arsenal':
        $n = max(0, (int)($a2 ?? 1));
        $items = ($a1 === 'all') ? $ARS : (in_array($a1, $ARS, true) ? [$a1] : null);
        if (!$items) json_err('Unknown item. Use: ' . implode(',', $ARS) . ' or all.');
        foreach ($items as $it) {
            $db->execute(
                "INSERT INTO `arsenal` (`match_id`,`player`,`item`,`stock`,`in_production`)
                 VALUES (?,?,?,?,0) ON DUPLICATE KEY UPDATE `stock`=?",
                [$matchId, $pid, $it, $n, $n], 'iisii'
            );
        }
        json_ok(['message' => 'Stocked ' . $n . '× ' . implode(', ', $items) . '.']);

    case 'speed':
        $sec = max(2, min(60, (int)$a1));
        $db->execute("UPDATE `matches` SET `tick_interval_sec` = ?, `next_tick_at` = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE `id` = ?", [$sec, $sec, $matchId], 'iii');
        json_ok(['message' => 'Day length set to ' . $sec . 's.']);

    case 'tick':
    case 'skip':
        $n = max(1, min(50, (int)($a1 ?? 1)));
        $done = 0;
        for ($i = 0; $i < $n; $i++) {
            $m = $db->selectOne("SELECT * FROM `matches` WHERE `id` = ?", [$matchId], 'i');
            if (!$m || $m['status'] !== 'active') break;
            Tick::process($db, $m);
            realtime_emit($matchId, 'tick', ['tick' => (int)$m['current_tick'] + 1]);
            $done++;
        }
        json_ok(['message' => 'Advanced ' . $done . ' day' . ($done === 1 ? '' : 's') . '.']);

    default:
        json_err('Unknown cheat "/' . $cmd . '". Type /help.');
}
