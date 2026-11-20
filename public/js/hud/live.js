// Live backend bridge for the Match HUD. Maps GET /api/match/get (+ the action endpoints)
// into the HUD_DATA / IAP_DATA shapes hud.js renders, polls every 3s (plus the WebSocket
// refresh game.js used), and routes HUD actions to the real API. Loaded only in the live
// (non-mock) game page; mock.js is loaded instead for ?mock=1.
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

// Static unit/tech/strike definitions mirror GameConfig (icons/tones are the HUD's own).
window.HUD_UNITS = {
  infantry: { name: 'Infantry', icon: 'person-simple-run', cost: { gold: 40, minerals: 10 }, attack: 1, defence: 2, speed: 400, upkeep: { gold: 1, food: 1 }, build_ticks: 2 },
  armor: { name: 'Armor', icon: 'truck', cost: { gold: 120, minerals: 60, oil: 20 }, attack: 3, defence: 2, speed: 600, upkeep: { gold: 3, food: 1, oil: 1 }, build_ticks: 4 },
  air: { name: 'Air Force', icon: 'airplane-tilt', cost: { gold: 200, minerals: 80, oil: 40 }, attack: 0, defence: 0, strike: 3, speed: 0, upkeep: { gold: 6, oil: 3 }, build_ticks: 6, tech: 'air' },
  navy: { name: 'Navy', icon: 'boat', cost: { gold: 260, minerals: 120, oil: 50 }, attack: 0, defence: 0, capacity: 10, speed: 900, upkeep: { gold: 5, food: 1, oil: 2 }, build_ticks: 7 },
  artillery: { name: 'Artillery', icon: 'target', cost: { gold: 150, minerals: 80 }, attack: 2, defence: 1, speed: 300, upkeep: { gold: 2, food: 1 }, build_ticks: 3, tech: 'artillery' },
};
window.HUD_UNITS_TIPS = {
  infantry: 'Cheap foot soldiers. Train lots of them to hold your borders.',
  armor: 'Tanks hit three times harder than infantry but burn oil to build.',
  air: 'The strongest attackers. Expensive, and they need plenty of oil.',
  navy: 'Warships for reaching lands across the sea.',
  artillery: 'Big guns. Shell countries next to the stack, or join an invasion with attack 2.',
};

