<?php
// Computer-controlled presidents. One lightweight decision per tick:
// keep the lights on, keep people fed, then develop the economy.

final class AI {

    public static function act(DB $db, array $match, array $player, array &$events): void {
        $capital = $player['country_code'];
        if (!$capital) return;

        // Count buildings (active + under construction) in the capital by type.
        $rows = $db->select(
            "SELECT `type`, COUNT(*) c FROM `buildings`
              WHERE `match_id` = ? AND `player` = ? AND `country_code` = ?
              GROUP BY `type`",
            [$match['id'], $player['id'], $capital], 'iis'
        ) ?: [];
        $count = [];
        foreach ($rows as $r) $count[$r['type']] = (int)$r['c'];
        $n = fn($t) => $count[$t] ?? 0;

        $country = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$capital], 's');

        // Decide the next building by priority.
        $energyUsers = $n('mine') + $n('oil_rig') + $n('factory') + $n('lab') + $n('bank');
        $choice = null;
        if ($n('power_plant') === 0 || $energyUsers > $n('power_plant') * 2) {
            $choice = 'power_plant';
        } elseif ($n('farm') < 2) {
            $choice = 'farm';
        } elseif ((int)$country['minerals'] >= 55 && $n('mine') < 3) {
            $choice = 'mine';
        } elseif ((int)$country['oil'] >= 55 && $n('oil_rig') < 2) {
            $choice = 'oil_rig';
        } elseif ($n('bank') < 1) {
            $choice = 'bank';
        } elseif ($n('housing') < 2) {
            $choice = 'housing';
        } elseif ($n('lab') < 1) {
            $choice = 'lab';
        } else {
            $choice = 'factory';
        }

        // Keep a gold reserve scaled by difficulty (easier AI hoards less efficiently).
        $reserve = [250, 150, 80][max(0, min(2, (int)$player['ai_level'] - 1))];
        $cost = GameConfig::building($choice)['cost'] ?? [];
        if ((float)$player['gold'] - ($cost['gold'] ?? 0) < $reserve) return;

        $res = Build::start($db, $match, $player, $capital, $choice);
        if ($res['ok']) {
            $events[] = ['type' => 'ai_build', 'data' => ['player' => (int)$player['id'], 'type' => $choice, 'country' => $capital]];
        }
    }
}
