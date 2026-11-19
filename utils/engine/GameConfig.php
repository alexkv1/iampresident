<?php
// All gameplay balance lives here so tuning never means touching logic.

final class GameConfig {

    // Resource keys tracked on match_players.
    const RESOURCES = ['food', 'energy', 'minerals', 'gold', 'oil', 'research'];

    // Starting stockpiles for every player.
    const START = [
        'food' => 800, 'energy' => 400, 'minerals' => 500,
        'gold' => 1500, 'oil' => 200, 'research' => 0,
    ];

    // Buildings a player's capital begins with (already active).
    const START_BUILDINGS = ['farm', 'farm', 'power_plant', 'mine'];

    // Population handling. pop is stored as real people; economy works per-million.
    // Tuned so ~5 farms feed the USA, 1 feeds Sweden, and nobody starves before
    // they can react. Balance lives here — adjust freely.
    const POP_SCALE      = 1e-6;   // persons -> "millions" multiplier
    const FOOD_PER_POP   = 2.0;    // food consumed per million people per tick
    const POP_TAX_GOLD   = 2.0;    // gold collected per million people per tick
    const POP_GROWTH     = 0.010;  // +1% per tick when fed and below cap
    const POP_STARVE     = 0.015;  // -1.5% per tick when starving
    const BASE_POP_CAP   = 1.25;   // capital base capacity = start_pop * this
    const FOOD_GRACE_TICKS = 12;   // starting food = this many ticks of consumption

    // Building catalogue. cost in resources, build_ticks to finish,
    // produces/consumes per level per tick, needs_energy = energy demand per level,
    // scale = country attribute that multiplies output (value/50), pop_cap = housing.
    const BUILDINGS = [
        'farm' => [
            'name' => 'Farm', 'icon' => '🌾',
            'cost' => ['gold' => 120, 'minerals' => 40], 'build_ticks' => 3,
            'produces' => ['food' => 100], 'scale' => 'farmland', 'needs_energy' => 12,
            'desc' => 'Feeds your population. Output scales with farmland.',
        ],
        'mine' => [
            'name' => 'Mine', 'icon' => '⛏️',
            'cost' => ['gold' => 150, 'minerals' => 30], 'build_ticks' => 3,
            'produces' => ['minerals' => 85], 'scale' => 'minerals', 'needs_energy' => 22,
            'desc' => 'Extracts ore. Output scales with mineral richness.',
        ],
        'oil_rig' => [
            'name' => 'Oil Rig', 'icon' => '🛢️',
            'cost' => ['gold' => 200, 'minerals' => 70], 'build_ticks' => 4,
            'produces' => ['oil' => 70], 'scale' => 'oil', 'needs_energy' => 18,
            'desc' => 'Pumps oil. Output scales with oil reserves.',
        ],
        'power_plant' => [
            'name' => 'Power Plant', 'icon' => '⚡',
            'cost' => ['gold' => 180, 'minerals' => 80], 'build_ticks' => 3,
            'produces' => ['energy' => 170], 'consumes' => ['oil' => 18], 'needs_energy' => 0,
            'desc' => 'Burns oil for energy. Energy powers everything else.',
        ],
        'factory' => [
            'name' => 'Factory', 'icon' => '🏭',
            'cost' => ['gold' => 260, 'minerals' => 120], 'build_ticks' => 5,
            'produces' => ['gold' => 80], 'consumes' => ['minerals' => 40], 'needs_energy' => 45,
            'desc' => 'Turns ore into wealth and, later, weapons.',
        ],
        'lab' => [
            'name' => 'Research Lab', 'icon' => '🔬',
            'cost' => ['gold' => 220, 'minerals' => 60], 'build_ticks' => 4,
            'produces' => ['research' => 45], 'needs_energy' => 32,
            'desc' => 'Generates research to advance technology.',
        ],
        'bank' => [
            'name' => 'Bank', 'icon' => '🏦',
            'cost' => ['gold' => 300], 'build_ticks' => 4,
            'produces' => ['gold' => 120], 'needs_energy' => 15,
            'desc' => 'Steady gold income for trade and upkeep.',
        ],
        'housing' => [
            'name' => 'Housing', 'icon' => '🏘️',
            'cost' => ['gold' => 160, 'minerals' => 50], 'build_ticks' => 3,
            'pop_cap' => 40_000_000, 'needs_energy' => 10,
            'desc' => 'Raises the population cap so your nation can grow.',
        ],
    ];

    // Unit catalogue (used by Combat / factory output later).
    const UNITS = [
        'infantry' => ['name' => 'Infantry', 'cost' => ['gold' => 40, 'minerals' => 10], 'attack' => 1,  'build_ticks' => 2],
        'armor'    => ['name' => 'Armor',    'cost' => ['gold' => 120, 'minerals' => 60, 'oil' => 20], 'attack' => 3, 'build_ticks' => 4],
        'air'      => ['name' => 'Air Force','cost' => ['gold' => 200, 'minerals' => 80, 'oil' => 40], 'attack' => 5, 'build_ticks' => 6],
        'navy'     => ['name' => 'Navy',     'cost' => ['gold' => 260, 'minerals' => 120, 'oil' => 50], 'attack' => 4, 'build_ticks' => 7],
    ];

    // Victory: control this share of the world's countries to win.
    const DOMINATION_SHARE = 0.60;

    // Distinct player colours assigned by slot.
    const COLORS = [
        '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4',
        '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9a6324',
    ];

    public static function building(string $type): ?array {
        return self::BUILDINGS[$type] ?? null;
    }
}
