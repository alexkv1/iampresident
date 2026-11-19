// Match HUD mockup — composes the HUD regions over the live globe on a 1440×900 stage scaled to fit.
const HUD_W = 1440, HUD_H = 900;
const HUD_TWEAKS = /*EDITMODE-BEGIN*/{
  "scenario": "attack",
  "panels": "frosted",
  "myColor": "#42d4f4",
  "fog": true,
  "speed": 1
}/*EDITMODE-END*/;
const FOG_TINT = '#161e30', NEUTRAL_LAND = '#4d6390';
const ROUTE_LIFT = { land: 0, sea: 0.04, air: 0.14 };
function scaleUnits(u, f, keepOne) {
  const out = {}; let n = 0;
  Object.keys(u).forEach((k) => { out[k] = Math.floor(u[k] * f); n += out[k]; });
  if (!n && keepOne) { const k = Object.keys(u).find((x) => u[x] > 0); out[k] = 1; n = 1; }
  return n ? out : null;
}
function mergeUnits(a, b) { const o = { ...a }; Object.keys(b).forEach((k) => { o[k] = (o[k] || 0) + b[k]; }); return o; }

function hudShape(feature) {
  if (!feature) return null;
  const polys = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const rings = polys.map((p) => p[0]);
  const all = [].concat(...rings);
  const lons = all.map((c) => c[0]);
  const wrap = Math.max(...lons) - Math.min(...lons) > 180;
  const fx = (lon) => (wrap && lon < 0 ? lon + 360 : lon);
  const lat0 = all.reduce((a, c) => a + c[1], 0) / all.length;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const pts = rings.map((r) => r.map((c) => [fx(c[0]) * kx, -c[1]]));
  const flat = [].concat(...pts);
  const minX = Math.min(...flat.map((p) => p[0])), maxX = Math.max(...flat.map((p) => p[0]));
  const minY = Math.min(...flat.map((p) => p[1])), maxY = Math.max(...flat.map((p) => p[1]));
  const s = 92 / Math.max(maxX - minX, maxY - minY);
  const ox = (100 - (maxX - minX) * s) / 2, oy = (100 - (maxY - minY) * s) / 2;
  return pts.map((r) => 'M' + r.map((p) => ((p[0] - minX) * s + ox).toFixed(1) + ' ' + ((p[1] - minY) * s + oy).toFixed(1)).join('L') + 'Z').join('');
}

const TIP_W = 260;
function TipLayer({ state }) {
  const { Tooltip } = window.IAP_DS;
  if (!state || !Tooltip) return null;
  const { tip, r, place } = state;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, gap = 12;
  let style, arrowOffset;
  if (place === 'top' || place === 'bottom') {
    const left = Math.max(8, Math.min(HUD_W - TIP_W - 8, cx - TIP_W / 2));
    arrowOffset = cx - left;
    style = place === 'bottom' ? { left, top: r.y + r.h + gap } : { left, top: r.y - gap, transform: 'translateY(-100%)' };
  } else {
    style = place === 'left' ? { left: r.x - gap - TIP_W, top: cy, transform: 'translateY(-50%)' } : { left: r.x + r.w + gap, top: cy, transform: 'translateY(-50%)' };
  }
  return (
    <div style={{ position: 'absolute', zIndex: 60, pointerEvents: 'none', ...style }}>
      <Tooltip {...tip} placement={place} arrowOffset={arrowOffset} />
    </div>
  );
}

