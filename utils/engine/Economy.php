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
}