(function () {
  const matchId = window.MATCH_ID;
  const RES = ['food', 'energy', 'minerals', 'gold', 'oil', 'research'];
  const api = {
    get: (since) => $.ajax({ url: '/api/match/get', method: 'GET', data: { match_id: matchId, since_event: since || 0 } }),
    plan: (target) => $.ajax({ url: '/api/army/plan', method: 'GET', data: { match_id: matchId, target } }),
    move: (army_id, target, kind) => $.ajax({ url: '/api/army/move', method: 'POST', data: { army_id, target, kind: kind || 'land' } }),
    train: (country_code, type, count) => $.ajax({ url: '/api/army/train', method: 'POST', data: { match_id: matchId, country_code, type, count: count || 1 } }),
    build: (country_code, type) => $.ajax({ url: '/api/build/queue', method: 'POST', data: { match_id: matchId, country_code, type } }),
    strike: (p) => $.ajax({ url: '/api/strike', method: 'POST', data: Object.assign({ match_id: matchId }, p) }),
    research: (key) => $.ajax({ url: '/api/research/start', method: 'POST', data: { match_id: matchId, key } }),
    arsenal: (item) => $.ajax({ url: '/api/arsenal/build', method: 'POST', data: { match_id: matchId, item } }),
    propose: (player, type) => $.ajax({ url: '/api/diplomacy/propose', method: 'POST', data: { match_id: matchId, player, type } }),
    respond: (id, accept) => $.ajax({ url: '/api/diplomacy/respond', method: 'POST', data: { match_id: matchId, id, accept: accept ? 1 : 0 } }),
    declareWar: (player) => $.ajax({ url: '/api/diplomacy/declare-war', method: 'POST', data: { match_id: matchId, player } }),
    chatSend: (body, scope) => $.ajax({ url: '/api/chat/send', method: 'POST', data: { match_id: matchId, body, scope: scope || 'all' } }),
    chatList: (since) => $.ajax({ url: '/api/chat/list', method: 'GET', data: { match_id: matchId, since_id: since || 0 } }),
  };

  const DIPLO_STATE = (rel) => {
    if (!rel) return 'neutral';
    if (rel.state === 'allied') return 'allied';
    if (rel.state === 'war') return 'war';
    if (rel.truce_until != null) return 'truce';
    return 'neutral';
  };
  const EVENT_TEXT = {}; // event rendering handled by hud.js feed component; we pass type/actor/text/day

  // Build HUD_DATA from a /api/match/get snapshot.
  const mapChat = (rows) => (rows || []).map((m) => ({ id: m.id, pid: m.player, scope: m.scope, body: m.body }));
  function mapSnapshot(r, feats, chat) {
    const myId = r.me.player_id;
    const landsOf = {}; (r.territories || []).forEach((t) => { (landsOf[t.owner] = landsOf[t.owner] || []).push(t.country_code); });
    const relByPlayer = {}; (r.diplomacy || []).forEach((d) => { relByPlayer[d.player] = d; });
    const players = (r.players || []).map((p) => ({
      id: p.id, me: p.id === myId, name: p.display_name, title: p.leader_title || '', country: p.country_code,
      color: p.color, pop: p.pop, popCap: Math.round(p.pop * 1.2), ai: !!p.is_ai,
      diplo: p.id === myId ? undefined : DIPLO_STATE(relByPlayer[p.id]),
      lands: landsOf[p.id] || [], share: p.share,
    }));
    const meP = players.find((p) => p.me);
    // live resources + net delta (gross building delta minus upkeep is not returned per-resource
    // here; show stocks and the upkeep-adjusted sign using available data).
    const meRow = (r.players || []).find((p) => p.id === myId) || {};
    const res = {}; RES.forEach((k) => { res[k] = meRow[k] != null ? meRow[k] : 0; });
    const delta = {}; RES.forEach((k) => { delta[k] = 0; });
    const upk = r.me.upkeep || {};
    delta.gold -= upk.gold || 0; delta.food -= upk.food || 0; delta.oil -= upk.oil || 0;
    const fed = res.food > 0;
    const scenario = { res, delta, efficiency: 1, fed, alert: null };

    const armies = (r.armies || []).map((a) => {
      const base = { id: 'srv' + a.id, srvId: a.id, owner: a.player, units: a.units || {}, at: a.country_code };
      if (a.moving_to) { base.route = null; base.from = a.origin || a.country_code; base.to = a.moving_to; base.codes = a.path || [a.origin || a.country_code, a.moving_to]; base.kind = a.kind || 'land'; base.arriveDay = a.arrive_at_tick; base.departTick = a.depart_tick; }
      return base;
    });

    const TECH_META = window.HUD_DATA_TECH_META;
    const techLevels = r.me.tech || {};
    const tech = TECH_META.map((t) => Object.assign({}, t, { status: techLevels[t.key] ? 'done' : 'locked', startDay: r.match.current_tick }));

    const defence = r.defence || {};
    const vision = r.vision || [];
    const buildings = (r.buildings || []).map((b) => ({ type: b.type, status: b.status === 'active' ? 'active' : 'building', country: b.country_code, complete_at: b.complete_at_tick, started: r.match.current_tick }));

    return {
      players, scenarios: { live: scenario }, buildingsHere: buildings,
      UNITS: window.HUD_UNITS, UNITS_TIPS: window.HUD_UNITS_TIPS,
      TECH: tech, STRIKES: window.HUD_DATA_STRIKES, ARSENAL: r.me.arsenal || {}, ACCESS: {}, TRUCE_UNTIL: {},
      armies, incoming: [], trades: [], events: (r.events || []), chat: chat || [],
      TOTAL: (r.players || []).reduce((s, p) => s + (p.territories || 0), 0) || 176, VICTORY: 0.6,
      TICK_SEC: r.match.tick_interval_sec || 20, DAY: r.match.current_tick,
      _defence: defence, _vision: vision, _matchId: matchId, _nextTickAt: r.match.next_tick_at,
    };
  }

  window.HUD_DATA_STRIKES = {
    artillery: { tech: 'artillery', perUnit: 2 }, air: { tech: 'air', perUnit: 3, rangeKm: 1500 },
    srbm: { tech: 'srbm', damage: 12, rangeKm: 1000, name: 'Short-range missile' },
    mrbm: { tech: 'mrbm', damage: 18, rangeKm: 5500, name: 'Medium-range missile' },
    icbm: { tech: 'icbm', damage: 25, rangeKm: 40000, name: 'ICBM' }, nuke: { tech: 'nukes' },
  };
  window.HUD_DATA_TECH_META = [
    { key: 'artillery', name: 'Artillery', icon: 'target', cost: { research: 300, gold: 1500 }, days: 4, unlocks: 'Artillery unit. Shell any country that borders a stack with guns.' },
    { key: 'air', name: 'Air Force', icon: 'airplane-tilt', cost: { research: 600, gold: 3000 }, days: 6, requires: ['artillery'], unlocks: 'Air Force unit. Strike anything within 1 500 km of a stack with planes.' },
    { key: 'srbm', name: 'Short-range missiles', icon: 'rocket', cost: { research: 800, gold: 5000 }, days: 8, requires: ['artillery'], unlocks: 'Build missiles (800 gold) that hit up to 1 000 km from your capital.' },
    { key: 'mrbm', name: 'Medium-range missiles', icon: 'rocket', cost: { research: 1500, gold: 10000 }, days: 12, requires: ['srbm'], unlocks: 'Missiles (1 500 gold) with 5 500 km range.' },
    { key: 'icbm', name: 'ICBM', icon: 'rocket-launch', cost: { research: 3000, gold: 25000 }, days: 18, requires: ['mrbm'], unlocks: 'Intercontinental missiles (4 000 gold). Reach any country on Earth.' },
    { key: 'nukes', name: 'Nuclear weapons', icon: 'radioactive', cost: { research: 6000, gold: 60000, minerals: 8000 }, days: 25, requires: ['icbm'], labs: 5, danger: true, unlocks: 'Warheads (15 000 gold, 10 days each). Destroys everything in a country, kills 40% of its people and ruins its farmland for 20 days. Every nation may declare war on you, and nuclear powers retaliate at once.' },
  ];

  // Initial snapshot: fetch synchronously so window.HUD_DATA exists before hud.js evaluates
  // (hud.js captures HUD_DATA at load time). Subsequent updates poll asynchronously every 3s.
  let lastEvent = 0, feats = null, chatAll = [], lastChatId = 0;
  function loadFeats() {
    if (feats) return feats;
    try { const x = new XMLHttpRequest(); x.open('GET', window.IAP_DATA.GEO_URL, false); x.send(); feats = {};
      JSON.parse(x.responseText).features.forEach((f) => { feats[f.properties.code] = f; }); } catch (e) { feats = {}; }
    return feats;
  }
  function initialFetch() {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', '/api/match/get?match_id=' + matchId + '&since_event=0', false);
      x.send();
      const r = JSON.parse(x.responseText);
      try { const xc = new XMLHttpRequest(); xc.open('GET', '/api/chat/list?match_id=' + matchId + '&since_id=0', false); xc.send();
        chatAll = mapChat(JSON.parse(xc.responseText).messages); lastChatId = chatAll.reduce((m, c) => Math.max(m, c.id || 0), 0); } catch (e2) { chatAll = []; }
      window.HUD_DATA = mapSnapshot(r, loadFeats(), chatAll);
      lastEvent = (r.events || []).reduce((m, e) => Math.max(m, e.id || 0), 0);
    } catch (e) {
      // Fall back to an empty-ish shape so the HUD still renders rather than throwing.
      window.HUD_DATA = mapSnapshot({ me: { player_id: 0, upkeep: {}, tech: {}, arsenal: {} }, players: [], territories: [], armies: [], buildings: [], events: [], diplomacy: [], defence: {}, vision: [], match: { current_tick: 0, tick_interval_sec: 20 } }, {});
    }
  }
  initialFetch();

  // Expose the live bridge for hud.js (polling + actions). hud.js boots off window.HUD_DATA; in live
  // mode it calls HUD_LIVE.poll() on an interval and routes HUD actions through HUD_LIVE.api.
  window.HUD_LIVE = {
    api, mapSnapshot, matchId, scenarioKey: 'live',
    poll() {
      return api.get(lastEvent).then((r) => {
        lastEvent = (r.events || []).reduce((m, e) => Math.max(m, e.id || 0), lastEvent);
        return api.chatList(lastChatId).then(
          (cr) => { const nw = mapChat(cr.messages); if (nw.length) { chatAll = chatAll.concat(nw); lastChatId = chatAll.reduce((m, c) => Math.max(m, c.id || 0), lastChatId); } return mapSnapshot(r, loadFeats(), chatAll); },
          () => mapSnapshot(r, loadFeats(), chatAll)
        );
      });
    },
  };
})();
