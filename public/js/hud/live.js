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
  // Reject with the server's JSON (which carries .message) so the HUD can show the real
  // reason ("No free training slot…", "Not enough gold", …) instead of "Something went wrong."
  const req = (url, method, data) => $.ajax({ url, method, data }).then((r) => r, (xhr) => { throw (xhr && xhr.responseJSON) || { success: false, message: 'Network error.' }; });
  const api = {
    get: (since) => req('/api/match/get', 'GET', { match_id: matchId, since_event: since || 0 }),
    plan: (target) => req('/api/army/plan', 'GET', { match_id: matchId, target }),
    move: (army_id, target, kind) => req('/api/army/move', 'POST', { army_id, target, kind: kind || 'land' }),
    train: (country_code, type, count) => req('/api/army/train', 'POST', { match_id: matchId, country_code, type, count: count || 1 }),
    build: (country_code, type) => req('/api/build/queue', 'POST', { match_id: matchId, country_code, type }),
    strike: (p) => req('/api/strike', 'POST', Object.assign({ match_id: matchId }, p)),
    research: (key) => req('/api/research/start', 'POST', { match_id: matchId, key }),
    arsenal: (item) => req('/api/arsenal/build', 'POST', { match_id: matchId, item }),
    propose: (player, type) => req('/api/diplomacy/propose', 'POST', { match_id: matchId, player, type }),
    respond: (id, accept) => req('/api/diplomacy/respond', 'POST', { match_id: matchId, id, accept: accept ? 1 : 0 }),
    declareWar: (player) => req('/api/diplomacy/declare-war', 'POST', { match_id: matchId, player }),
    breakAlliance: (player) => req('/api/diplomacy/break', 'POST', { match_id: matchId, player }),
    tradePropose: (player, give, receive) => req('/api/trade/propose', 'POST', { match_id: matchId, player, give: JSON.stringify(give || {}), receive: JSON.stringify(receive || {}) }),
    tradeRespond: (id, accept) => req('/api/trade/respond', 'POST', { match_id: matchId, id, accept: accept ? 1 : 0 }),
    chatSend: (body, scope) => req('/api/chat/send', 'POST', { match_id: matchId, body, scope: scope || 'all' }),
    cheat: (cmd) => req('/api/debug/cheat', 'POST', { match_id: matchId, cmd }),
    chatList: (since) => req('/api/chat/list', 'GET', { match_id: matchId, since_id: since || 0 }),
  };

  const DIPLO_STATE = (rel) => {
    if (!rel) return 'neutral';
    if (rel.state === 'allied') return 'allied';
    if (rel.state === 'war') return 'war';
    if (rel.truce_until != null) return 'truce';
    return 'neutral';
  };

  // Turn raw server events ({id, tick, type, data}) into the feed's display shape
  // ({id, type, actor, text, day}), newest-first. Noisy/internal events are dropped.
  function mapEvents(rows, players, feats, myId) {
    const pname = (id) => { if (id == null) return ''; if (id === myId) return 'You'; const p = players.find((x) => x.id === id); return p ? p.name : 'A rival nation'; };
    const cname = (code) => (feats[code] && feats[code].properties && feats[code].properties.name) || code || 'a country';
    const bname = (t) => (window.IAP_DATA.BUILDINGS[t] || {}).name || t;
    const uname = (u) => (window.HUD_UNITS[u] || {}).name || u;
    const tname = (k) => { const t = (window.HUD_DATA_TECH_META || []).find((x) => x.key === k); return t ? t.name : k; };
    const aname = (k) => (window.HUD_DATA_STRIKES && window.HUD_DATA_STRIKES[k] && window.HUD_DATA_STRIKES[k].name) || k;
    const sname = (k) => ({ artillery: 'an artillery barrage', air: 'an air strike', srbm: 'a short-range missile', mrbm: 'a medium-range missile', icbm: 'an ICBM' }[k] || 'a strike');
    const out = [];
    (rows || []).forEach((e) => {
      const d = e.data || {}, day = e.tick; let actor = '', text = null, type = e.type;
      switch (e.type) {
        case 'match_started': text = 'The match has begun.'; break;
        case 'build_complete': actor = pname(d.player); text = 'finished a ' + bname(d.type) + ' in ' + cname(d.country) + '.'; break;
        case 'training_complete': actor = pname(d.player); text = 'trained ' + d.count + ' ' + uname(d.unit) + ' in ' + cname(d.country) + '.'; break;
        case 'research_complete': actor = pname(d.player); text = 'researched ' + tname(d.tech) + '.'; break;
        case 'arsenal_ready': actor = pname(d.player); text = 'built ' + d.count + ' ' + aname(d.item) + '.'; break;
        case 'conquest': actor = pname(d.to); text = 'conquered ' + cname(d.country) + '.'; break;
        case 'battle_repelled': actor = pname(d.defender); text = 'held ' + cname(d.country) + ' against ' + pname(d.attacker) + '.'; break;
        case 'reinforced': actor = pname(d.player); text = 'reinforced ' + cname(d.country) + '.'; break;
        case 'revolt': type = 'war'; text = cname(d.country) + ' revolted against ' + pname(d.from) + '.'; break;
        case 'integrated': actor = pname(d.player); text = 'integrated ' + cname(d.country) + '.'; break;
        case 'truce_ended': text = 'Truce ended between ' + pname(d.a) + ' and ' + pname(d.b) + '.'; break;
        case 'player_defeated': actor = pname(d.player); text = 'has been defeated.'; break;
        case 'match_ended': actor = pname(d.winner); text = 'dominates the world!'; break;
        case 'desertion': actor = pname(d.player); text = 'lost ' + d.lost + ' troops to desertion.'; break;
        case 'grounded_no_oil': actor = pname(d.player); text = 'ran out of oil — forces grounded.'; break;
        case 'strike': {
          actor = pname(d.by);
          const bits = [];
          if (d.units_destroyed) bits.push(d.units_destroyed + ' unit' + (d.units_destroyed > 1 ? 's' : '') + ' destroyed');
          const sd = d.garrison_damage != null ? d.garrison_damage : d.def_removed;
          if (!d.units_destroyed && sd) bits.push(sd + ' defence damage');
          text = 'hit ' + cname(d.target) + ' with ' + sname(d.kind) + (bits.length ? ' (' + bits.join(', ') + ')' : '') + '.';
          break;
        }
        case 'nuclear_strike': actor = pname(d.by); text = 'launched a nuclear strike on ' + cname(d.target) + '!'; break;
        default: return; // ai_*, retaliate_prompt, research_started, battle_won/lost, proposal_* — skip
      }
      out.push({ id: e.id, type, actor, text, day });
    });
    return out.reverse(); // newest first
  }

  // Build HUD_DATA from a /api/match/get snapshot.
  const mapChat = (rows) => (rows || []).map((m) => ({ id: m.id, pid: m.player, scope: m.scope, body: m.body }));
  function mapSnapshot(r, feats, chat) {
    const myId = r.me.player_id;
    const landsOf = {}; (r.territories || []).forEach((t) => { (landsOf[t.owner] = landsOf[t.owner] || []).push(t.country_code); });
    const relByPlayer = {}; (r.diplomacy || []).forEach((d) => { relByPlayer[d.player] = d; });
    // Access I hold over other players' land + active truce countdowns, from the relations.
    const ACCESS = {}, TRUCE_UNTIL = {};
    (r.diplomacy || []).forEach((d) => {
      if (d.access_received) ACCESS[d.player] = true;      // I may cross their land
      if (d.truce_until != null) TRUCE_UNTIL[d.player] = d.truce_until;
    });
    // Diplomacy proposals in flight (incoming need accept/decline; outgoing show "waiting").
    const PROPOSALS = (r.proposals || []).map((p) => ({ id: p.id, from: p.from, to: p.to, type: p.type, incoming: !!p.incoming, expires: p.expires_tick }));
    const players = (r.players || []).map((p) => ({
      id: p.id, me: p.id === myId, name: p.display_name, title: p.leader_title || '', country: p.country_code,
      color: p.color, pop: p.pop, popCap: Math.round(p.pop * 1.2), ai: !!p.is_ai,
      diplo: p.id === myId ? undefined : DIPLO_STATE(relByPlayer[p.id]),
      lands: landsOf[p.id] || [], share: p.share,
    }));
    const meP = players.find((p) => p.me);
    if (meP && r.me.pop_cap != null) meP.popCap = r.me.pop_cap;   // real capacity from land + housing
    // live resources + the real net per-tick delta the server computes (production − consumption
    // − upkeep). Falls back to upkeep-only if an older server didn't send `delta`.
    const meRow = (r.players || []).find((p) => p.id === myId) || {};
    const res = {}; RES.forEach((k) => { res[k] = meRow[k] != null ? meRow[k] : 0; });
    const delta = {}; RES.forEach((k) => { delta[k] = 0; });
    if (r.me.delta) {
      RES.forEach((k) => { delta[k] = r.me.delta[k] != null ? r.me.delta[k] : 0; });
    } else {
      const upk = r.me.upkeep || {};
      delta.gold -= upk.gold || 0; delta.food -= upk.food || 0; delta.oil -= upk.oil || 0;
    }
    const fed = res.food > 0;   // fed as long as there's food in the stockpile this tick
    const scenario = { res, delta, efficiency: r.me.efficiency != null ? r.me.efficiency : 1, fed, alert: null };

    const armies = (r.armies || []).map((a) => {
      const base = { id: 'srv' + a.id, srvId: a.id, owner: a.player, units: a.units || {}, at: a.country_code };
      if (a.moving_to) { base.route = null; base.from = a.origin || a.country_code; base.to = a.moving_to; base.codes = a.path || [a.origin || a.country_code, a.moving_to]; base.kind = a.kind || 'land'; base.arriveDay = a.arrive_at_tick; base.departTick = a.depart_tick; }
      return base;
    });

    const TECH_META = window.HUD_DATA_TECH_META;
    const techLevels = r.me.tech || {};
    const ra = r.me.research_active;   // in-progress project (key, started_tick, days) or null
    const tech = TECH_META.map((t) => {
      const done = techLevels[t.key] === 1;
      const active = ra && ra.key === t.key;
      // 'active' drives the progress bar + "ready Day X"; 'locked' is just a placeholder the
      // HUD's techState() re-derives (ready/queued/poor) from requirements, cost and whether
      // another project is already under way.
      return Object.assign({}, t, {
        status: done ? 'done' : (active ? 'active' : 'locked'),
        startDay: active ? ra.started_tick : r.match.current_tick,
        days: active ? ra.days : t.days,
        progress: 0,
      });
    });

    const defence = r.defence || {};
    const vision = r.vision || [];
    const buildings = (r.buildings || []).map((b) => {
      // Progress fills from started→complete_at; derive started from the real build length
      // (complete_at − build_ticks) instead of "now", else every bar sits at 0%.
      const bt = (window.IAP_DATA.BUILDINGS[b.type] || {}).build_ticks || 3;
      return { id: b.id, type: b.type, status: b.status === 'active' ? 'active' : 'building', country: b.country_code, complete_at: b.complete_at_tick, started: (b.complete_at_tick != null ? b.complete_at_tick - bt : r.match.current_tick) };
    });

    // In-progress training batches → the HUD's {at, u, ready} shape (slot usage + ready Day).
    const training = (r.me.training || []).map((t) => ({ at: t.country_code, u: t.unit, ready: t.ready_tick, count: t.count }));

    return {
      players, scenarios: { live: scenario }, buildingsHere: buildings, training,
      UNITS: window.HUD_UNITS, UNITS_TIPS: window.HUD_UNITS_TIPS,
      TECH: tech, STRIKES: window.HUD_DATA_STRIKES, ARSENAL: r.me.arsenal || {}, ACCESS, TRUCE_UNTIL, PROPOSALS,
      armies, incoming: [], trades: (r.trades || []).map((t) => ({ id: t.id, dir: t.dir, from: t.from, to: t.to, give: t.give || {}, receive: t.receive || {} })),
      events: mapEvents(r.events || [], players, feats || {}, myId), chat: chat || [],
      TOTAL: (r.players || []).reduce((s, p) => s + (p.territories || 0), 0) || 176, VICTORY: 0.6,
      TICK_SEC: r.match.tick_interval_sec || 20, DAY: r.match.current_tick,
      _defence: defence, _vision: vision, _matchId: matchId, _nextTickAt: r.match.next_tick_at,
    };
  }

  window.HUD_DATA_STRIKES = {
    artillery: { tech: 'artillery', perUnit: 2 }, air: { tech: 'air', perUnit: 3, rangeKm: 4000 },
    srbm: { tech: 'srbm', damage: 12, rangeKm: 1000, name: 'Short-range missile' },
    mrbm: { tech: 'mrbm', damage: 18, rangeKm: 5500, name: 'Medium-range missile' },
    icbm: { tech: 'icbm', damage: 25, rangeKm: 40000, name: 'ICBM' }, nuke: { tech: 'nuclear' },
  };
  window.HUD_DATA_TECH_META = [
    { key: 'artillery', name: 'Artillery', icon: 'target', cost: { research: 300, gold: 1500 }, days: 4, unlocks: 'Artillery unit. Shell any country that borders a stack with guns.' },
    { key: 'air', name: 'Air Force', icon: 'airplane-tilt', cost: { research: 600, gold: 3000 }, days: 6, requires: ['artillery'], unlocks: 'Air Force unit. Strike anything within 4 000 km of a stack with planes.' },
    { key: 'srbm', name: 'Short-range missiles', icon: 'rocket', cost: { research: 800, gold: 5000 }, days: 8, requires: ['artillery'], unlocks: 'Build missiles (800 gold) that hit up to 1 000 km from your capital.' },
    { key: 'mrbm', name: 'Medium-range missiles', icon: 'rocket', cost: { research: 1500, gold: 10000 }, days: 12, requires: ['srbm'], unlocks: 'Missiles (1 500 gold) with 5 500 km range.' },
    { key: 'icbm', name: 'ICBM', icon: 'rocket-launch', cost: { research: 3000, gold: 25000 }, days: 18, requires: ['mrbm'], unlocks: 'Intercontinental missiles (4 000 gold). Reach any country on Earth.' },
    { key: 'nuclear', name: 'Nuclear weapons', icon: 'radioactive', cost: { research: 6000, gold: 60000, minerals: 8000 }, days: 25, requires: ['icbm'], labs: 5, danger: true, unlocks: 'Warheads (15 000 gold, 10 days each). Destroys everything in a country, kills 40% of its people and ruins its farmland for 20 days. Every nation may declare war on you, and nuclear powers retaliate at once.' },
  ];

  // Initial snapshot: fetch synchronously so window.HUD_DATA exists before hud.js evaluates
  // (hud.js captures HUD_DATA at load time). Subsequent updates poll asynchronously every 3s.
  let lastEvent = 0, feats = null, chatAll = [], lastChatId = 0, eventsAll = [];
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
      eventsAll = (r.events || []).slice();   // seed the dispatches log with everything so far
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
        // Accumulate: the poll only returns events newer than lastEvent, so append them to the
        // running log (capped) instead of letting the feed empty out between ticks.
        if ((r.events || []).length) { eventsAll = eventsAll.concat(r.events); if (eventsAll.length > 150) eventsAll = eventsAll.slice(-150); }
        r.events = eventsAll;
        return api.chatList(lastChatId).then(
          (cr) => { const nw = mapChat(cr.messages); if (nw.length) { chatAll = chatAll.concat(nw); lastChatId = chatAll.reduce((m, c) => Math.max(m, c.id || 0), lastChatId); } return mapSnapshot(r, loadFeats(), chatAll); },
          () => mapSnapshot(r, loadFeats(), chatAll)
        );
      });
    },
  };
})();
