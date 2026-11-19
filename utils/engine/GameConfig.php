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

    // Unit catalogue (GAME_RULES §1). speed km/day; upkeep/day; build_days; unlock tech.
    // navy/air have 0 land attack/defence (navy transports, air only strikes).
    const UNITS = [
        'infantry'  => ['name' => 'Infantry',  'attack' => 1, 'defence' => 2, 'speed' => 400, 'upkeep' => ['gold' => 1, 'food' => 1],            'cost' => ['gold' => 40,  'minerals' => 10],                 'build_days' => 2, 'unlock' => null,        'icon' => 'person-simple-run', 'land' => true],
        'artillery' => ['name' => 'Artillery', 'attack' => 2, 'defence' => 1, 'speed' => 300, 'upkeep' => ['gold' => 2, 'food' => 1],            'cost' => ['gold' => 150, 'minerals' => 80],                 'build_days' => 3, 'unlock' => 'artillery', 'icon' => 'crosshair-simple', 'land' => true],
        'armor'     => ['name' => 'Armor',     'attack' => 3, 'defence' => 2, 'speed' => 600, 'upkeep' => ['gold' => 3, 'food' => 1, 'oil' => 1], 'cost' => ['gold' => 120, 'minerals' => 60, 'oil' => 20],   'build_days' => 4, 'unlock' => null,        'icon' => 'truck', 'land' => true],
        'navy'      => ['name' => 'Navy',      'attack' => 0, 'defence' => 0, 'speed' => 900, 'upkeep' => ['gold' => 5, 'food' => 1, 'oil' => 2], 'cost' => ['gold' => 260, 'minerals' => 120, 'oil' => 50],  'build_days' => 7, 'unlock' => null,        'icon' => 'boat', 'land' => false, 'capacity' => 10],
        'air'       => ['name' => 'Air Force', 'attack' => 0, 'defence' => 0, 'speed' => 0,   'upkeep' => ['gold' => 6, 'oil' => 3],            'cost' => ['gold' => 200, 'minerals' => 80, 'oil' => 40],   'build_days' => 6, 'unlock' => 'air',       'icon' => 'airplane-tilt', 'land' => false],
    ];
    const LAND_UNITS = ['infantry', 'artillery', 'armor'];

    // Research tree (GAME_RULES §8). requires = tech keys; pay research+gold(+minerals) on start.
    const TECH = [
        'artillery' => ['name' => 'Artillery',             'requires' => [],           'research' => 300,  'gold' => 1500,  'days' => 4,  'unlocks' => 'Artillery unit and barrage'],
        'air'       => ['name' => 'Air Force',             'requires' => ['artillery'], 'research' => 600,  'gold' => 3000,  'days' => 6,  'unlocks' => 'Air Force unit and air strike'],
        'srbm'      => ['name' => 'Short-range missiles',  'requires' => ['artillery'], 'research' => 800,  'gold' => 5000,  'days' => 8,  'unlocks' => 'SRBM (1 000 km)'],
        'mrbm'      => ['name' => 'Medium-range missiles', 'requires' => ['srbm'],      'research' => 1500, 'gold' => 10000, 'days' => 12, 'unlocks' => 'MRBM (5 500 km)'],
        'icbm'      => ['name' => 'ICBM',                   'requires' => ['mrbm'],      'research' => 3000, 'gold' => 25000, 'days' => 18, 'unlocks' => 'ICBM (global)'],
        'nuclear'   => ['name' => 'Nuclear weapons',       'requires' => ['icbm'],      'research' => 6000, 'gold' => 60000, 'minerals' => 8000, 'labs' => 5, 'days' => 25, 'unlocks' => 'Warheads'],
    ];

    // Buildable missiles/warheads stocked in the arsenal (GAME_RULES §1a build days, §9 cost).
    const ARSENAL = [
        'srbm'    => ['name' => 'Short-range missile',  'cost' => ['gold' => 800],                      'days' => 3,  'tech' => 'srbm',    'icon' => 'rocket'],
        'mrbm'    => ['name' => 'Medium-range missile', 'cost' => ['gold' => 1500],                     'days' => 5,  'tech' => 'mrbm',    'icon' => 'rocket'],
        'icbm'    => ['name' => 'ICBM',                 'cost' => ['gold' => 4000],                     'days' => 8,  'tech' => 'icbm',    'icon' => 'rocket-launch'],
        'warhead' => ['name' => 'Nuclear warhead',      'cost' => ['gold' => 15000, 'minerals' => 2000], 'days' => 10, 'tech' => 'nuclear', 'icon' => 'radioactive', 'max_in_production' => 1],
    ];

    // Strikes (GAME_RULES §9). def = defence reduction; range km, 'border' or 'global'.
    const STRIKES = [
        'artillery' => ['name' => 'Artillery barrage', 'range' => 'border', 'def' => -2,  'per' => 'gun',  'cost' => ['minerals' => 1], 'cooldown' => 1, 'needs_unit' => 'artillery'],
        'air'       => ['name' => 'Air strike',        'range' => 1500,     'def' => -3,  'per' => 'plane','cost' => ['oil' => 2],      'cooldown' => 1, 'needs_unit' => 'air', 'plane_loss' => 0.05, 'plane_loss_garrison' => 20],
        'srbm'      => ['name' => 'SRBM strike',       'range' => 1000,     'def' => -12, 'item' => 'srbm',    'cooldown' => 0],
        'mrbm'      => ['name' => 'MRBM strike',       'range' => 5500,     'def' => -18, 'item' => 'mrbm',    'cooldown' => 0],
        'icbm'      => ['name' => 'ICBM strike',       'range' => 'global', 'def' => -25, 'item' => 'icbm',    'cooldown' => 0],
        'nuclear'   => ['name' => 'Nuclear strike',    'range' => 'global', 'item' => 'warhead', 'cooldown' => 0],
    ];

    // --- Time / movement / combat (GAME_RULES §2, §3) ---
    const TICK_SECONDS = 20;
    const ROAD_FACTOR  = 1.2;
    const SEA_FACTOR   = 1.3;
    const SEA_SPEED    = 900;
    const NAVY_CAPACITY = 10;
    const KM_PER_DEG   = 111.2;
    const DEFENDER_BONUS = 1.5;
    const AMPHIB_MULT  = 0.75;
    const TERRAIN_MULT = ['plains' => 1.0, 'forest' => 1.2, 'mountains' => 1.5];
    const RNG_LO = 0.85;
    const RNG_HI = 1.15;

    // --- War economy (GAME_RULES §1, §5) ---
    const DESERTION       = 0.05;     // of each stack/day when gold or food short
    const MANPOWER_RATE   = 0.01;     // 1% of population; limit = floor(pop*0.01/1000)
    const MANPOWER_UNIT   = 1000;     // 1 unit ~ 1000 personnel
    const TRAIN_BATCH     = 5;
    const START_SCALE_GDP = 500000;   // s = clamp(sqrt(gdp_md/this), MIN, MAX)
    const START_SCALE_MIN = 0.6;
    const START_SCALE_MAX = 3.0;

    // --- Garrisons / occupation / diplomacy (GAME_RULES §4, §6, §7) ---
    const GARRISON_MIN = 3;
    const GARRISON_MAX = 60;
    const MILITIA_FRACTION = 0.5;     // owned militia = this * neutral garrison
    const DAMAGE_RECOVER = 0.10;      // garrison damage recovers this * base/day
    const OCCUPATION_DAYS = 10;
    const UNREST_NO_STACK = 8;
    const UNREST_STRONG   = -10;      // stack >= half base garrison
    const UNREST_WEAK     = 2;
    const REVOLT_AT       = 100;
    const TRUCE_DAYS      = 10;
    const PROPOSAL_EXPIRE = 3;        // proposals expire this many ticks after creation

    // --- Victory / nuke (GAME_RULES §5, §9) ---
    const VICTORY_WEIGHTS = ['pop' => 0.4, 'area' => 0.3, 'gdp' => 0.3];
    const NUKE_POP_KILL   = 0.40;
    const NUKE_RUINED_DAYS = 20;

    // Victory: 60% of weighted world score (land count is secondary info).
    const DOMINATION_SHARE = 0.60;

    // Distinct player colours assigned by slot.
    const COLORS = [
        '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4',
        '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9a6324',
    ];

    public static function building(string $type): ?array {
        return self::BUILDINGS[$type] ?? null;
    }

    public static function unit(string $type): ?array {
        return self::UNITS[$type] ?? null;
    }

    public static function isLandUnit(string $type): bool {
        return in_array($type, self::LAND_UNITS, true);
    }

    // Neutral garrison (GAME_RULES §4): clamp(round(2 + 2·√popM + land_slots/4), 3, 60).
    public static function neutralGarrison(float $popMillions, int $landSlots): int {
        return (int) max(self::GARRISON_MIN, min(self::GARRISON_MAX,
            round(2 + 2 * sqrt(max(0.0, $popMillions)) + $landSlots / 4)));
    }

    // Owned militia = half the neutral garrison; occupied countries use 0 (handled by caller).
    public static function militia(float $popMillions, int $landSlots): int {
        return (int) round(self::neutralGarrison($popMillions, $landSlots) * self::MILITIA_FRACTION);
    }

    // Starting scale from GDP (GAME_RULES §5): clamp(√(gdp_md/500000), 0.6, 3.0).
    public static function startScale(float $gdpMd): float {
        return max(self::START_SCALE_MIN, min(self::START_SCALE_MAX, sqrt(max(0.0, $gdpMd) / self::START_SCALE_GDP)));
    }

    // Manpower limit (GAME_RULES §1): floor(population × 0.01 / 1000).
    public static function manpowerLimit(float $pop): int {
        return (int) floor($pop * self::MANPOWER_RATE / self::MANPOWER_UNIT);
    }

    // Terrain combat multiplier (GAME_RULES §3).
    public static function terrainMult(string $terrain): float {
        return self::TERRAIN_MULT[$terrain] ?? 1.0;
    }
}
