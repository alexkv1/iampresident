<?php
// Per-player, per-tick economy. Pure computation — no DB writes.
// Energy is a stored resource that gates every other building's output,
// which is how "more energy => advance faster" falls out of the model.

final class Economy {

    /**
     * @param array $player    match_players row (current stockpiles + pop)
     * @param array $buildings active buildings, each joined with its country's
     *                         attributes (farmland, minerals, oil)
     * @param float $basePopCap capacity from owned land before housing
     * @return array {stock, pop_cap, food_prod, food_cons, efficiency}
     *               stock values are UNCLAMPED (food may be negative => starving)
     */
    public static function step(array $player, array $buildings, float $basePopCap): array {
        $popM    = (float)$player['pop'] * GameConfig::POP_SCALE;
        $foodCons = $popM * GameConfig::FOOD_PER_POP;
        $popTax   = $popM * GameConfig::POP_TAX_GOLD;

        $stock = [];
        foreach (GameConfig::RESOURCES as $r) $stock[$r] = (float)$player[$r];

        $gross = ['food' => 0.0, 'minerals' => 0.0, 'gold' => 0.0, 'oil' => 0.0, 'research' => 0.0];
        $energyProd = 0.0;
        $energyDemand = 0.0;
        $oilBurned = 0.0;
        $popCapBonus = 0.0;

        foreach ($buildings as $b) {
            $cfg = GameConfig::building($b['type']);
            if (!$cfg) continue;
            $lvl = (int)$b['level'];

            if ($b['type'] === 'power_plant') {
                $energyProd += ($cfg['produces']['energy'] ?? 0) * $lvl;
                $oilBurned  += ($cfg['consumes']['oil'] ?? 0) * $lvl;
                continue;
            }
            if ($b['type'] === 'housing') {
                $popCapBonus += ($cfg['pop_cap'] ?? 0) * $lvl;
                $energyDemand += ($cfg['needs_energy'] ?? 0) * $lvl;
                continue;
            }

            $energyDemand += ($cfg['needs_energy'] ?? 0) * $lvl;
            $scaleAttr = $cfg['scale'] ?? null;
            $factor = $scaleAttr ? max(0.1, ((float)($b[$scaleAttr] ?? 50)) / 50.0) : 1.0;

            foreach (($cfg['produces'] ?? []) as $res => $amt) {
                $gross[$res] += $amt * $factor * $lvl;
            }
            foreach (($cfg['consumes'] ?? []) as $res => $amt) {
                $gross[$res] -= $amt * $lvl;
            }
        }

        // Energy balance gates everything that draws power.
        $energyAvailable = $stock['energy'] + $energyProd;
        $efficiency = $energyDemand > 0 ? max(0.0, min(1.0, $energyAvailable / $energyDemand)) : 1.0;
        $energyLeft = max(0.0, $energyAvailable - $energyDemand);

        $foodProd = $gross['food'] * $efficiency;

        $new = $stock;
        $new['food']     = $stock['food']     + $foodProd                        - $foodCons;
        $new['minerals'] = $stock['minerals'] + $gross['minerals'] * $efficiency;
        $new['gold']     = $stock['gold']     + $gross['gold'] * $efficiency      + $popTax;
        $new['oil']      = $stock['oil']      + $gross['oil'] * $efficiency       - $oilBurned;
        $new['research'] = $stock['research'] + $gross['research'] * $efficiency;
        $new['energy']   = $energyLeft;

        return [
            'stock'      => $new,
            'pop_cap'    => $basePopCap + $popCapBonus,
            'food_prod'  => $foodProd,
            'food_cons'  => $foodCons,
            'efficiency' => $efficiency,
        ];
    }

    /**
     * Total per-tick army upkeep for a player (GAME_RULES §1, §5), summed over the
     * units of every stack they own (stationed or in transit). Pure computation.
     * @param array $armies rows from `armies` (only `units` is read)
     * @return array {gold, food, oil}
     */
    public static function upkeep(array $armies): array {
        $up = ['gold' => 0.0, 'food' => 0.0, 'oil' => 0.0];
        foreach ($armies as $army) {
            $units = Combat::units($army);
            foreach ($units as $type => $count) {
                $cfg = GameConfig::unit((string)$type);
                if (!$cfg) continue;
                foreach (($cfg['upkeep'] ?? []) as $res => $amt) {
                    $up[$res] = ($up[$res] ?? 0.0) + $amt * (int)$count;
                }
            }
        }
        return $up;
    }

    /**
     * A player is "grounded" (GAME_RULES §1) when they have no oil: armor/navy/air
     * can't move or strike, but still defend. Reads the live stockpile.
     */
    public static function isGrounded(DB $db, int $matchId, int $player): bool {
        $row = $db->selectOne(
            "SELECT `oil` FROM `match_players` WHERE `match_id` = ? AND `id` = ?",
            [$matchId, $player], 'ii'
        );
        return $row !== null && (float)$row['oil'] <= 0.0;
    }
}
