<?php
// Population dynamics: grow when fed and housed, shrink when starving.

final class Population {

    const FLOOR = 100_000; // a nation never fully disappears from hunger alone

    /**
     * @return array {pop:int, state:'growing'|'starving'|'stable'}
     */
    public static function step(float $pop, float $foodProd, float $foodCons, bool $foodRanOut, float $popCap): array {
        $starving = $foodRanOut && $foodProd < $foodCons;

        if ($starving) {
            $pop = max(self::FLOOR, $pop - $pop * GameConfig::POP_STARVE);
            return ['pop' => (int)round($pop), 'state' => 'starving'];
        }

        // Grow when production covers consumption and there's room.
        if ($foodProd >= $foodCons * 0.999 && $pop < $popCap) {
            $pop = min($popCap, $pop + $pop * GameConfig::POP_GROWTH);
            return ['pop' => (int)round($pop), 'state' => 'growing'];
        }

        return ['pop' => (int)round($pop), 'state' => 'stable'];
    }
}
