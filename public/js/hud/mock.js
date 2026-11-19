// Mock match state for the live-game HUD in prototype (?mock=1) mode. Ported verbatim from the
// design mockup's hud/hudData.js + the BUILDINGS catalogue from ui_kits/game/data.js, so /game?mock=1
// reproduces match-hud.html exactly (scenario=attack, mode=build, selected=SWE — the mockup ignores
// the ?scenario=/?mode= query params, so every reference frame is this one fixed state).
window.HUD_DATA = (function () {
  const players = [
    { id: 1, me: true, name: 'Ulf Kristersson', title: 'Prime Minister', country: 'SWE', color: '#42d4f4', pop: 10.6e6, popCap: 12.86e6, ai: false,
      lands: ['SWE', 'NOR', 'FIN', 'DNK', 'EST', 'LVA', 'LTU'] },
    { id: 2, name: 'Kim Jong Un', title: 'Supreme Leader', country: 'PRK', color: '#e6194b', pop: 241e6, ai: true, diplo: 'war',
      lands: ['PRK', 'KOR', 'MNG', 'JPN', 'RUS', 'PHL', 'VNM', 'LAO', 'KHM', 'THA', 'MMR'] },
    { id: 3, name: 'Luiz Inácio Lula da Silva', title: 'President', country: 'BRA', color: '#3cb44b', pop: 287e6, ai: false, diplo: 'neutral',
      lands: ['BRA', 'URY', 'PRY', 'BOL', 'ARG', 'PER', 'GUY', 'SUR'] },
    { id: 4, name: 'Salman bin Abdulaziz', title: 'King', country: 'SAU', color: '#f58231', pop: 118e6, ai: true, diplo: 'truce',
      lands: ['SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'KWT', 'JOR', 'IRQ', 'SYR'] },
    { id: 5, name: 'Emmanuel Macron', title: 'President', country: 'FRA', color: '#4363d8', pop: 104e6, ai: false, diplo: 'allied',
      lands: ['FRA', 'BEL', 'NLD', 'LUX', 'CHE', 'ESP'] },
  ];

  const scenarios = {
    calm: {
      res: { food: 2410, energy: 318, minerals: 1120, gold: 6840, oil: 96, research: 540 },
      delta: { food: 86, energy: -12, minerals: 170, gold: 312, oil: -18, research: 45 },
      efficiency: 1, fed: true, alert: null,
    },
    attack: {
      res: { food: 2410, energy: 318, minerals: 1120, gold: 6840, oil: 96, research: 540 },
      delta: { food: 86, energy: -12, minerals: 170, gold: 312, oil: -18, research: 45 },
      efficiency: 1, fed: true,
      alert: null, // derived live from hostile armies marching on your land
    },
    starving: {
      res: { food: 0, energy: 0, minerals: 1120, gold: 6840, oil: 0, research: 540 },
      delta: { food: -42, energy: -38, minerals: 92, gold: 241, oil: -18, research: 24 },
      efficiency: 0.54, fed: false,
      alert: { kind: 'food', title: 'Your people are starving', body: 'Population −1.5% per day until food returns', eta: null },
    },
  };

  const buildingsHere = [
    { type: 'farm', status: 'active' }, { type: 'farm', status: 'active' },
    { type: 'power_plant', status: 'active' }, { type: 'mine', status: 'active' },
    { type: 'mine', status: 'building', complete_at: 15, started: 12 },
    { type: 'lab', status: 'building', complete_at: 17, started: 13 },
  ];

  const UNITS = {
    infantry: { name: 'Infantry', icon: 'person-simple-run', cost: { gold: 40, minerals: 10 }, attack: 1, defence: 2, speed: 400, upkeep: { gold: 1, food: 1 }, build_ticks: 2 },
    armor: { name: 'Armor', icon: 'truck', cost: { gold: 120, minerals: 60, oil: 20 }, attack: 3, defence: 2, speed: 600, upkeep: { gold: 3, food: 1, oil: 1 }, build_ticks: 4 },
    air: { name: 'Air Force', icon: 'airplane-tilt', cost: { gold: 200, minerals: 80, oil: 40 }, attack: 0, defence: 0, strike: 3, speed: 0, upkeep: { gold: 6, oil: 3 }, build_ticks: 6 },
    navy: { name: 'Navy', icon: 'boat', cost: { gold: 260, minerals: 120, oil: 50 }, attack: 0, defence: 0, capacity: 10, speed: 900, upkeep: { gold: 5, food: 1, oil: 2 }, build_ticks: 7 },
    artillery: { name: 'Artillery', icon: 'target', cost: { gold: 150, minerals: 80 }, attack: 2, defence: 1, speed: 300, upkeep: { gold: 2, food: 1 }, build_ticks: 3, tech: 'artillery' },
  };
  UNITS.air.tech = 'air';

  const TECH = [
    { key: 'artillery', name: 'Artillery', icon: 'target', cost: { research: 300, gold: 1500 }, days: 4, status: 'done',
      unlocks: 'Artillery unit. Shell any country that borders a stack with guns.' },
    { key: 'air', name: 'Air Force', icon: 'airplane-tilt', cost: { research: 600, gold: 3000 }, days: 6, requires: ['artillery'], status: 'active', progress: 0.62,
      unlocks: 'Air Force unit. Strike anything within 1 500 km of a stack with planes.' },
    { key: 'srbm', name: 'Short-range missiles', icon: 'rocket', cost: { research: 800, gold: 5000 }, days: 8, requires: ['artillery'], status: 'locked',
      unlocks: 'Build missiles (800 gold) that hit up to 1 000 km from your capital.' },
    { key: 'mrbm', name: 'Medium-range missiles', icon: 'rocket', cost: { research: 1500, gold: 10000 }, days: 12, requires: ['srbm'], status: 'locked',
      unlocks: 'Missiles (1 500 gold) with 5 500 km range.' },
    { key: 'icbm', name: 'ICBM', icon: 'rocket-launch', cost: { research: 3000, gold: 25000 }, days: 18, requires: ['mrbm'], status: 'locked',
      unlocks: 'Intercontinental missiles (4 000 gold). Reach any country on Earth.' },
    { key: 'nukes', name: 'Nuclear weapons', icon: 'radioactive', cost: { research: 6000, gold: 60000, minerals: 8000 }, days: 25, requires: ['icbm'], labs: 5, status: 'locked', danger: true,
      unlocks: 'Warheads (15 000 gold, 10 days each). Destroys everything in a country, kills 40% of its people and ruins its farmland for 20 days. Every nation may declare war on you, and nuclear powers retaliate at once.' },
  ];

  const STRIKES = {
    artillery: { tech: 'artillery', perUnit: 2 },
    air: { tech: 'air', perUnit: 3, rangeKm: 1500 },
    srbm: { tech: 'srbm', damage: 12, rangeKm: 1000, name: 'Short-range missile' },
    mrbm: { tech: 'mrbm', damage: 18, rangeKm: 5500, name: 'Medium-range missile' },
    icbm: { tech: 'icbm', damage: 25, rangeKm: 40000, name: 'ICBM' },
    nuke: { tech: 'nukes' },
  };
  const ARSENAL = { srbm: 0, mrbm: 0, icbm: 0, warhead: 0 };
  const ACCESS = { 5: true };
  const TRUCE_UNTIL = { 4: 20 };
  const UNITS_TIPS = {
    infantry: 'Cheap foot soldiers. Train lots of them to hold your borders.',
    armor: 'Tanks hit three times harder than infantry but burn oil to build.',
    air: 'The strongest attackers. Expensive, and they need plenty of oil.',
    navy: 'Warships for reaching lands across the sea.',
    artillery: 'Big guns. Shell countries next to the stack, or join an invasion with attack 2.',
  };
  const armies = [
    { id: 'a1', owner: 1, at: 'SWE', units: { infantry: 24, armor: 6, navy: 3 } },
    { id: 'a2', owner: 1, at: 'FIN', units: { infantry: 8, artillery: 4 } },
    { id: 'a3', owner: 1, at: 'DNK', units: { infantry: 6, armor: 2 } },
    { id: 'a4', owner: 1, at: 'LVA', units: { infantry: 10, armor: 1 } },
    { id: 'f1', owner: 5, at: 'FRA', units: { infantry: 20, armor: 4, air: 2 } },
    { id: 'f2', owner: 5, at: 'BEL', units: { infantry: 6 } },
    { id: 'k1', owner: 2, at: 'RUS', units: { infantry: 18, armor: 8 } },
    { id: 'k2', owner: 2, at: 'KOR', units: { infantry: 30, armor: 14, air: 4 } },
    { id: 'k3', owner: 2, at: 'MNG', units: { infantry: 12 } },
    { id: 's1', owner: 4, at: 'SAU', units: { infantry: 22, armor: 10 } },
    { id: 'b1', owner: 3, at: 'BRA', units: { infantry: 26, armor: 5 } },
  ];
  const incoming = [{ id: 'k9', owner: 2, from: 'RUS', to: 'FIN', units: { armor: 9 }, days: 3 }];

  const trades = [
    { id: 1, dir: 'in', from: 5, give: { food: 400 }, receive: { minerals: 250 } },
    { id: 2, dir: 'in', from: 3, give: { oil: 150 }, receive: { gold: 600 } },
    { id: 3, dir: 'out', to: 4, give: { minerals: 300 }, receive: { oil: 200 }, status: 'pending' },
  ];

  const events = [
    { id: 9, type: 'war', actor: 'Kim Jong Un', text: 'declared war on you', day: 13 },
    { id: 8, type: 'battle_repelled', actor: 'Latvia', text: 'held against Kim Jong Un', day: 12 },
    { id: 7, type: 'conquest', actor: 'Kim Jong Un', text: 'conquered Thailand', day: 12 },
    { id: 6, type: 'alliance', actor: 'Emmanuel Macron', text: 'is now your ally', day: 10 },
    { id: 5, type: 'build_complete', actor: 'You', text: 'completed a farm in Sweden', day: 9 },
    { id: 4, type: 'conquest', actor: 'Luiz Inácio Lula da Silva', text: 'conquered Argentina', day: 8 },
  ];
  const chat = [
    { id: 1, scope: 'all', pid: 5, body: 'Kim is coming for the Baltics. I can send air support.' },
    { id: 2, scope: 'all', pid: 3, body: 'Selling oil. DM offers.' },
    { id: 3, scope: 'team', pid: 5, body: 'Accept my food deal and I’ll move 12 infantry to Denmark.' },
    { id: 4, scope: 'all', pid: 2, body: 'The peninsula was only the beginning.' },
  ];

  return { players, scenarios, buildingsHere, UNITS, TECH, STRIKES, ARSENAL, ACCESS, TRUCE_UNTIL, UNITS_TIPS, armies, incoming, trades, events, chat, TOTAL: 176, VICTORY: 0.6, TICK_SEC: 20, DAY: 14 };
})();

// GameConfig::BUILDINGS (icon → Phosphor Fill name, tone → tile colour). Ported from ui_kits/game/data.js.
window.IAP_DATA = {
  GEO_URL: '/assets/countries.geo.json',
  BUILDINGS: {
    farm: { name: 'Farm', icon: 'grains', tone: 'var(--res-food)', cost: { gold: 120, minerals: 40 }, build_ticks: 3, produces: { food: 100 }, scale: 'farmland', needs_energy: 12, desc: 'Feeds your population. Output scales with farmland.' },
    mine: { name: 'Mine', icon: 'hammer', tone: 'var(--navy-400)', cost: { gold: 150, minerals: 30 }, build_ticks: 3, produces: { minerals: 85 }, scale: 'minerals', needs_energy: 22, desc: 'Extracts ore. Output scales with mineral richness.' },
    oil_rig: { name: 'Oil Rig', icon: 'gas-pump', tone: 'var(--res-oil)', cost: { gold: 200, minerals: 70 }, build_ticks: 4, produces: { oil: 70 }, scale: 'oil', needs_energy: 18, desc: 'Pumps oil. Output scales with oil reserves.' },
    power_plant: { name: 'Power Plant', icon: 'lightning', tone: 'var(--gold-600)', cost: { gold: 180, minerals: 80 }, build_ticks: 3, produces: { energy: 170 }, consumes: { oil: 18 }, needs_energy: 0, desc: 'Burns oil for energy. Energy powers everything else.' },
    factory: { name: 'Factory', icon: 'factory', tone: 'var(--red-600)', cost: { gold: 260, minerals: 120 }, build_ticks: 5, produces: { gold: 80 }, consumes: { minerals: 40 }, needs_energy: 45, desc: 'Turns ore into wealth and, later, weapons.' },
    lab: { name: 'Research Lab', icon: 'flask', tone: 'var(--teal-600)', cost: { gold: 220, minerals: 60 }, build_ticks: 4, produces: { research: 45 }, needs_energy: 32, desc: 'Generates research to advance technology.' },
    bank: { name: 'Bank', icon: 'bank', tone: 'var(--sky-500)', cost: { gold: 300 }, build_ticks: 4, produces: { gold: 120 }, needs_energy: 15, desc: 'Steady gold income for trade and upkeep.' },
    housing: { name: 'Housing', icon: 'house-line', tone: 'var(--green-600)', cost: { gold: 160, minerals: 50 }, build_ticks: 3, produces: {}, needs_energy: 10, desc: 'Raises the population cap so your nation can grow.' },
  },
};
