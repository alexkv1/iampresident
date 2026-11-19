<?php
// Shared construction logic used by the build API endpoint and the AI.

final class Build {

    /**
     * Attempt to start a building. Deducts cost and inserts a 'building' row.
     * @return array {ok:bool, message:string, building_id?:int, complete_at_tick?:int}
     */
    public static function start(DB $db, array $match, array $player, string $countryCode, string $type): array {
        $cfg = GameConfig::building($type);
        if (!$cfg) return ['ok' => false, 'message' => 'Unknown building type.'];

        // Must own the territory.
        $terr = $db->selectOne(
            "SELECT * FROM `territories` WHERE `match_id` = ? AND `country_code` = ?",
            [$match['id'], $countryCode], 'is'
        );
        if (!$terr || (int)$terr['owner'] !== (int)$player['id']) {
            return ['ok' => false, 'message' => 'You do not control this territory.'];
        }

        // Must have a free land slot.
        $country = $db->selectOne("SELECT * FROM `countries` WHERE `code` = ?", [$countryCode], 's');
        $used = (int)($db->selectOne(
            "SELECT COUNT(*) c FROM `buildings` WHERE `match_id` = ? AND `country_code` = ? AND `player` = ?",
            [$match['id'], $countryCode, $player['id']], 'isi'
        )['c'] ?? 0);
        if ($used >= (int)$country['land_slots']) {
            return ['ok' => false, 'message' => 'No free land slots in this country.'];
        }

        // Must afford it.
        foreach (($cfg['cost'] ?? []) as $res => $amt) {
            if ((float)$player[$res] < $amt) {
                return ['ok' => false, 'message' => 'Not enough ' . $res . '.'];
            }
        }

        // Deduct and insert.
        $db->begin();
        foreach (($cfg['cost'] ?? []) as $res => $amt) {
            $db->execute(
                "UPDATE `match_players` SET `$res` = `$res` - ? WHERE `id` = ?",
                [$amt, $player['id']], 'di'
            );
        }
        $completeAt = (int)$match['current_tick'] + (int)$cfg['build_ticks'];
        $db->execute(
            "INSERT INTO `buildings` (`match_id`, `player`, `country_code`, `type`, `status`, `complete_at_tick`)
             VALUES (?, ?, ?, ?, 'building', ?)",
            [$match['id'], $player['id'], $countryCode, $type, $completeAt], 'iissi'
        );
        $id = $db->lastInsertId();
        $db->commit();

        return ['ok' => true, 'message' => 'Construction started.', 'building_id' => $id, 'complete_at_tick' => $completeAt];
    }
}
