// Mock match state for the Match HUD mockup. Shapes follow db/schema.sql (match_players, territories,
// buildings, armies, diplomacy, trades, chat_messages) and numbers follow utils/engine/GameConfig.php.
window.HUD_DATA = (function () {
  const players = [
    { id: 1, me: true, name: 'Ulf Kristersson', title: 'Prime Minister', country: 'SWE', color: '#42d4f4', pop: 10.6e6, popCap: 12.86e6, ai: false,
      lands: ['SWE', 'NOR', 'FIN', 'DNK', 'EST', 'LVA', 'LTU'] },
    { id: 2, name: 'Kim Jong Un', title: 'Supreme Leader', country: 'PRK', color: '#e6194b', pop: 241e6, ai: true, diplo: 'war',
      lands: ['PRK', 'KOR', 'MNG', 'JPN', 'TWN', 'PHL', 'VNM', 'LAO', 'KHM', 'THA', 'MMR'] },
    { id: 3, name: 'Luiz Inácio Lula da Silva', title: 'President', country: 'BRA', color: '#3cb44b', pop: 287e6, ai: false, diplo: 'neutral',
      lands: ['BRA', 'URY', 'PRY', 'BOL', 'ARG', 'PER', 'GUY', 'SUR'] },
    { id: 4, name: 'Salman bin Abdulaziz', title: 'King', country: 'SAU', color: '#f58231', pop: 118e6, ai: true, diplo: 'truce',
      lands: ['SAU', 'YEM', 'OMN', 'ARE', 'QAT', 'KWT', 'JOR', 'IRQ', 'SYR'] },
    { id: 5, name: 'Emmanuel Macron', title: 'President', country: 'FRA', color: '#4363d8', pop: 104e6, ai: false, diplo: 'allied',
      lands: ['FRA', 'BEL', 'NLD', 'LUX', 'CHE', 'ESP'] },
  ];

  // Per-day deltas are what Economy::step would return for this board.
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
      alert: { kind: 'war', title: 'Invasion incoming', body: 'Kim Jong Un’s armor is marching on Finland', eta: 2 },
    },
    starving: {
      res: { food: 0, energy: 0, minerals: 1120, gold: 6840, oil: 0, research: 540 },
      delta: { food: -42, energy: -38, minerals: 92, gold: 241, oil: -18, research: 24 },
      efficiency: 0.54, fed: false,
      alert: { kind: 'food', title: 'Your people are starving', body: 'Population −1.5% per day until food returns', eta: null },
    },
  };

  // buildings in the selected country (SWE)
  const buildingsHere = [
    { type: 'farm', status: 'active' }, { type: 'farm', status: 'active' },
    { type: 'power_plant', status: 'active' }, { type: 'mine', status: 'active' },
    { type: 'mine', status: 'building', complete_at: 15, started: 12 },
    { type: 'lab', status: 'building', complete_at: 17, started: 13 },
  ];

  const UNITS = {
    infantry: { name: 'Infantry', icon: 'person-simple-run', cost: { gold: 40, minerals: 10 }, attack: 1, build_ticks: 2 },
    armor: { name: 'Armor', icon: 'truck', cost: { gold: 120, minerals: 60, oil: 20 }, attack: 3, build_ticks: 4 },
    air: { name: 'Air Force', icon: 'airplane-tilt', cost: { gold: 200, minerals: 80, oil: 40 }, attack: 5, build_ticks: 6 },
    navy: { name: 'Navy', icon: 'boat', cost: { gold: 260, minerals: 120, oil: 50 }, attack: 4, build_ticks: 7 },
  };
  const armiesHere = [{ type: 'infantry', count: 24 }, { type: 'armor', count: 6 }];
  const moveTargets = [
    { code: 'FIN', owner: 1, eta: 1 },
    { code: 'RUS', owner: null, eta: 2, garrison: 8 },
    { code: 'POL', owner: null, eta: 2, garrison: 8 },
    { code: 'DEU', owner: null, eta: 2, garrison: 8 },
  ];

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

  return { players, scenarios, buildingsHere, UNITS, armiesHere, moveTargets, trades, events, chat, TOTAL: 176, VICTORY: 0.6, TICK_SEC: 20, DAY: 14 };
})();