function MatchHud() {
  const { Toast } = window.IAP_DS;
  const H = window.HUD_DATA, D = window.IAP_DATA;
  const [t, setTweak] = useTweaks(HUD_TWEAKS);
  const sc = H.scenarios[t.scenario] || H.scenarios.calm;
  const solid = t.panels === 'solid';

  const [scale, setScale] = React.useState(1);
  const [geo, setGeo] = React.useState(null);
  const [mode, setMode] = React.useState('build');
  const [selected, setSelected] = React.useState('SWE');
  const [lens, setLens] = React.useState('political');
  const [hover, setHover] = React.useState(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [day, setDay] = React.useState(H.DAY);
  const [secs, setSecs] = React.useState(12);
  const clock = React.useRef({ t0: performance.now(), day0: H.DAY, into: H.TICK_SEC - 12, dayMs: H.TICK_SEC * 1000 });
  const [queue, setQueue] = React.useState(H.buildingsHere.map((b) => ({ ...b, country: 'SWE' })));
  const [events, setEvents] = React.useState(H.events);
  const [chat, setChat] = React.useState(H.chat);
  const [players, setPlayers] = React.useState(H.players);
  const [toasts, setToasts] = React.useState([]);
  const [armies, setArmies] = React.useState([]);
  const [bursts, setBursts] = React.useState([]);
  const [preview, setPreview] = React.useState(null);
  const [geoReady, setGeoReady] = React.useState(false);
  const [tech, setTech] = React.useState(() => H.TECH.map((x) => ({ ...x, startDay: H.DAY })));
  const [shots, setShots] = React.useState([]);
  const [scars, setScars] = React.useState({});
  const [occupied, setOccupied] = React.useState({});
  const [proposals, setProposals] = React.useState({});
  const [training, setTraining] = React.useState([]);
  const slotsAt = (c) => 1 + queue.filter((b) => b.country === c && b.type === 'factory' && b.status === 'active').length;
  const shotsRef = React.useRef(shots); shotsRef.current = shots;
  const techDone = new Set(tech.filter((x) => x.status === 'done').map((x) => x.key));
  const labs = queue.filter((b) => b.type === 'lab' && b.status === 'active').length + 1;
  const dayMs = (H.TICK_SEC * 1000) / (t.speed || 1);
  const armiesRef = React.useRef(armies), playersRef = React.useRef(players), dayRef = React.useRef(day);
  armiesRef.current = armies; playersRef.current = players; dayRef.current = day;
  const stageRef = React.useRef(null), hostRef = React.useRef(null), globeRef = React.useRef(null);
  const [tipState, setTipState] = React.useState(null);
  const tipTimer = React.useRef(null);
  const scaleRef = React.useRef(1);
  scaleRef.current = scale;
  const tipApi = React.useMemo(() => ({
    show(tip, el, place) {
      clearTimeout(tipTimer.current);
      if (!tip || !el) return;
      tipTimer.current = setTimeout(() => {
        const st = stageRef.current.getBoundingClientRect(), b = el.getBoundingClientRect(), k = scaleRef.current;
        setTipState({ tip, place, r: { x: (b.left - st.left) / k, y: (b.top - st.top) / k, w: b.width / k, h: b.height / k } });
      }, 300);
    },
    hide() { clearTimeout(tipTimer.current); setTipState(null); },
  }), []);

  const me = { ...players.find((p) => p.me), color: t.myColor };
  // Weighted world score (GAME_RULES §5). Mock weights: population + land slots; production uses pop + area + GDP.
  const allPlayers = players.map((p) => ({ ...(p.me ? me : p), share: window.__HUD_W ? p.lands.reduce((s, c) => s + (window.__HUD_W[c] || 0), 0) : null }));

  React.useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / HUD_W, window.innerHeight / HUD_H));
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Day + countdown come from one epoch; re-anchor when the speed changes so time stays continuous.
  const dayNow = () => { const c = clock.current; const el = (performance.now() - c.t0) / c.dayMs + c.into / H.TICK_SEC; return c.day0 + el; };
  React.useEffect(() => {
    const c = clock.current, cur = dayNow();
    c.t0 = performance.now(); c.day0 = Math.floor(cur); c.into = (cur - Math.floor(cur)) * H.TICK_SEC; c.dayMs = (H.TICK_SEC * 1000) / (t.speed || 1);
    const tick = () => {
      const d = dayNow(), whole = Math.floor(d);
      setDay((x) => (x === whole ? x : whole));
      const s = Math.max(1, Math.ceil((1 - (d - whole)) * H.TICK_SEC));
      setSecs((x) => (x === s ? x : s));
    };
    tick();
    const id = setInterval(tick, 200); // interval (not rAF) so the clock keeps pace with marches even when the tab isn't painting
    return () => clearInterval(id);
  }, [t.speed]);

  const toast = (msg, kind) => {
    const id = Math.random();
    setToasts((x) => [...x, { id, msg, kind }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2600);
  };

  // Globe
  React.useEffect(() => {
    const g = new window.Globe(hostRef.current, { autoRotate: false });
    globeRef.current = g;
    g.camera.position.z = 2.6;
    g.load(D.GEO_URL).then(() => {
      const props = {}, feats = {};
      g.setSelectable(true);
      Object.keys(g.props).forEach((c) => { props[c] = g.props[c]; });
      window.__HUD_PROPS = props;
      fetch(D.GEO_URL).then((r) => r.json()).then((fc) => { fc.features.forEach((f) => { feats[f.properties.code] = f; }); window.HUD_GEO.build(fc);
        let P = 0, L = 0; Object.values(props).forEach((p) => { P += p.pop; L += p.land_slots; });
        window.__HUD_W = {}; Object.keys(props).forEach((c) => { window.__HUD_W[c] = 0.5 * props[c].pop / P + 0.5 * props[c].land_slots / L; });
        setGeo({ props, feats }); setGeoReady(true); });
      g.focus('SWE'); g._targetRotX = Math.min(g._targetRotX, 0.92);
    });
    return () => g.destroy();
  }, []);

  const cbs = React.useRef({});
  cbs.current = { setHover, setSelected };
  window.__hud = { setSelected, setMode };
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geo) return;
    g.onHover((c, p) => cbs.current.setHover(c ? { code: c, props: p } : null));
    g.onSelect((c) => cbs.current.setSelected(c));
  }, [geo]);

  const ownerOf = (code) => allPlayers.find((p) => p.lands.includes(code)) || null;
  const cname = (c) => (geo && geo.props[c] ? geo.props[c].name : c);
  const isFriendlyLand = (c) => { const o = ownerOf(c); return !!o && (o.me || o.diplo === 'allied'); };
  const warIds = new Set(allPlayers.filter((p) => p.diplo === 'war').map((p) => p.id));
  const alliedIds = new Set(allPlayers.filter((p) => p.diplo === 'allied').map((p) => p.id));

  // ---- Fog of war: you see your + allied lands, where your troops are, and one border beyond.
  const vision = React.useMemo(() => {
    const v = new Set();
    if (!geoReady) return v;
    const seed = [];
    allPlayers.forEach((p) => { if (p.me || alliedIds.has(p.id)) seed.push(...p.lands); });
    armies.forEach((a) => { if (a.owner === me.id || alliedIds.has(a.owner)) { if (a.route) seed.push(a.from, a.to); else seed.push(a.at); } });
    seed.forEach((c) => { v.add(c); window.HUD_GEO.neighbors(c).forEach((n) => v.add(n)); });
    return v;
  }, [geoReady, players, armies]);
  const seen = (c) => !t.fog || vision.has(c);
  const armyVisible = (a) => a.owner === me.id || alliedIds.has(a.owner) || (a.route ? seen(a.from) || seen(a.to) : seen(a.at));
  const visibleArmies = armies.filter(armyVisible);
  const garrisonBase = (c) => { const p = geo && geo.props[c]; if (!p) return 8; return Math.max(3, Math.min(60, Math.round(2 + 2 * Math.sqrt(p.pop / 1e6) + p.land_slots / 4))); };
  const garrisonOf = (c) => { const o = ownerOf(c), base = garrisonBase(c); const g = !o ? base : occupied[c] ? 0 : Math.round(base * 0.5); return Math.max(0, g - (scars[c] || 0)); };
  const defUnits = (u) => Object.keys(u).reduce((s, k) => s + u[k] * (H.UNITS[k].defence || 0), 0);
  const stackSpeed = (u) => Math.min(9999, ...Object.keys(u).filter((k) => u[k] > 0 && k !== 'navy' && k !== 'air').map((k) => H.UNITS[k].speed));
  const landUnits = (u) => Object.keys(u).filter((k) => k !== 'navy' && k !== 'air').reduce((s, k) => s + u[k], 0);
  const winChance = (A, D) => { if (D <= 0) return 1; let w = 0; for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) if (A * (0.85 + 0.3 * (i + 0.5) / 40) > D * (0.85 + 0.3 * (j + 0.5) / 40)) w++; return w / 1600; };
  const hasAccess = (o) => !!o && (o.me || !!H.ACCESS[o.id]);
  const passable = (c) => hasAccess(ownerOf(c));
  const truceLeft = (o) => (o && H.TRUCE_UNTIL[o.id] ? Math.max(0, H.TRUCE_UNTIL[o.id] - day) : 0);
  const attackBlock = (o) => (!o || o.me || o.diplo === 'war' ? null : o.diplo === 'allied' ? 'allied' : truceLeft(o) ? 'Truce with ' + o.name + ' · ' + truceLeft(o) + ' days left. Truces can’t be broken.' : 'Declare war on ' + o.name + ' first (Diplomacy).');
  const defenceOf = (c) => { const o = ownerOf(c); const st = o ? armies.filter((a) => !a.route && a.at === c && a.owner === o.id).reduce((s, a) => s + defUnits(a.units), 0) : 0; return Math.round((garrisonOf(c) + st) * 1.5 * window.HUD_GEO.terrainMult(c)); };
  const fogged = (c) => { const o = ownerOf(c); return !!o && !o.me && !seen(c); };

  // ---- Launch / resolve marches
  const launch = (owner, units, codes, kind, days, idHint) => {
    const g = globeRef.current;
    return { id: idHint || 'm' + Math.random().toString(36).slice(2, 8), owner, units, from: codes[0], to: codes[codes.length - 1], codes, kind,
      route: window.HUD_GEO.pathPoints(g, codes, { lift: ROUTE_LIFT[kind], step: 0.5 }), start: performance.now(), dur: Math.max(500, (Math.floor(dayNow()) + days - dayNow()) * clock.current.dayMs), arriveDay: Math.floor(dayNow()) + days };
  };

  React.useEffect(() => {
    if (!geoReady) return;
    setPlayers(H.players.map((p) => ({ ...p, lands: p.lands.slice() })));
    const base = H.armies.map((a) => ({ ...a, units: { ...a.units } }));
    if (t.scenario === 'attack') H.incoming.forEach((i) => base.push(launch(i.owner, { ...i.units }, [i.from, i.to], 'land', i.days, i.id)));
    setArmies(base); setScars({});
  }, [geoReady, t.scenario]);

  const resolve = (mv) => {
    const ps = playersRef.current, rest = armiesRef.current.filter((a) => a.id !== mv.id);
    const tOwner = ps.find((p) => p.lands.includes(mv.to)) || null, mover = ps.find((p) => p.id === mv.owner);
    const mvMe = !!mover.me, place = cname(mv.to);
    const allied = tOwner && (tOwner.id === mv.owner || (mvMe && tOwner.diplo === 'allied') || (tOwner.me && mover.diplo === 'allied'));
    const settle = (list, ownerId, at, units) => {
      const ex = list.find((a) => !a.route && a.owner === ownerId && a.at === at);
      return ex ? list.map((a) => (a === ex ? { ...a, units: mergeUnits(a.units, units) } : a)) : list.concat([{ id: 's' + Math.random().toString(36).slice(2, 7), owner: ownerId, at, units }]);
    };
    if (allied) { setArmies(settle(rest, mv.owner, mv.to, mv.units)); if (mvMe) toast('Reinforced ' + place + '.', 'ok'); return; }
    const defStacks = rest.filter((a) => !a.route && a.at === mv.to && a.owner !== mv.owner);
    const D = (garrisonOf(mv.to) + defStacks.reduce((s, a) => s + defUnits(a.units), 0)) * 1.5 * window.HUD_GEO.terrainMult(mv.to);
    const A = armyStrength(mv.units) * (mv.kind === 'sea' ? 0.75 : 1);
    const A2 = A * (0.85 + Math.random() * 0.3), D2 = Math.max(0.01, D * (0.85 + Math.random() * 0.3)), win = A2 > D2;
    const bid = Math.random();
    setBursts((b) => [...b, { id: bid, code: mv.to, win }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== bid)), 1500);
    if (win) {
      const units = scaleUnits(mv.units, 1 - Math.min(0.6, 0.4 * D2 / A2), true);
      setOccupied((x) => ({ ...x, [mv.to]: { until: mv.arriveDay + 10, unrest: 0, prev: tOwner ? tOwner.id : null, owner: mv.owner } }));
      setScars((x) => { const y = { ...x }; delete y[mv.to]; return y; });
      setArmies(settle(rest.filter((a) => !defStacks.includes(a)), mv.owner, mv.to, units));
      setPlayers(ps.map((p) => (p.id === mv.owner ? { ...p, lands: p.lands.concat([mv.to]) } : tOwner && p.id === tOwner.id ? { ...p, lands: p.lands.filter((c) => c !== mv.to) } : p)));
      setEvents((ev) => [{ id: Math.random(), type: 'conquest', actor: mvMe ? 'You' : mover.name, text: 'conquered ' + place, day: mv.arriveDay }, ...ev]);
      if (mvMe) toast('Victory! ' + place + ' is yours.', 'ok'); else if (tOwner && tOwner.me) toast(place + ' has fallen to ' + mover.name + '.', 'err');
    } else {
      const units = scaleUnits(mv.units, 1 - (0.5 + 0.4 * (1 - A2 / D2)), false);
      const hurt = rest.map((a) => (defStacks.includes(a) ? { ...a, units: scaleUnits(a.units, 1 - 0.3 * A2 / D2, true) } : a));
      setArmies(units ? settle(hurt, mv.owner, mv.from, units) : hurt);
      setEvents((ev) => [{ id: Math.random(), type: 'battle_repelled', actor: place, text: 'held against ' + (mvMe ? 'you' : mover.name), day: mv.arriveDay }, ...ev]);
      if (mvMe) toast('The attack on ' + place + ' failed. Survivors fell back.', 'err'); else if (tOwner && tOwner.me) toast(place + ' held! The attack was repelled.', 'ok');
    }
  };
  const resolveRef = React.useRef(resolve); resolveRef.current = resolve;
  const scarsRef = React.useRef(scars); scarsRef.current = scars;

  // ---- Strikes: projectile flies along a high arc, then damages troops / garrison. Never captures.
  const STRIKE_BURST = { artillery: 'strike', air: 'strike', missile: 'strike', nuke: 'nuke' };
  const fireStrike = (s) => {
    const g = globeRef.current;
    const lift = s.kind === 'artillery' ? 0.05 : s.kind === 'air' ? 0.12 : 0.3;
    const route = window.HUD_GEO.pathPoints(g, [s.from, s.to], { lift, step: 0.5 });
    const id = 'x' + Math.random().toString(36).slice(2, 7);
    const trail = g.addPath(route, { color: '#ffb36b', opacity: 0.85, radius: 0.0028, dash: 0, arrow: false });
    setShots((x) => [...x, { id, kind: s.kind, route, start: performance.now(), dur: s.kind === 'artillery' ? 900 : 1600, ease: true, to: s.to, damage: s.damage, trail, owner: me.id }]);
    toast(HUD_TIPS.strike[s.kind].title + ' launched at ' + cname(s.to) + '.', 'ok');
  };
  const impact = (shot) => {
    globeRef.current && globeRef.current.removePath(shot.trail);
    const bid = Math.random();
    setBursts((b) => [...b, { id: bid, code: shot.to, kind: STRIKE_BURST[shot.kind] }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== bid)), 2500);
    let dmg = shot.damage, hit = 0;
    const list = armiesRef.current.map((a) => {
      if (a.route || a.at !== shot.to || a.owner === me.id || dmg <= 0) return a;
      const st = armyStrength(a.units), take = Math.min(st, dmg);
      dmg -= take; hit += take;
      return { ...a, units: scaleUnits(a.units, (st - take) / st, false) };
    }).filter((a) => a.units);
    setArmies(list);
    if (dmg > 0) { const base = ownerOf(shot.to) ? 4 : 8, cur = scarsRef.current[shot.to] || 0, add = Math.min(dmg, base - cur); if (add > 0) { hit += add; setScars((x) => ({ ...x, [shot.to]: cur + add })); } }
    setEvents((ev) => [{ id: Math.random(), type: 'war', actor: 'You', text: HUD_TIPS.strike[shot.kind].title.toLowerCase() + ' on ' + cname(shot.to) + ' (−' + hit + ' defence)', day: Math.floor(dayNow() + 1e-6) }, ...ev]);
    toast('Strike on ' + cname(shot.to) + ' knocked ' + hit + ' off its defence.', 'ok');
  };
  const impactRef = React.useRef(impact); impactRef.current = impact;
  React.useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      const done = shotsRef.current.filter((x) => now >= x.start + x.dur);
      if (done.length) { setShots((x) => x.filter((y) => !done.includes(y))); done.forEach((d) => impactRef.current(d)); }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ---- Occupation: unrest rises without troops; revolt at 100; integrate after 10 days
  React.useEffect(() => {
    const occ = { ...occupied }; let changed = false;
    Object.keys(occ).forEach((c) => {
      const o = occ[c];
      if (day >= o.until) { delete occ[c]; changed = true; setEvents((ev) => [{ id: Math.random(), type: 'alliance', actor: cname(c), text: 'is now fully integrated', day }, ...ev]); return; }
      const st = armiesRef.current.find((a) => !a.route && a.at === c && a.owner === o.owner);
      const n = st ? landUnits(st.units) : 0;
      const delta = !n ? 8 : n >= garrisonBase(c) / 2 ? -10 : 2;
      const u = Math.max(0, Math.min(100, o.unrest + delta));
      occ[c] = { ...o, unrest: u }; changed = true;
      if (u >= 100) {
        delete occ[c];
        setPlayers((ps) => ps.map((p) => (p.id === o.owner ? { ...p, lands: p.lands.filter((x) => x !== c) } : o.prev && p.id === o.prev ? { ...p, lands: p.lands.concat([c]) } : p)));
        setEvents((ev) => [{ id: Math.random(), type: 'war', actor: cname(c), text: 'revolted against its occupiers', day }, ...ev]);
        if (o.owner === me.id) toast(cname(c) + ' revolted! Station troops in occupied lands.', 'err');
      }
    });
    if (changed) setOccupied(occ);
  }, [day]);

  // ---- Research progress (one project at a time)
  React.useEffect(() => {
    const act = tech.find((x) => x.status === 'active');
    if (!act) return;
    const prog = act.progress + (day - act.startDay) / act.days;
    if (prog >= 1) {
      setTech((list) => list.map((x) => (x.key === act.key ? { ...x, status: 'done' } : x)));
      toast('Research complete: ' + act.name + ' unlocked.', 'ok');
      setEvents((ev) => [{ id: Math.random(), type: 'build_complete', actor: 'You', text: 'researched ' + act.name, day }, ...ev]);
    }
  }, [day]);
  const onResearch = (x) => {
    setTech((list) => list.map((y) => (y.key === x.key ? { ...y, status: 'active', progress: 0, startDay: dayNow() } : y)));
    toast('Researching ' + x.name + ' · ' + x.days + ' days.', 'ok');
  };
  React.useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      const done = armiesRef.current.find((a) => a.route && now >= a.start + a.dur);
      if (done) resolveRef.current(done);
    }, 150);
    return () => clearInterval(id);
  }, []);

  // ---- Planning (Army pane)
  const myStatic = armies.filter((a) => a.owner === me.id && !a.route);
  const planFor = (target) => {
    const o = ownerOf(target), block = attackBlock(o), G = window.HUD_GEO;
    const land = [], sea = [];
    myStatic.forEach((a) => {
      if (!landUnits(a.units)) return;
      const path = G.landPath(a.at, target, passable);
      const atk = armyStrength(a.units);
      if (path) { const km = G.pathKm(path); land.push({ kind: 'land', ok: true, armyId: a.id, codes: path, km, days: Math.max(1, Math.ceil(km / stackSpeed(a.units))), strength: atk, fromName: cname(a.at), via: path.slice(1, -1).map(cname) }); }
      if (a.units.navy && G.coastal(a.at) && G.coastal(target)) {
        const cap = a.units.navy * H.UNITS.navy.capacity, need = landUnits(a.units), km = G.km(a.at, target) * 1.3;
        sea.push(cap >= need ? { kind: 'sea', ok: true, armyId: a.id, codes: [a.at, target], km, days: Math.max(1, Math.ceil(km / H.UNITS.navy.speed)), strength: Math.round(atk * 0.75), fromName: cname(a.at), via: [] }
          : { kind: 'sea', ok: false, reason: 'Needs ' + Math.ceil((need - cap) / H.UNITS.navy.capacity) + ' more ships in ' + cname(a.at) + ' (' + cap + '/' + need + ' units).' });
      }
    });
    const pick = (arr) => arr.filter((x) => x.ok).sort((x, y) => x.days - y.days || y.strength - x.strength)[0] || arr[0];
    let blockers = null;
    myStatic.forEach((a) => {
      const gp = G.landPath(a.at, target, () => true);
      if (!gp) return;
      const b = gp.slice(1, -1).filter((c) => !passable(c)).map((c) => { const oo = ownerOf(c); return cname(c) + (oo ? (oo.diplo === 'allied' ? ' (ally, no access)' : '') : ' (neutral)'); });
      if (!blockers || b.length < blockers.length) blockers = b;
    });
    const seaReason = !G.coastal(target) ? cname(target) + ' is landlocked. It can’t be reached by sea.' : 'Needs a coastal stack with Navy ships (10 units per ship).';
    let invade = [
      pick(land) || (blockers && blockers.length ? { kind: 'land', ok: false, blockers: blockers.slice(0, 3) } : { kind: 'land', ok: false, reason: 'No land connection. Ship by sea or strike from range.' }),
      pick(sea) || { kind: 'sea', ok: false, reason: seaReason },
    ];
    if (block === 'allied' && !hasAccess(o)) invade = invade.map((x) => ({ kind: x.kind, ok: false, reason: 'Needs military access from ' + o.name + ' (Diplomacy).' }));
    else if (block && block !== 'allied') invade = invade.map((x) => ({ kind: x.kind, ok: false, reason: block }));
    const D = defenceOf(target), fog = fogged(target);
    invade = invade.map((x) => (x.ok && !fog && block !== 'allied' ? { ...x, odds: winChance(x.strength, D) } : x));

    const S = H.STRIKES, strike = [];
    const techName = (k) => (tech.find((x) => x.key === k) || {}).name;
    const lockFor = (k) => (techDone.has(k) ? null : 'Research ' + techName(k) + ((tech.find((x) => x.key === k) || {}).status === 'active' ? ' (in progress)' : ''));
    const noStrike = block && block !== 'allied' ? block : block === 'allied' ? 'You can’t strike an ally.' : null;
    let lk = lockFor('artillery');
    const art = myStatic.filter((a) => a.units.artillery && G.neighbors(a.at).includes(target)).sort((x, y) => y.units.artillery - x.units.artillery)[0];
    strike.push(lk ? { kind: 'artillery', ok: false, locked: true, reason: lk } : noStrike ? { kind: 'artillery', ok: false, reason: noStrike } : art ? { kind: 'artillery', ok: true, from: art.at, to: target, damage: art.units.artillery * S.artillery.perUnit, detail: art.units.artillery + ' guns in ' + cname(art.at) + ' · ' + art.units.artillery + ' minerals' } : { kind: 'artillery', ok: false, reason: 'No artillery in a country that borders ' + cname(target) + '.' });
    lk = lockFor('air');
    const air = myStatic.filter((a) => a.units.air && G.km(a.at, target) <= S.air.rangeKm).sort((x, y) => y.units.air - x.units.air)[0];
    strike.push(lk ? { kind: 'air', ok: false, locked: true, reason: lk } : noStrike ? { kind: 'air', ok: false, reason: noStrike } : air ? { kind: 'air', ok: true, from: air.at, to: target, damage: air.units.air * S.air.perUnit, detail: air.units.air + ' planes from ' + cname(air.at) + ' · ' + Math.round(G.km(air.at, target)) + ' km' } : { kind: 'air', ok: false, reason: myStatic.some((a) => a.units.air) ? 'Out of range (1 500 km).' : 'Train planes in Army mode first.' });
    const dist = G.km(me.country, target);
    const tiers = ['srbm', 'mrbm', 'icbm'].filter((k) => techDone.has(k));
    const inRange = tiers.filter((k) => S[k].rangeKm >= dist);
    const ready = inRange.find((k) => H.ARSENAL[k] > 0);
    strike.push(!tiers.length ? { kind: 'missile', ok: false, locked: true, reason: 'Research Short-range missiles' } : noStrike ? { kind: 'missile', ok: false, reason: noStrike } : ready ? { kind: 'missile', ok: true, from: me.country, to: target, damage: S[ready].damage, detail: S[ready].name + ' · ' + H.ARSENAL[ready] + ' in stock' } : { kind: 'missile', ok: false, reason: !inRange.length ? 'Out of range (' + Math.round(dist) + ' km). Research longer-range missiles.' : 'No ' + S[inRange[0]].name.toLowerCase() + 's built.' });
    lk = lockFor('nukes');
    strike.push(lk ? { kind: 'nuke', ok: false, locked: true, reason: lk + ' · 60 000 gold · 5 Labs' } : { kind: 'nuke', ok: false, reason: 'No warhead built (15 000 gold, 10 days).' });
    return { invade, strike };
  };
  const sendArmy = (opt) => {
    const a = armies.find((x) => x.id === opt.armyId);
    if (!a) return;
    const units = opt.airOnly ? { air: a.units.air } : a.units;
    const left = opt.airOnly ? scaleUnits({ ...a.units, air: 0 }, 1, false) : null;
    const mv = launch(me.id, units, opt.codes, opt.kind, opt.days);
    setArmies((list) => list.filter((x) => x.id !== a.id).concat(left ? [{ ...a, units: left }] : []).concat([mv]));
    setPreview(null);
    const hostile = !isFriendlyLand(mv.to);
    toast((hostile ? 'Forces marching on ' : 'Reinforcing ') + cname(mv.to) + ' · arrives Day ' + mv.arriveDay + '.', 'ok');
    if (hostile) setEvents((ev) => [{ id: Math.random(), type: 'war', actor: 'You', text: 'sent forces toward ' + cname(mv.to), day }, ...ev]);
  };

  // ---- Globe colouring (lens + fog)
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geo) return;
    const map = {};
    if (lens === 'political') {
      const fogC = new THREE.Color(FOG_TINT);
      Object.keys(geo.props).forEach((c) => {
        const o = ownerOf(c);
        const col = new THREE.Color(o ? o.color : NEUTRAL_LAND);
        if (t.fog && !vision.has(c)) col.lerp(fogC, o ? 0.6 : 0.5);
        map[c] = '#' + col.getHexString();
      });
    } else {
      const hex = { farmland: HUD_RES.food.hex, minerals: HUD_RES.minerals.hex, oil: HUD_RES.oil.hex }[lens];
      const lo = new THREE.Color('#1c2740'), hi = new THREE.Color(hex);
      Object.keys(geo.props).forEach((c) => { map[c] = '#' + lo.clone().lerp(hi, Math.pow(geo.props[c][lens] / 100, 0.8)).getHexString(); });
    }
    g.setOwners(map);
    g.setSelected(lens === 'political' ? selected : null);
  }, [geo, lens, selected, t.myColor, t.fog, players, vision]);

  // ---- Route lines on the globe: visible marches + hover/plan preview
  const pathGroups = React.useRef({});
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geoReady) return;
    const want = {};
    visibleArmies.filter((a) => a.route).forEach((a) => { want[a.id] = a; });
    Object.keys(pathGroups.current).forEach((id) => { if (!want[id]) { g.removePath(pathGroups.current[id]); delete pathGroups.current[id]; } });
    Object.values(want).forEach((a) => {
      if (pathGroups.current[a.id]) return;
      const col = (allPlayers.find((p) => p.id === a.owner) || {}).color || '#fff';
      pathGroups.current[a.id] = g.addPath(a.route, { color: col, opacity: 0.95, radius: 0.004, dash: 2 });
    });
  }, [armies, vision, geoReady, t.myColor]);

  const inArmyHostile = mode === 'army' && geo && selected && !(ownerOf(selected) && ownerOf(selected).me);
  const plan = inArmyHostile ? planFor(selected) : null;
  const shownPreview = preview || (plan && plan.invade.find((o) => o.ok)) || null;
  const previewGroup = React.useRef(null);
  React.useEffect(() => {
    const g = globeRef.current;
    if (!g || !geoReady) return;
    g.removePath(previewGroup.current); previewGroup.current = null;
    if (shownPreview && shownPreview.codes) previewGroup.current = g.addPath(window.HUD_GEO.pathPoints(g, shownPreview.codes, { lift: ROUTE_LIFT[shownPreview.kind], step: 0.5 }), { color: ROUTE_COLOR[shownPreview.kind], opacity: 0.6, radius: 0.0035, dash: 2 });
  }, [shownPreview && shownPreview.codes && shownPreview.codes.join('>') + shownPreview.kind, geoReady]);
  React.useEffect(() => { setPreview(null); }, [selected, mode]);

  // ---- Alerts derived from hostile marches you can see
  const threat = visibleArmies.filter((a) => a.route && a.owner !== me.id && me.lands.includes(a.to)).sort((x, y) => x.arriveDay - y.arriveDay)[0];
  const alert = sc.alert || (threat ? { kind: 'war', title: 'Invasion incoming', body: (allPlayers.find((p) => p.id === threat.owner) || {}).name + '’s ' + armyList(threat.units) + ' is marching on ' + cname(threat.to), eta: Math.max(0, threat.arriveDay - day), target: threat.to } : null);

  const armyCtx = geo && selected ? (() => {
    const o = ownerOf(selected), mine = !!o && o.me;
    return {
      mine, allied: !!o && !o.me && o.diplo === 'allied',
      stacks: armies.filter((a) => !a.route && a.at === selected && a.owner === me.id),
      incoming: visibleArmies.filter((a) => a.route && a.to === selected && a.owner !== me.id).map((a) => ({ ...a, ownerName: (allPlayers.find((p) => p.id === a.owner) || {}).name })),
      defence: defenceOf(selected), fogged: fogged(selected),
      enemyHere: armies.filter((a) => !a.route && a.at === selected && a.owner !== me.id),
      neighbors: window.HUD_GEO.neighbors(selected).filter((c) => geo.props[c]).map((c) => {
        const no = ownerOf(c), fr = passable(c), here = armies.find((a) => !a.route && a.at === selected && a.owner === me.id), blk = fr ? null : attackBlock(no);
        return { code: c, name: cname(c), mine: !!no && no.me, friendly: fr, ownerName: no ? (no.me ? 'Yours' : no.name) : null, ownerColor: no ? no.color : null, def: fr ? null : fogged(c) ? null : defenceOf(c), days: here ? Math.max(1, Math.ceil(window.HUD_GEO.pathKm([selected, c]) / stackSpeed(here.units))) : 1, blocked: blk === 'allied' ? 'Needs military access' : blk };
      }).sort((a, b) => a.friendly - b.friendly),
      plan: plan || { invade: [], strike: [] },
      manpower: { used: armies.filter((a) => a.owner === me.id).reduce((s, a) => s + armyCount(a.units), 0), limit: Math.floor(me.pop * 0.01 / 1000) },
      upkeep: armies.filter((a) => a.owner === me.id).reduce((s, a) => { Object.keys(a.units).forEach((k) => { const u = H.UNITS[k].upkeep || {}; Object.keys(u).forEach((r) => { s[r] = (s[r] || 0) + u[r] * a.units[k]; }); }); return s; }, {}),
      terrain: window.HUD_GEO.terrain(selected),
      training: training.filter((x) => x.at === selected), slots: slotsAt(selected), day,
      onSend: sendArmy,
      onPreview: setPreview,
      onStrike: fireStrike,
      techDone,
    };
  })() : null;

  const reticles = [];
  if (shownPreview && shownPreview.codes) { const tc = shownPreview.codes[shownPreview.codes.length - 1]; reticles.push({ code: tc, color: isFriendlyLand(tc) ? '#7fe6dc' : '#ff9db1' }); }
  visibleArmies.filter((a) => a.route).forEach((a) => { if (!reticles.find((r) => r.code === a.to)) reticles.push({ code: a.to, color: a.owner === me.id ? '#7fe6dc' : '#ff4d73' }); });

  // Keyboard: B / A / T / D
  React.useEffect(() => {
    const keys = { b: 'build', a: 'army', r: 'research', t: 'trade', d: 'diplomacy' };
    const f = (e) => { if (e.target.tagName === 'INPUT') return; const m = keys[e.key.toLowerCase()]; if (m) setMode(m); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);

  const onPointerMove = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    setPos({ x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale });
  };

  const onBuild = (type, afford) => {
    const B = D.BUILDINGS[type];
    if (!afford) return toast('Not enough resources.', 'err');
    setQueue((q) => [...q, { type, status: 'building', country: selected, started: day, complete_at: day + B.build_ticks }]);
    toast(B.name + ' started.', 'ok');
  };
  // Training (GAME_RULES §1a): batches of 5 take build_ticks days; one batch per slot, slots = 1 + active Factories in that country.
  const onTrain = (u) => {
    const at = selected, U = H.UNITS[u];
    const busy = training.filter((x) => x.at === at).length;
    if (busy >= slotsAt(at)) return toast('All ' + slotsAt(at) + ' training slots in ' + cname(at) + ' are busy. Build a Factory for another slot.', 'err');
    const ready = Math.floor(dayNow()) + U.build_ticks;
    setTraining((x) => [...x, { id: Math.random(), u, at, ready }]);
    toast('Training 5 ' + U.name.toLowerCase() + ' in ' + cname(at) + ' · ready Day ' + ready + '.', 'ok');
  };
  React.useEffect(() => {
    const due = training.filter((x) => day >= x.ready);
    if (!due.length) return;
    setTraining((x) => x.filter((y) => !due.includes(y)));
    setArmies((list) => due.reduce((l, d) => { const ex = l.find((a) => !a.route && a.owner === me.id && a.at === d.at); return ex ? l.map((a) => (a === ex ? { ...a, units: mergeUnits(a.units, { [d.u]: 5 }) } : a)) : l.concat([{ id: 's' + Math.random().toString(36).slice(2, 7), owner: me.id, at: d.at, units: { [d.u]: 5 } }]); }, list));
    due.forEach((d) => toast('5 ' + H.UNITS[d.u].name.toLowerCase() + ' ready in ' + cname(d.at) + '.', 'ok'));
  }, [day]);
  const onTrade = (tr, ok) => toast(ok ? 'Trade accepted.' : 'Offer declined.', ok ? 'ok' : 'default');
  const onDiplo = (p, act) => {
    if (act === 'war') { setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, diplo: 'war' } : x))); toast('War declared on ' + p.name + '.', 'err'); setEvents((ev) => [{ id: Math.random(), type: 'war', actor: 'You', text: 'declared war on ' + p.name, day }, ...ev]); return; }
    if (act === 'break') { setPlayers((ps) => ps.map((x) => (x.id === p.id ? { ...x, diplo: 'neutral' } : x))); toast('Alliance with ' + p.name + ' ended.', 'default'); return; }
    setProposals((x) => ({ ...x, [p.id + ':' + act]: { expires: day + 3 } }));
    toast({ alliance: 'Alliance proposed to ', access: 'Military access requested from ', truce: 'Truce offered to ' }[act] + p.name + '. Waiting for a reply.', 'ok');
  };
  const onSend = (body, scope) => setChat((c) => [...c, { id: Math.random(), scope, pid: me.id, body }]);
  const onAlert = () => {
    if (alert && alert.target) { setSelected(alert.target); setMode('army'); globeRef.current && globeRef.current.focus(alert.target); }
    else { setSelected('SWE'); setMode('build'); }
  };

  const props = geo && geo.props[selected];
  const shapeOf = (c) => (geo ? hudShape(geo.feats[c]) : null);
  const myShape = React.useMemo(() => shapeOf(me.country), [geo]);
  const selShape = React.useMemo(() => shapeOf(selected), [geo, selected]);
  const pending = H.trades.filter((x) => x.dir === 'in').length;

  return (
    <HudTipCtx.Provider value={tipApi}>
    <div style={{ position: 'fixed', inset: 0, background: '#05080f', overflow: 'hidden' }}>
      <div ref={stageRef} onPointerMove={onPointerMove} style={{ position: 'absolute', left: '50%', top: '50%', width: HUD_W, height: HUD_H, transform: 'translate(-50%, -50%) scale(' + scale + ')', overflow: 'hidden', background: 'var(--grad-page), var(--bg-page)' }}>
        <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(6,10,20,.65) 0%, rgba(6,10,20,0) 22%, rgba(6,10,20,0) 72%, rgba(6,10,20,.7) 100%)' }} />
        <MarkerLayer globeRef={globeRef} armies={visibleArmies} players={allPlayers} me={me} warIds={warIds} day={day} reticles={reticles} bursts={bursts} shots={shots} onPick={(c) => { setSelected(c); setMode('army'); }} />

        <IdentityPlate me={me} countryName={geo ? geo.props[me.country].name : 'Sweden'} shape={myShape} sc={sc} territories={me.lands.length} solid={solid} />
        <WorldClock day={day} secsLeft={secs} tickSec={H.TICK_SEC} players={allPlayers} total={H.TOTAL} victory={H.VICTORY} solid={solid} />
        <Treasury sc={sc} solid={solid} />
        <AlertRibbon alert={alert} day={day} onAction={onAlert} />
        <Standings players={allPlayers} total={H.TOTAL} selected={selected} onPick={(c) => { setSelected(c); globeRef.current && globeRef.current.focus(c); }} solid={solid} />
        {props ? <ContextPanel mode={mode} setMode={setMode} code={selected} props={props} shape={selShape} owner={ownerOf(selected)} me={me} players={allPlayers} sc={sc} day={day} queue={queue.filter((b) => b.country === selected)} occ={occupied[selected]} proposals={proposals} truceLeft={truceLeft} onBuild={onBuild} onTrain={onTrain} army={armyCtx} research={{ tech, labs, dayFloat: day + (1 - secs / H.TICK_SEC), onResearch }} onTrade={onTrade} onDiplo={onDiplo} solid={solid} /> : null}
        <Comms players={allPlayers} events={events} chat={chat} onSend={onSend} solid={solid} />
        <Hotbar mode={mode} setMode={setMode} counts={{ trade: pending, army: threat ? '!' : 0 }} />
        <GlobeControls lens={lens} setLens={setLens} onHome={() => { setSelected(me.country); globeRef.current && globeRef.current.focus(me.country); }} onZoom={(dz) => { const g = globeRef.current; if (g) g.camera.position.z = Math.max(1.6, Math.min(5, g.camera.position.z + dz)); }} />
        <HoverTip hover={hover} pos={pos} owner={hover ? ownerOf(hover.code) : null} lens={lens} fogged={hover ? fogged(hover.code) : false} />
        <TipLayer state={tipState} />

        <div style={{ position: 'absolute', top: alert ? 262 : 186, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none', zIndex: 40 }}>
          {toasts.map((x) => <Toast key={x.id} kind={x.kind}>{x.msg}</Toast>)}
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Match state" />
        <TweakRadio label="Scenario" value={t.scenario} options={[{ value: 'calm', label: 'Calm' }, { value: 'attack', label: 'Invaded' }, { value: 'starving', label: 'Starving' }]} onChange={(v) => setTweak('scenario', v)} />
        <TweakSection label="HUD" />
        <TweakRadio label="Panels" value={t.panels} options={[{ value: 'frosted', label: 'Frosted' }, { value: 'solid', label: 'Solid' }]} onChange={(v) => setTweak('panels', v)} />
        <TweakToggle label="Fog of war" value={t.fog} onChange={(v) => setTweak('fog', v)} />
        <TweakRadio label="Demo speed" value={t.speed} options={[{ value: 1, label: '1×' }, { value: 4, label: '4×' }, { value: 10, label: '10×' }]} onChange={(v) => setTweak('speed', v)} />
        <TweakColor label="Your slot colour" value={t.myColor} options={['#42d4f4', '#bfef45', '#f032e6', '#dcbeff']} onChange={(v) => setTweak('myColor', v)} />
      </TweaksPanel>
    </div>
    </HudTipCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MatchHud />);
