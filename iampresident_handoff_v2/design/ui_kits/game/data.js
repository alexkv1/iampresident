// Mock data for the game UI kit. Values copied from the source repo:
// leaders → db/seeds/leaders.sql · buildings/start/colours → utils/engine/GameConfig.php
window.IAP_DATA = (function () {
  const LEADERS = {
    USA: ['Donald Trump', 'President'], RUS: ['Vladimir Putin', 'President'], CHN: ['Xi Jinping', 'President'],
    PRK: ['Kim Jong Un', 'Supreme Leader'], KOR: ['Lee Jae-myung', 'President'], GBR: ['Keir Starmer', 'Prime Minister'],
    DEU: ['Friedrich Merz', 'Chancellor'], FRA: ['Emmanuel Macron', 'President'], IND: ['Narendra Modi', 'Prime Minister'],
    JPN: ['Sanae Takaichi', 'Prime Minister'], CAN: ['Mark Carney', 'Prime Minister'], BRA: ['Luiz Inácio Lula da Silva', 'President'],
    SAU: ['Salman bin Abdulaziz', 'King'], MEX: ['Claudia Sheinbaum', 'President'], AUS: ['Anthony Albanese', 'Prime Minister'],
    ITA: ['Giorgia Meloni', 'Prime Minister'], ESP: ['Pedro Sánchez', 'Prime Minister'], IDN: ['Prabowo Subianto', 'President'],
    TUR: ['Recep Tayyip Erdoğan', 'President'], EGY: ['Abdel Fattah el-Sisi', 'President'], NGA: ['Bola Tinubu', 'President'],
    ZAF: ['Cyril Ramaphosa', 'President'], ARG: ['Javier Milei', 'President'], UKR: ['Volodymyr Zelensky', 'President'],
    POL: ['Karol Nawrocki', 'President'], NLD: ['Dick Schoof', 'Prime Minister'], SWE: ['Ulf Kristersson', 'Prime Minister'],
    NOR: ['Jonas Gahr Støre', 'Prime Minister'], FIN: ['Petteri Orpo', 'Prime Minister'], DNK: ['Mette Frederiksen', 'Prime Minister'],
    IRN: ['Ali Khamenei', 'Supreme Leader'], IRQ: ['Mohammed Shia al-Sudani', 'Prime Minister'], ISR: ['Benjamin Netanyahu', 'Prime Minister'],
    PAK: ['Shehbaz Sharif', 'Prime Minister'], VNM: ['Tô Lâm', 'General Secretary'], THA: ['Anutin Charnvirakul', 'Prime Minister'],
    PHL: ['Ferdinand Marcos Jr.', 'President'], MYS: ['Anwar Ibrahim', 'Prime Minister'], NZL: ['Christopher Luxon', 'Prime Minister'],
    GRC: ['Kyriakos Mitsotakis', 'Prime Minister'], HUN: ['Viktor Orbán', 'Prime Minister'], COL: ['Gustavo Petro', 'President'],
    CHL: ['Gabriel Boric', 'President'], VEN: ['Nicolás Maduro', 'President'], ETH: ['Abiy Ahmed', 'Prime Minister'],
    KEN: ['William Ruto', 'President'], MAR: ['Mohammed VI', 'King'], DZA: ['Abdelmadjid Tebboune', 'President'],
    KAZ: ['Kassym-Jomart Tokayev', 'President'], UZB: ['Shavkat Mirziyoyev', 'President'], SYR: ['Ahmed al-Sharaa', 'President'],
    QAT: ['Tamim bin Hamad Al Thani', 'Emir'], ARE: ['Mohamed bin Zayed Al Nahyan', 'President'], JOR: ['Abdullah II', 'King'],
    CUB: ['Miguel Díaz-Canel', 'President'],
  };
  function persona(code, countryName) {
    const l = LEADERS[code];
    return l ? { name: l[0], title: l[1] } : { name: 'President of ' + countryName, title: '' };
  }
  function leaderOf(code, countryName) {
    const l = LEADERS[code];
    return l ? l[1] + ' ' + l[0] : 'President of ' + countryName;
  }

  // GameConfig::BUILDINGS (icon → Phosphor Fill name, tone → tile colour)
  const BUILDINGS = {
    farm: { name: 'Farm', icon: 'grains', tone: 'var(--res-food)', cost: { gold: 120, minerals: 40 }, build_ticks: 3, produces: { food: 100 }, scale: 'farmland', needs_energy: 12, desc: 'Feeds your population. Output scales with farmland.' },
    mine: { name: 'Mine', icon: 'hammer', tone: 'var(--navy-400)', cost: { gold: 150, minerals: 30 }, build_ticks: 3, produces: { minerals: 85 }, scale: 'minerals', needs_energy: 22, desc: 'Extracts ore. Output scales with mineral richness.' },
    oil_rig: { name: 'Oil Rig', icon: 'gas-pump', tone: 'var(--res-oil)', cost: { gold: 200, minerals: 70 }, build_ticks: 4, produces: { oil: 70 }, scale: 'oil', needs_energy: 18, desc: 'Pumps oil. Output scales with oil reserves.' },
    power_plant: { name: 'Power Plant', icon: 'lightning', tone: 'var(--gold-600)', cost: { gold: 180, minerals: 80 }, build_ticks: 3, produces: { energy: 170 }, consumes: { oil: 18 }, needs_energy: 0, desc: 'Burns oil for energy. Energy powers everything else.' },
    factory: { name: 'Factory', icon: 'factory', tone: 'var(--red-600)', cost: { gold: 260, minerals: 120 }, build_ticks: 5, produces: { gold: 80 }, consumes: { minerals: 40 }, needs_energy: 45, desc: 'Turns ore into wealth and, later, weapons.' },
    lab: { name: 'Research Lab', icon: 'flask', tone: 'var(--teal-600)', cost: { gold: 220, minerals: 60 }, build_ticks: 4, produces: { research: 45 }, needs_energy: 32, desc: 'Generates research to advance technology.' },
    bank: { name: 'Bank', icon: 'bank', tone: 'var(--sky-500)', cost: { gold: 300 }, build_ticks: 4, produces: { gold: 120 }, needs_energy: 15, desc: 'Steady gold income for trade and upkeep.' },
    housing: { name: 'Housing', icon: 'house-line', tone: 'var(--green-600)', cost: { gold: 160, minerals: 50 }, build_ticks: 3, produces: {}, needs_energy: 10, desc: 'Raises the population cap so your nation can grow.' },
  };

  const START = { food: 800, energy: 400, minerals: 500, gold: 1500, oil: 200, research: 0 };
  const START_BUILDINGS = ['farm', 'farm', 'power_plant', 'mine'];
  const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9a6324'];
  const RES = ['food', 'energy', 'minerals', 'gold', 'oil', 'research'];

  const OPEN_MATCHES = [
    { id: 4821, name: 'World Stage', players: 3, max_players: 8, tick_interval_sec: 20 },
    { id: 4819, name: 'Cold War Rematch', players: 6, max_players: 8, tick_interval_sec: 20 },
    { id: 4815, name: 'Oil & Bread', players: 1, max_players: 4, tick_interval_sec: 10 },
  ];

  // Lobby opponents per mode. Online/private = humans; single = 3 AI (GameConfig: single → 4 max, 3 AI).
  const OPPONENTS = {
    online: [
      { name: 'marianne_77', country: 'FRA', ready: true },
      { name: 'nordwind', country: 'NOR', ready: false },
    ],
    private: [
      { name: 'oskar', country: null, ready: false },
    ],
    single: [
      { name: 'AI 1', country: 'SAU', ai: true },
      { name: 'AI 2', country: 'PRK', ai: true },
      { name: 'AI 3', country: 'BRA', ai: true },
    ],
  };

  return { LEADERS, persona, leaderOf, BUILDINGS, START, START_BUILDINGS, COLORS, RES, OPEN_MATCHES, OPPONENTS, GEO_URL: '../../assets/data/countries.geo.json' };
})();
