// Live-game Match HUD — vanilla-JS port of design/ui_kits/game/hud/*.jsx (MatchHud orchestrator).
// Renders the full HUD over the three.js globe. In ?mock=1 mode it reproduces match-hud.html exactly
// (fixed state: scenario=attack, mode=build, selected=SWE). Pixel values copied verbatim from the JSX.
(function () {
  const H = window.HUD, D = window.HUD_DATA, IAP = window.IAP_DATA, TIPS = window.HUD_TIPS, GEO = window.HUD_GEO;
  const { esc, HUD_RES, hudNum, Eyebrow, Meter, Ring, Tile, Cost, KeyCap, Silhouette, TabPlates, DIPLO } = H;
  const UI = window.UI;

  const ARMY_UNIT_ORDER = ['air', 'armor', 'artillery', 'navy', 'infantry'];
  const ROUTE_COLOR = { land: '#7fe6dc', sea: '#7cc4ff', air: '#c9adf2' };
  const ROUTE_LIFT = { land: 0, sea: 0.04, air: 0.14 };
  const FOG_TINT = '#161e30', NEUTRAL_LAND = '#4d6390';
  const MODE_META = {
    build: { label: 'Build', icon: 'hammer', key: 'B' },
    army: { label: 'Army', icon: 'sword', key: 'A' },
    research: { label: 'Research', icon: 'flask', key: 'R' },
    trade: { label: 'Trade', icon: 'handshake', key: 'T' },
    diplomacy: { label: 'Diplomacy', icon: 'flag-banner', key: 'D' },
  };
  const BUILD_ORDER = ['farm', 'mine', 'oil_rig', 'power_plant', 'factory', 'lab', 'bank', 'housing'];

  function armyStrength(u) { const U = D.UNITS; return Object.keys(u).reduce((s, k) => s + u[k] * U[k].attack, 0); }
  function armyCount(u) { return Object.values(u).reduce((a, b) => a + b, 0); }
  function armyTop(u) { return ARMY_UNIT_ORDER.find((k) => u[k] > 0) || 'infantry'; }
  function armyList(u) { const U = D.UNITS; return ARMY_UNIT_ORDER.filter((k) => u[k] > 0).map((k) => u[k] + ' ' + U[k].name.toLowerCase()).join(', '); }
  function scaleUnits(u, f, keepOne) { const out = {}; let n = 0; Object.keys(u).forEach((k) => { out[k] = Math.floor(u[k] * f); n += out[k]; }); if (!n && keepOne) { const k = Object.keys(u).find((x) => u[x] > 0); out[k] = 1; n = 1; } return n ? out : null; }
  function mergeUnits(a, b) { const o = Object.assign({}, a); Object.keys(b).forEach((k) => { o[k] = (o[k] || 0) + b[k]; }); return o; }

  // silhouette path from a geojson feature (MatchHud.hudShape)
  function hudShape(feature) {
    if (!feature) return null;
    const polys = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const rings = polys.map((p) => p[0]);
    const all = [].concat.apply([], rings);
    const lons = all.map((c) => c[0]);
    const wrap = Math.max.apply(null, lons) - Math.min.apply(null, lons) > 180;
    const fx = (lon) => (wrap && lon < 0 ? lon + 360 : lon);
    const lat0 = all.reduce((a, c) => a + c[1], 0) / all.length;
    const kx = Math.cos((lat0 * Math.PI) / 180);
    const pts = rings.map((r) => r.map((c) => [fx(c[0]) * kx, -c[1]]));
    const flat = [].concat.apply([], pts);
    const minX = Math.min.apply(null, flat.map((p) => p[0])), maxX = Math.max.apply(null, flat.map((p) => p[0]));
    const minY = Math.min.apply(null, flat.map((p) => p[1])), maxY = Math.max.apply(null, flat.map((p) => p[1]));
    const s = 92 / Math.max(maxX - minX, maxY - minY);
    const ox = (100 - (maxX - minX) * s) / 2, oy = (100 - (maxY - minY) * s) / 2;
    return pts.map((r) => 'M' + r.map((p) => ((p[0] - minX) * s + ox).toFixed(1) + ' ' + ((p[1] - minY) * s + oy).toFixed(1)).join('L') + 'Z').join('');
  }

  // =================== STATE ===================
  const S = {
    scenario: 'attack', mode: 'build', selected: 'SWE', lens: 'political',
    day: D.DAY, secs: 7,
    players: D.players.map((p) => Object.assign({}, p, { lands: p.lands.slice() })),
    queue: D.buildingsHere.map((b) => Object.assign({}, b, { country: 'SWE' })),
    events: D.events.slice(),
    chat: D.chat.slice(),
    armies: [],
    tech: D.TECH.map((x) => Object.assign({}, x, { startDay: D.DAY })),
    training: (D.training || []).slice(),
    proposals: {},
    occupied: {},
    scars: {},
    toasts: [],
    chatTab: 'feed', chatScope: 'all',
    geo: null, geoReady: false,
  };
  let BROKE = false;
  // Never return undefined: live data only has `scenarios.live`, and the first render in
  // boot() runs before S.scenario is switched to 'live', so fall back through live/calm/any.
  const sc = () => { const s = D.scenarios[S.scenario] || D.scenarios.live || D.scenarios.calm || Object.values(D.scenarios)[0] || {}; return BROKE ? Object.assign({}, s, { res: { food: 0, energy: 0, minerals: 0, gold: 0, oil: 0, research: 0 } }) : s; };
  const me = () => S.players.find((p) => p.me);
  let globe = null;

  // Weighted world share (window.__HUD_W) over all countries — pop + land slots.
  function computeShares(props) {
    let P = 0, L = 0; Object.values(props).forEach((p) => { P += p.pop; L += p.land_slots; });
    const W = {}; Object.keys(props).forEach((c) => { W[c] = 0.5 * props[c].pop / P + 0.5 * props[c].land_slots / L; });
    window.__HUD_W = W;
  }
  const allPlayers = () => S.players.map((p) => Object.assign({}, p, { share: window.__HUD_W ? p.lands.reduce((s, c) => s + (window.__HUD_W[c] || 0), 0) : null }));

  const ownerOf = (code) => allPlayers().find((p) => p.lands.includes(code)) || null;
  const cname = (c) => (S.geo && S.geo.props[c] ? S.geo.props[c].name : c);
  const isFriendlyLand = (c) => { const o = ownerOf(c); return !!o && (o.me || o.diplo === 'allied'); };
  const alliedIds = () => new Set(allPlayers().filter((p) => p.diplo === 'allied').map((p) => p.id));
  const warIds = () => new Set(allPlayers().filter((p) => p.diplo === 'war').map((p) => p.id));

  // ---- number/geo helpers for planning (faithful ports)
  const defUnits = (u) => Object.keys(u).reduce((s, k) => s + u[k] * (D.UNITS[k].defence || 0), 0);
  const stackSpeed = (u) => Math.min.apply(null, [9999].concat(Object.keys(u).filter((k) => u[k] > 0 && k !== 'navy' && k !== 'air').map((k) => D.UNITS[k].speed)));
  const landUnits = (u) => Object.keys(u).filter((k) => k !== 'navy' && k !== 'air').reduce((s, k) => s + u[k], 0);
  const winChance = (A, Dv) => { if (Dv <= 0) return 1; let w = 0; for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) if (A * (0.85 + 0.3 * (i + 0.5) / 40) > Dv * (0.85 + 0.3 * (j + 0.5) / 40)) w++; return w / 1600; };
  const hasAccess = (o) => !!o && (o.me || !!D.ACCESS[o.id]);
  const passable = (c) => hasAccess(ownerOf(c));
  const truceLeft = (o) => (o && D.TRUCE_UNTIL[o.id] ? Math.max(0, D.TRUCE_UNTIL[o.id] - S.day) : 0);
  const attackBlock = (o) => (!o || o.me || o.diplo === 'war' ? null : o.diplo === 'allied' ? 'allied' : truceLeft(o) ? 'Truce with ' + o.name + ' · ' + truceLeft(o) + ' days left. Truces can’t be broken.' : 'Declare war on ' + o.name + ' first (Diplomacy).');
  const garrisonBase = (c) => { const p = S.geo && S.geo.props[c]; if (!p) return 8; return Math.max(3, Math.min(60, Math.round(2 + 2 * Math.sqrt(p.pop / 1e6) + p.land_slots / 4))); };
  const garrisonOf = (c) => { const o = ownerOf(c), base = garrisonBase(c); const g = !o ? base : S.occupied[c] ? 0 : Math.round(base * 0.5); return Math.max(0, g - (S.scars[c] || 0)); };
  const defenceOf = (c) => { const o = ownerOf(c); const st = o ? S.armies.filter((a) => !a.route && a.at === c && a.owner === o.id).reduce((s, a) => s + defUnits(a.units), 0) : 0; return Math.round((garrisonOf(c) + st) * 1.5 * GEO.terrainMult(c)); };

  // fog of war
  function vision() {
    const v = new Set();
    if (!S.geoReady) return v;
    const seed = [], al = alliedIds(), m = me();
    allPlayers().forEach((p) => { if (p.me || al.has(p.id)) seed.push.apply(seed, p.lands); });
    S.armies.forEach((a) => { if (a.owner === m.id || al.has(a.owner)) { if (a.route) { seed.push(a.from, a.to); } else seed.push(a.at); } });
    seed.forEach((c) => { v.add(c); GEO.neighbors(c).forEach((n) => v.add(n)); });
    return v;
  }
  const seen = (c, vis) => (vis || vision()).has(c);
  const fogged = (c) => { const o = ownerOf(c); return !!o && !o.me && !seen(c); };

  // =================== REGIONS ===================

  function IdentityPlate() {
    const m = me(), s = sc();
    const shape = S.geo ? hudShape(S.geo.feats[m.country]) : null;
    const pop = s.fed ? m.pop : m.pop * 0.985;
    const territories = m.lands.length;
    const inner = `<div style="display:flex;gap:12px;align-items:center">`
      + `<div class="iap-tip" data-tip="identity" data-place="bottom" style="width:68px;height:68px;border-radius:12px;flex-shrink:0;display:grid;place-items:center;cursor:help;background:radial-gradient(circle at 50% 30%, color-mix(in oklab, ${m.color} 40%, #0a0e1a), #0a0e1a 80%);border:2px solid ${m.color};box-shadow:0 3px 0 rgba(0,0,0,.45), 0 0 20px color-mix(in oklab, ${m.color} 45%, transparent), inset 0 1px 0 rgba(255,255,255,.2)">${Silhouette(shape, m.color, 54)}</div>`
      + `<div style="min-width:0;flex:1">`
      + Eyebrow(esc(m.title), 'var(--gold-300)')
      + `<div style="margin-top:4px;font:italic 900 30px/.92 var(--font-display);text-transform:uppercase;color:#fff;text-shadow:var(--text-shadow-display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.name)}</div>`
      + `<div style="display:flex;align-items:center;gap:5px;margin-top:6px;font:500 12px/1 var(--font-body);color:var(--text-muted)"><i class="ph-fill ph-star" style="color:var(--gold-400)"></i>${esc(S.geo ? S.geo.props[m.country].name : 'Sweden')}<span>·</span><i class="ph-fill ph-map-trifold"></i>${territories} lands</div>`
      + `</div></div>`
      + `<div style="display:flex;align-items:center;gap:10px;margin-top:12px">`
      + `<div class="iap-tip" data-tip="pop" data-place="bottom" style="flex:1;cursor:help">`
      + `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;font:500 11px/1 var(--font-body);color:var(--text-muted)"><span><i class="ph-fill ph-users-three" style="margin-right:4px"></i><b style="font:italic 800 16px/1 var(--font-display);color:#fff">${hudNum(pop)}</b> / ${hudNum(m.popCap)}</span>`
      + `<span style="color:${s.fed ? 'var(--green-300)' : 'var(--red-300)'};font-weight:600">${s.fed ? '+1.0% / day' : '−1.5% / day'}</span></div>`
      + Meter(pop, m.popCap, s.fed ? 'var(--green-500)' : 'var(--red-500)', 7)
      + `</div>`
      + `<div class="iap-tip" data-tip="${s.fed ? 'fed' : 'starving'}" data-place="bottom" style="cursor:help">${UI.badge({ kind: s.fed ? 'ready' : 'danger', icon: s.fed ? 'grains' : 'warning', children: s.fed ? 'Fed' : 'Starving' })}</div>`
      + `</div>`;
    return `<section class="panel" style="position:absolute;top:14px;left:14px;width:300px"><div class="panel__body" style="padding:12px">${inner}</div></section>`;
  }

  function WorldClock() {
    const players = allPlayers();
    const total = D.TOTAL, victory = D.VICTORY, tickSec = D.TICK_SEC;
    const sh = (p) => (p.share != null ? p.share : p.lands.length / total);
    const ranked = players.slice().sort((a, b) => sh(b) - sh(a));
    const m = players.find((p) => p.me), leader = ranked[0];
    const pct = (p) => (sh(p) * 100).toFixed(1) + '%';
    const clockRow = `<div class="iap-tip" data-tip="day" data-place="bottom" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:10px;cursor:help;width:fit-content;margin-left:auto;margin-right:auto">`
      + `<span id="clk-ring">${Ring(1 - S.secs / tickSec, 42, 5, 'var(--gold-400)', `<i class="ph-fill ph-sun" style="font-size:18px;color:var(--gold-300)"></i>`)}</span>`
      + `<div style="padding:7px 18px;border-radius:8px;background:var(--grad-gold);transform:skewX(var(--skew));box-shadow:inset 0 2px 0 rgba(255,255,255,.5), 0 4px 0 var(--gold-700), 0 8px 18px rgba(0,0,0,.35)"><div style="transform:skewX(calc(var(--skew) * -1));font:italic 900 30px/1 var(--font-display);text-transform:uppercase;color:var(--gold-900);letter-spacing:.02em">Day <span id="clk-day">${S.day}</span></div></div>`
      + `<div style="font:500 12px/1.3 var(--font-body);color:var(--text-muted);width:70px">next day<br><b style="font:italic 800 18px/1 var(--font-display);color:#fff">0:<span id="clk-secs">${String(S.secs).padStart(2, '0')}</span></b></div>`
      + `</div>`;
    const segs = ranked.map((p, i) => `<div style="width:${sh(p) * 100}%;background:linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 60%), ${p.color};border-right:2px solid var(--navy-950);border-radius:${i === 0 ? '999px 0 0 999px' : '0'};box-shadow:${p.me ? 'inset 0 0 0 2px #fff' : 'none'}"></div>`).join('');
    const panel = `<div class="iap-tip" data-tip="world" data-place="bottom" style="cursor:help"><section class="panel"><div class="panel__body" style="padding:10px 14px">`
      + `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">${Eyebrow('World control', '#fff')}<span style="display:inline-flex;align-items:center;gap:4px;font:italic 800 13px/1 var(--font-display);text-transform:uppercase;color:var(--gold-300);letter-spacing:.04em"><i class="ph-fill ph-trophy"></i>Victory at ${Math.round(victory * 100)}%</span></div>`
      + `<div style="position:relative;height:14px;border-radius:999px;background:var(--navy-950);box-shadow:inset 0 1px 2px rgba(0,0,0,.6);display:flex;overflow:visible">${segs}<div style="position:absolute;left:${victory * 100}%;top:-5px;bottom:-5px;width:3px;margin-left:-1px;background:var(--gold-300);border-radius:2px;box-shadow:0 0 10px rgba(245,185,66,.9)"></div></div>`
      + `<div style="display:flex;justify-content:space-between;margin-top:8px;font:500 12px/1 var(--font-body);color:var(--text-muted)"><span><span style="color:${m.color};font-weight:700">You</span> ${pct(m)} · ${m.lands.length} lands</span><span>Leader <b style="color:${leader.color}">${esc(leader.name)}</b> ${pct(leader)}</span></div>`
      + `</div></section></div>`;
    return `<div style="position:absolute;top:14px;left:50%;transform:translateX(-50%);width:500px">${clockRow}${panel}</div>`;
  }

  function Treasury() {
    const s = sc(), eff = Math.round(s.efficiency * 100);
    const cells = Object.keys(HUD_RES).map((k) => {
      const m = HUD_RES[k], d = s.delta[k], empty = s.res[k] <= 0;
      return `<div class="iap-tip" data-tip="res:${k}" data-place="bottom" style="cursor:help;display:flex;align-items:center;gap:7px;padding:6px 8px 6px 6px;border-radius:10px;background:${empty ? 'rgba(230,25,75,.12)' : 'var(--navy-850)'};box-shadow:${empty ? 'inset 0 0 0 1px var(--red-800)' : 'var(--shadow-inset-well)'}">`
        + `<span style="width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;background:color-mix(in oklab, ${m.color} 20%, transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)"><i class="ph-fill ph-${m.icon}" style="font-size:16px;color:${m.color};filter:drop-shadow(0 1px 0 rgba(0,0,0,.5))"></i></span>`
        + `<div style="min-width:0"><div style="font:700 20px/1 var(--font-num);color:${empty ? 'var(--red-300)' : '#fff'};font-variant-numeric:tabular-nums;text-shadow:0 1px 0 rgba(0,0,0,.4)">${hudNum(s.res[k])}</div>`
        + `<div style="margin-top:2px;font:600 11px/1 var(--font-body);color:${d >= 0 ? 'var(--green-300)' : 'var(--red-300)'};font-variant-numeric:tabular-nums">${d >= 0 ? '+' : '−'}${Math.abs(d)}<span style="color:var(--text-muted);font-weight:400">/day</span></div></div></div>`;
    }).join('');
    const grid = `<div class="iap-tip" data-tip="grid" data-place="bottom" style="display:flex;align-items:center;gap:8px;margin-top:9px;padding:0 2px;cursor:help"><i class="ph-fill ph-plug" style="font-size:14px;color:${eff < 100 ? 'var(--red-300)' : 'var(--res-energy)'}"></i>${Eyebrow('Power grid')}<div style="flex:1">${Meter(s.efficiency, 1, eff < 100 ? 'var(--red-500)' : 'var(--res-energy)', 6)}</div><span style="font:italic 800 14px/1 var(--font-display);color:${eff < 100 ? 'var(--red-300)' : '#fff'}">${eff}%</span></div>`;
    return `<section class="panel" style="position:absolute;top:14px;right:14px;width:340px"><div class="panel__body" style="padding:10px"><div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:6px">${cells}</div>${grid}</div></section>`;
  }

  function AlertRibbon(alert) {
    if (!alert) return '';
    const war = alert.kind === 'war';
    const btn = UI.button({ size: 'sm', variant: war ? 'default' : 'gold', icon: war ? 'shield' : 'grains', children: war ? 'Defend' : 'Build farm' });
    return `<div id="alert-ribbon" style="position:absolute;top:178px;left:50%;transform:translateX(-50%);animation:iap-toast-in .3s var(--ease-pop)">`
      + `<div style="display:flex;align-items:center;gap:14px;padding:10px 14px 10px 10px;border-radius:10px;transform:skewX(var(--skew));background:${war ? 'var(--grad-danger)' : 'linear-gradient(180deg,#ff9f43 0%,#e8731a 55%,#b4520c 100%)'};box-shadow:inset 0 2px 0 rgba(255,255,255,.35), 0 4px 0 ${war ? '#7a0c27' : '#6b3206'}, 0 12px 30px rgba(0,0,0,.45)">`
      + `<div style="display:flex;align-items:center;gap:12px;transform:skewX(calc(var(--skew) * -1))">`
      + `<span style="width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:rgba(0,0,0,.25);animation:iap-pulse 1.2s ease-in-out infinite"><i class="ph-fill ph-${war ? 'sword' : 'bowl-food'}" style="font-size:24px;color:#fff"></i></span>`
      + `<div><div style="font:italic 900 22px/1 var(--font-display);text-transform:uppercase;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.3)">${esc(alert.title)}</div>`
      + `<div style="margin-top:3px;font:500 13px/1.2 var(--font-body);color:rgba(255,255,255,.92)">${esc(alert.body)}${alert.eta ? ' · arrives Day ' + (S.day + alert.eta) : ''}</div></div>`
      + `<span style="margin-left:6px" data-alert-action>${btn}</span>`
      + `</div></div></div>`;
  }

  function Standings() {
    const players = allPlayers(), total = D.TOTAL;
    const ranked = players.slice().sort((a, b) => b.lands.length - a.lands.length);
    const rows = ranked.map((p, i) => {
      const d = p.me ? null : DIPLO[p.diplo || 'neutral'];
      const sel = p.lands.includes(S.selected);
      const meta = p.me
        ? `<span style="color:var(--teal-300);font-weight:600">You</span>`
        : `<span class="iap-tip" data-tip="diplo:${p.diplo || 'neutral'}" data-place="right" style="display:inline-flex;align-items:center;gap:3px;color:${d.color};font-weight:600;cursor:help"><i class="ph-fill ph-${d.icon}"></i>${d.label}</span>`;
      return `<div data-pick="${p.country}" style="display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:9px;cursor:pointer;background:${p.me ? 'var(--me-tint)' : sel ? 'rgba(255,255,255,.05)' : 'transparent'};box-shadow:${p.me ? 'inset 0 0 0 1px rgba(79,209,197,.3)' : 'none'}">`
        + `<span style="width:18px;text-align:center;font:italic 900 22px/1 var(--font-display);color:${i === 0 ? 'var(--gold-400)' : 'var(--navy-400)'};text-shadow:${i === 0 ? '0 2px 0 var(--gold-800)' : 'none'}">${i + 1}</span>`
        + `<span style="width:6px;height:30px;border-radius:3px;background:${p.color};transform:skewX(var(--skew));box-shadow:inset 0 2px 0 rgba(255,255,255,.4), 0 2px 0 rgba(0,0,0,.4);flex-shrink:0"></span>`
        + `<div style="flex:1;min-width:0"><div style="font:600 14px/1.2 var(--font-body);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</div>`
        + `<div style="display:flex;align-items:center;gap:5px;margin-top:2px;font:400 11px/1 var(--font-body);color:var(--text-muted)">${meta}<span>·</span>${hudNum(p.pop)} pop${p.ai ? `<span style="color:var(--gold-400);font-weight:600">· AI</span>` : ''}</div></div>`
        + `<div style="text-align:right"><div style="font:italic 800 20px/1 var(--font-display);color:#fff">${p.lands.length}</div><div style="font:400 10px/1 var(--font-body);color:var(--text-muted);margin-top:2px">${((p.share != null ? p.share : p.lands.length / total) * 100).toFixed(1)}%</div></div></div>`;
    }).join('');
    const header = `<header class="panel__header"><h2 class="panel__title"><span class="panel__tick"></span>Standings</h2><div class="panel__spacer"></div>${Eyebrow(players.length + ' nations')}</header>`;
    return `<section class="panel" style="position:absolute;top:170px;left:14px;width:300px"><div class="panel__body" style="padding:12px">${header}<div style="display:flex;flex-direction:column;gap:3px">${rows}</div></div></section>`;
  }

  function SectionHead(children, right) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 8px">${Eyebrow(children)}${right || ''}</div>`;
  }

  function CountryHeader(code, used) {
    const props = S.geo.props[code], owner = ownerOf(code), m = me();
    const shape = hudShape(S.geo.feats[code]);
    const occ = S.occupied[code];
    const mine = owner && owner.me, capital = owner && owner.country === code;
    const attrs = [['farmland', 'food'], ['minerals', 'minerals'], ['oil', 'oil']];
    const occBadge = occ ? `<span class="iap-tip" data-tip="occupied" data-place="left" style="cursor:help;display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:999px;background:rgba(245,185,66,.14);box-shadow:inset 0 0 0 1px #6b460c;font:italic 800 11px/1.3 var(--font-display);text-transform:uppercase;color:var(--gold-300)"><i class="ph-fill ph-flag-banner"></i>Occupied · ${occ.unrest}%</span>` : '';
    const ownerLine = owner
      ? `<span style="display:inline-flex;align-items:center;gap:5px;font:600 12px/1 var(--font-body);color:${mine ? 'var(--teal-300)' : '#fff'}"><span style="width:9px;height:9px;border-radius:3px;background:${owner.color}"></span>${mine ? 'Yours' : esc(owner.name)}</span>`
      : `<span style="font:600 12px/1 var(--font-body);color:var(--text-muted)">Neutral · garrison 8</span>`;
    const diploBadge = owner && !mine ? `<span class="iap-tip" data-tip="diplo:${owner.diplo || 'neutral'}" data-place="left" style="cursor:help">${UI.badge({ kind: DIPLO[owner.diplo || 'neutral'].kind, icon: DIPLO[owner.diplo || 'neutral'].icon, children: DIPLO[owner.diplo || 'neutral'].label })}</span>` : '';
    const attrCells = attrs.map(([a, r]) => `<div class="iap-tip" data-tip="attr:${a}" data-place="left" style="cursor:help"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px"><i class="ph-fill ph-${HUD_RES[r].icon}" style="color:${HUD_RES[r].color};font-size:13px"></i><span style="font:italic 800 15px/1 var(--font-display);color:#fff">${props[a]}</span></div>${Meter(props[a], 100, HUD_RES[r].color, 5)}</div>`).join('');
    const slotCell = `<div class="iap-tip" data-tip="attr:slots" data-place="left" style="cursor:help"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px"><i class="ph-fill ph-squares-four" style="color:var(--sky-300);font-size:13px"></i><span style="font:italic 800 15px/1 var(--font-display);color:#fff">${mine ? used + '/' : ''}${props.land_slots}</span></div>${Meter(mine ? used : 0, props.land_slots, 'var(--sky-400)', 5)}</div>`;
    return `<div style="padding:12px;border-radius:12px;background:rgba(6,10,20,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)">`
      + `<div style="display:flex;align-items:center;gap:12px">${Silhouette(shape, owner ? owner.color : 'var(--globe-land)', 46)}`
      + `<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px"><span style="font:italic 900 26px/1 var(--font-display);text-transform:uppercase;color:#fff;text-shadow:var(--text-shadow-display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(props.name)}</span>${capital ? `<i class="ph-fill ph-star" title="Capital" style="color:var(--gold-400);font-size:16px"></i>` : ''}${occBadge}</div>`
      + `<div style="display:flex;align-items:center;gap:6px;margin-top:5px">${ownerLine}${diploBadge}</div></div></div>`
      + `<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-top:12px">${attrCells}${slotCell}</div></div>`;
  }

  function EmptyNote(icon, title, body, action) {
    return `<div style="text-align:center;padding:22px 12px;color:var(--text-muted)"><i class="ph-fill ph-${icon}" style="font-size:34px;color:var(--navy-400)"></i>`
      + `<div style="margin-top:8px;font:italic 800 20px/1 var(--font-display);text-transform:uppercase;color:#fff">${title}</div>`
      + `<div style="margin:6px auto 14px;max-width:240px;font:400 13px/1.4 var(--font-body)">${esc(body)}</div>${action || ''}</div>`;
  }

  function buildYield(type, props) {
    const B = IAP.BUILDINGS[type];
    if (type === 'housing') return [['research', null, '+40M pop cap']];
    const out = [];
    Object.keys(B.produces || {}).forEach((k) => out.push([k, Math.round(B.produces[k] * (B.scale ? props[B.scale] / 50 : 1))]));
    Object.keys(B.consumes || {}).forEach((k) => out.push([k, -B.consumes[k]]));
    return out;
  }

  function BuildTile(type, props, s) {
    const B = IAP.BUILDINGS[type];
    const afford = Object.keys(B.cost).every((k) => (s.res[k] || 0) >= B.cost[k]);
    const y = buildYield(type, props);
    const yieldHtml = y.map(([k, v, txt]) => `<span style="display:inline-flex;align-items:center;gap:2px;color:${txt ? 'var(--sky-300)' : v >= 0 ? HUD_RES[k].color : 'var(--red-300)'}">${txt || ((v >= 0 ? '+' : '−') + Math.abs(v) + `<i class="ph-fill ph-${HUD_RES[k].icon}" style="font-size:11px"></i>`)}</span>`).join('');
    return `<div class="build-tile iap-tip" data-build="${type}" data-tip="build:${type}" data-place="left" data-afford="${afford ? 1 : 0}" style="padding:9px;border-radius:10px;cursor:${afford ? 'pointer' : 'not-allowed'};opacity:${afford ? 1 : 0.5};background:var(--grad-navy);border:1px solid var(--navy-600);box-shadow:0 3px 0 var(--navy-950), inset 0 1px 0 rgba(255,255,255,.06);transition:transform 80ms ease, box-shadow 150ms ease, border-color 150ms ease">`
      + `<div style="display:flex;align-items:center;gap:8px">${Tile(B.icon, B.tone, 32)}`
      + `<div style="min-width:0"><div style="font:600 13px/1.1 var(--font-body);color:#fff;white-space:nowrap">${B.name}</div>`
      + `<div style="display:flex;gap:6px;margin-top:3px;font:700 12px/1 var(--font-num);font-variant-numeric:tabular-nums">${yieldHtml}</div></div></div>`
      + `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">${Cost(B.cost, s.res, 11)}<span style="font:500 11px/1 var(--font-body);color:var(--text-muted)"><i class="ph-fill ph-hourglass"></i> ${B.build_ticks}d</span></div></div>`;
  }

  function BuildPane(props, s) {
    const queue = S.queue.filter((b) => b.country === S.selected);
    const building = queue.filter((b) => b.status === 'building');
    const active = queue.filter((b) => b.status === 'active');
    const counts = {}; active.forEach((b) => { counts[b.type] = (counts[b.type] || 0) + 1; });
    let html = '<div>';
    if (building.length) {
      html += `<div style="margin-bottom:14px">${SectionHead('Under construction')}`;
      building.forEach((b) => {
        const B = IAP.BUILDINGS[b.type];
        const pct = Math.min(1, (S.day - b.started) / (b.complete_at - b.started));
        html += `<div data-queue-item style="display:flex;align-items:center;gap:10px;padding:6px 0">${Tile(B.icon, B.tone, 30)}<div style="flex:1"><div style="display:flex;justify-content:space-between;font:600 13px/1 var(--font-body);color:#fff;margin-bottom:6px"><span>${B.name}</span><span style="color:var(--text-muted);font-weight:500"><i class="ph-fill ph-hourglass"></i> Day ${b.complete_at}</span></div>${Meter(pct, 1, 'var(--gold-400)', 6)}</div></div>`;
      });
      html += `</div>`;
    }
    html += SectionHead('Active here');
    html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">`;
    Object.keys(counts).forEach((t) => {
      html += `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 9px 4px 4px;border-radius:999px;background:var(--navy-850);box-shadow:var(--shadow-inset-well);font:600 12px/1 var(--font-body);color:#fff">${Tile(IAP.BUILDINGS[t].icon, IAP.BUILDINGS[t].tone, 20, 12)}${IAP.BUILDINGS[t].name}<span style="color:var(--text-muted)">×${counts[t]}</span></span>`;
    });
    html += `</div>`;
    html += SectionHead('Construct', `<span style="font:400 11px/1 var(--font-body);color:var(--text-muted)">output for this land</span>`);
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${BUILD_ORDER.map((t) => BuildTile(t, props, s)).join('')}</div></div>`;
    return html;
  }

  // ---- Army planning (port of MatchHud.planFor) ----
  function planFor(target) {
    const m = me(), o = ownerOf(target), block = attackBlock(o);
    const myStatic = S.armies.filter((a) => a.owner === m.id && !a.route);
    const techDone = new Set(S.tech.filter((x) => x.status === 'done').map((x) => x.key));
    const land = [], sea = [];
    myStatic.forEach((a) => {
      if (!landUnits(a.units)) return;
      const path = GEO.landPath(a.at, target, passable);
      const atk = armyStrength(a.units);
      if (path) { const km = GEO.pathKm(path); land.push({ kind: 'land', ok: true, armyId: a.id, srvId: a.srvId, codes: path, km, days: Math.max(1, Math.ceil(km / stackSpeed(a.units))), strength: atk, fromName: cname(a.at), via: path.slice(1, -1).map(cname) }); }
      if (a.units.navy && GEO.coastal(a.at) && GEO.coastal(target)) {
        const cap = a.units.navy * D.UNITS.navy.capacity, need = landUnits(a.units), km = GEO.km(a.at, target) * 1.3;
        sea.push(cap >= need ? { kind: 'sea', ok: true, armyId: a.id, srvId: a.srvId, codes: [a.at, target], km, days: Math.max(1, Math.ceil(km / D.UNITS.navy.speed)), strength: Math.round(atk * 0.75), fromName: cname(a.at), via: [] }
          : { kind: 'sea', ok: false, reason: 'Needs ' + Math.ceil((need - cap) / D.UNITS.navy.capacity) + ' more ships in ' + cname(a.at) + ' (' + cap + '/' + need + ' units).' });
      }
    });
    const pick = (arr) => arr.filter((x) => x.ok).sort((x, y) => x.days - y.days || y.strength - x.strength)[0] || arr[0];
    let blockers = null;
    myStatic.forEach((a) => {
      const gp = GEO.landPath(a.at, target, () => true);
      if (!gp) return;
      const b = gp.slice(1, -1).filter((c) => !passable(c)).map((c) => { const oo = ownerOf(c); return cname(c) + (oo ? (oo.diplo === 'allied' ? ' (ally, no access)' : '') : ' (neutral)'); });
      if (!blockers || b.length < blockers.length) blockers = b;
    });
    const seaReason = !GEO.coastal(target) ? cname(target) + ' is landlocked. It can’t be reached by sea.' : 'Needs a coastal stack with Navy ships (10 units per ship).';
    let invade = [
      pick(land) || (blockers && blockers.length ? { kind: 'land', ok: false, blockers: blockers.slice(0, 3) } : { kind: 'land', ok: false, reason: 'No land connection. Ship by sea or strike from range.' }),
      pick(sea) || { kind: 'sea', ok: false, reason: seaReason },
    ];
    if (block === 'allied' && !hasAccess(o)) invade = invade.map((x) => ({ kind: x.kind, ok: false, reason: 'Needs military access from ' + o.name + ' (Diplomacy).' }));
    else if (block && block !== 'allied') invade = invade.map((x) => ({ kind: x.kind, ok: false, reason: block }));
    const Dv = defenceOf(target), fog = fogged(target);
    invade = invade.map((x) => (x.ok && !fog && block !== 'allied' ? Object.assign({}, x, { odds: winChance(x.strength, Dv) }) : x));

    const Sk = D.STRIKES, strike = [];
    const techName = (k) => (S.tech.find((x) => x.key === k) || {}).name;
    const lockFor = (k) => (techDone.has(k) ? null : 'Research ' + techName(k) + ((S.tech.find((x) => x.key === k) || {}).status === 'active' ? ' (in progress)' : ''));
    const noStrike = block && block !== 'allied' ? block : block === 'allied' ? 'You can’t strike an ally.' : null;
    let lk = lockFor('artillery');
    const art = myStatic.filter((a) => a.units.artillery && GEO.neighbors(a.at).includes(target)).sort((x, y) => y.units.artillery - x.units.artillery)[0];
    strike.push(lk ? { kind: 'artillery', ok: false, locked: true, reason: lk } : noStrike ? { kind: 'artillery', ok: false, reason: noStrike } : art ? { kind: 'artillery', ok: true, sKind: 'artillery', sFrom: art.srvId, from: art.at, to: target, damage: art.units.artillery * Sk.artillery.perUnit, detail: art.units.artillery + ' guns in ' + cname(art.at) + ' · ' + art.units.artillery + ' minerals' } : { kind: 'artillery', ok: false, reason: 'No artillery in a country that borders ' + cname(target) + '.' });
    lk = lockFor('air');
    const air = myStatic.filter((a) => a.units.air && GEO.km(a.at, target) <= Sk.air.rangeKm).sort((x, y) => y.units.air - x.units.air)[0];
    strike.push(lk ? { kind: 'air', ok: false, locked: true, reason: lk } : noStrike ? { kind: 'air', ok: false, reason: noStrike } : air ? { kind: 'air', ok: true, sKind: 'air', sFrom: air.srvId, from: air.at, to: target, damage: air.units.air * Sk.air.perUnit, detail: air.units.air + ' planes from ' + cname(air.at) + ' · ' + Math.round(GEO.km(air.at, target)) + ' km' } : { kind: 'air', ok: false, reason: myStatic.some((a) => a.units.air) ? 'Out of range (1 500 km).' : 'Train planes in Army mode first.' });
    const dist = GEO.km(m.country, target);
    const tiers = ['srbm', 'mrbm', 'icbm'].filter((k) => techDone.has(k));
    const inRange = tiers.filter((k) => Sk[k].rangeKm >= dist);
    const ready = inRange.find((k) => D.ARSENAL[k] > 0);
    strike.push(!tiers.length ? { kind: 'missile', ok: false, locked: true, reason: 'Research Short-range missiles' } : noStrike ? { kind: 'missile', ok: false, reason: noStrike } : ready ? { kind: 'missile', ok: true, sKind: ready, from: m.country, to: target, damage: Sk[ready].damage, detail: Sk[ready].name + ' · ' + D.ARSENAL[ready] + ' in stock' } : { kind: 'missile', ok: false, reason: !inRange.length ? 'Out of range (' + Math.round(dist) + ' km). Research longer-range missiles.' : 'No ' + Sk[inRange[0]].name.toLowerCase() + 's built.' });
    lk = lockFor('nukes');
    strike.push(lk ? { kind: 'nuke', ok: false, locked: true, reason: lk + ' · 60 000 gold · 5 Labs' } : { kind: 'nuke', ok: false, reason: 'No warhead built (15 000 gold, 10 days).' });
    return { invade, strike };
  }

  function armyCtx() {
    const code = S.selected, m = me(), o = ownerOf(code), mine = !!o && o.me;
    const vis = vision();
    const visibleArmies = S.armies.filter((a) => a.owner === m.id || alliedIds().has(a.owner) || (a.route ? seen(a.from, vis) || seen(a.to, vis) : seen(a.at, vis)));
    const inArmyHostile = !mine;
    const plan = inArmyHostile ? planFor(code) : { invade: [], strike: [] };
    return {
      mine, allied: !!o && !o.me && o.diplo === 'allied',
      stacks: S.armies.filter((a) => !a.route && a.at === code && a.owner === m.id),
      incoming: visibleArmies.filter((a) => a.route && a.to === code && a.owner !== m.id).map((a) => Object.assign({}, a, { ownerName: (allPlayers().find((p) => p.id === a.owner) || {}).name })),
      defence: defenceOf(code), fogged: fogged(code),
      enemyHere: S.armies.filter((a) => !a.route && a.at === code && a.owner !== m.id),
      neighbors: GEO.neighbors(code).filter((c) => S.geo.props[c]).map((c) => {
        const no = ownerOf(c), fr = passable(c), here = S.armies.find((a) => !a.route && a.at === code && a.owner === m.id), blk = fr ? null : attackBlock(no);
        return { code: c, name: cname(c), mine: !!no && no.me, friendly: fr, ownerName: no ? (no.me ? 'Yours' : no.name) : null, ownerColor: no ? no.color : null, def: fr ? null : fogged(c) ? null : defenceOf(c), days: here ? Math.max(1, Math.ceil(GEO.pathKm([code, c]) / stackSpeed(here.units))) : 1, blocked: blk === 'allied' ? 'Needs military access' : blk };
      }).sort((a, b) => a.friendly - b.friendly),
      plan,
      manpower: { used: S.armies.filter((a) => a.owner === m.id).reduce((s, a) => s + armyCount(a.units), 0), limit: Math.floor(m.pop * 0.01 / 1000) },
      upkeep: S.armies.filter((a) => a.owner === m.id).reduce((s, a) => { Object.keys(a.units).forEach((k) => { const u = D.UNITS[k].upkeep || {}; Object.keys(u).forEach((r) => { s[r] = (s[r] || 0) + u[r] * a.units[k]; }); }); return s; }, {}),
      terrain: GEO.terrain(code),
      training: S.training.filter((x) => x.at === code), slots: slotsAt(code),
      techDone: new Set(S.tech.filter((x) => x.status === 'done').map((x) => x.key)),
    };
  }
  const slotsAt = (c) => 1 + S.queue.filter((b) => b.country === c && b.type === 'factory' && b.status === 'active').length;

  function FogNote(name) {
    return `<div class="iap-tip" data-tip="fog" data-place="left" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 8px, transparent 8px 16px), rgba(6,10,20,.5);box-shadow:inset 0 0 0 1px var(--navy-600);cursor:help"><i class="ph-fill ph-eye-slash" style="font-size:22px;color:var(--navy-300)"></i><div><div style="font:italic 800 15px/1 var(--font-display);text-transform:uppercase;color:#fff">Hidden by fog of war</div><div style="margin-top:3px;font:400 12px/1.35 var(--font-body);color:var(--text-muted)">Move troops next to ${esc(name)} to scout its defence.</div></div></div>`;
  }

  function RouteRow(opt, def, friendly) {
    const t = TIPS.route[opt.kind];
    const icon = { land: 'person-simple-run', sea: 'boat', air: 'airplane-tilt' }[opt.kind];
    const tileTone = ROUTE_COLOR[opt.kind] === '#7fe6dc' ? 'var(--teal-600)' : opt.kind === 'sea' ? 'var(--sky-500)' : '#8a63c4';
    let mid;
    if (opt.ok) mid = `<div style="margin-top:3px;font:400 11px/1.3 var(--font-body);color:var(--text-muted)">${'from ' + esc(opt.fromName) + (opt.via.length ? ' via ' + opt.via.map(esc).join(', ') : '') + ' · ' + Math.round(opt.km).toLocaleString('sv-SE') + ' km'}</div>`;
    else if (opt.blockers) mid = `<div class="iap-tip" data-tip="blocked" data-place="left" style="margin-top:3px;font:400 11px/1.3 var(--font-body);color:var(--red-300);cursor:help"><i class="ph-fill ph-prohibit"></i> Blocked by ${opt.blockers.map(esc).join(', ')}</div>`;
    else mid = `<div style="margin-top:3px;font:400 11px/1.3 var(--font-body);color:var(--text-muted)">${esc(opt.reason)}</div>`;
    const strengthCol = opt.ok ? `<div class="iap-tip" data-tip="odds" data-place="left" style="text-align:right;cursor:help"><div style="font:italic 800 16px/1 var(--font-display);color:#fff">${opt.strength}</div>${opt.odds != null ? `<div style="margin-top:2px;font:700 11px/1 var(--font-body);color:${opt.odds >= 0.65 ? 'var(--green-300)' : opt.odds >= 0.35 ? 'var(--gold-300)' : 'var(--red-300)'}">${Math.round(opt.odds * 100)}%</div>` : ''}</div>` : '';
    const btnInner = UI.button({ size: 'sm', variant: !opt.ok ? 'default' : friendly ? 'primary' : 'danger', disabled: !opt.ok, children: friendly ? 'Move' : 'Attack' });
    const btn = opt.ok ? `<span data-move="${opt.armyId}|${S.selected}|${opt.kind}" style="display:contents">${btnInner}</span>` : btnInner;
    return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);opacity:${opt.ok ? 1 : 0.5}">`
      + `<span class="iap-tip" data-tip="route:${opt.kind}" data-place="left" style="cursor:help">${Tile(icon, tileTone, 30)}</span>`
      + `<div style="flex:1;min-width:0"><div style="font:600 13px/1.15 var(--font-body);color:#fff">${t.title}${opt.ok ? ' · ' + opt.days + (opt.days === 1 ? ' day' : ' days') : ''}</div>${mid}</div>${strengthCol}${btn}</div>`;
  }

  function StrikeRow(s) {
    const t = TIPS.strike[s.kind], nuke = s.kind === 'nuke';
    const btnInner = UI.button({ size: 'sm', variant: s.ok ? (nuke ? 'danger' : 'gold') : 'default', disabled: !s.ok, icon: s.ok ? 'fire' : undefined, children: 'Strike' });
    const btn = s.ok ? `<span data-strike="${s.sKind}|${s.sFrom || ''}" style="display:contents">${btnInner}</span>` : btnInner;
    return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);opacity:${s.ok ? 1 : 0.55}">`
      + `<span class="iap-tip" data-tip="strike:${s.kind}" data-place="left" style="cursor:help">${Tile(t.icon, nuke ? 'linear-gradient(180deg,#ff9f43,#b4520c)' : t.tone, 30)}</span>`
      + `<div style="flex:1;min-width:0"><div style="font:600 13px/1.15 var(--font-body);color:${nuke ? 'var(--gold-300)' : '#fff'}">${t.title}</div>`
      + `<div style="margin-top:3px;display:flex;align-items:center;gap:4px;font:400 11px/1.3 var(--font-body);color:${s.ok ? 'var(--text-muted)' : s.locked ? 'var(--navy-300)' : 'var(--red-300)'}">${s.locked ? '<i class="ph-fill ph-lock"></i>' : ''}${esc(s.ok ? s.detail : s.reason)}</div></div>`
      + `${s.ok ? `<span style="font:italic 800 16px/1 var(--font-display);color:var(--gold-300)">−${s.damage}</span>` : ''}${btn}</div>`;
  }

  function ArmyPane() {
    const props = S.geo.props[S.selected], a = armyCtx(), s = sc();
    const { mine, allied, stacks, incoming, neighbors, plan, defence, fogged: fog, enemyHere, techDone } = a;
    if (allied) {
      return `<div>${SectionHead('Reinforce ' + esc(props.name))}<div style="margin-bottom:12px;font:400 12px/1.45 var(--font-body);color:var(--text-muted)">Allied land. Your troops can pass through it and help defend it; they never fight your ally.</div>`
        + SectionHead('Routes', `<span style="font:400 11px/1 var(--font-body);color:var(--text-muted)">hover to preview route</span>`)
        + plan.invade.map((o) => RouteRow(o, null, true)).join('') + `</div>`;
    }
    if (!mine) {
      const best = plan.invade.filter((o) => o.ok).sort((x, y) => y.strength - x.strength)[0];
      const defBox = `<div style="padding:12px;border-radius:12px;background:rgba(230,25,75,.08);box-shadow:inset 0 0 0 1px var(--red-800);margin-bottom:12px"><div style="display:flex;align-items:center;justify-content:space-around">`
        + `<div style="text-align:center">${Eyebrow('Your attack')}<div style="font:italic 900 40px/1 var(--font-display);color:var(--teal-300);margin-top:4px">${best ? best.strength : 0}</div></div>`
        + `<span style="font:italic 900 22px/1 var(--font-display);color:var(--text-muted)">VS</span>`
        + `<div style="text-align:center">${Eyebrow('Defence')}${fog ? `<div class="iap-tip" data-tip="fog" data-place="left" style="cursor:help;display:flex;align-items:center;gap:4px;justify-content:center;font:italic 900 40px/1 var(--font-display);color:var(--navy-300);margin-top:4px">?<i class="ph-fill ph-eye-slash" style="font-size:18px"></i></div>` : `<div style="font:italic 900 40px/1 var(--font-display);color:var(--red-300);margin-top:4px">${defence}</div>`}</div></div>`
        + (!fog && best && best.odds != null ? `<div class="iap-tip" data-tip="odds" data-place="left" style="cursor:help;text-align:center;margin-top:8px;font:600 12px/1.3 var(--font-body);color:${best.odds >= 0.65 ? 'var(--green-300)' : best.odds >= 0.35 ? 'var(--gold-300)' : 'var(--red-300)'}">Win chance ${Math.round(best.odds * 100)}% · defenders ×1.5${a.terrain !== 'plains' ? ' · ' + a.terrain + ' ×' + GEO.terrainMult(S.selected) : ''}</div>` : '')
        + `</div>`;
      const spotted = fog ? `<div style="margin-bottom:12px">${FogNote(props.name)}</div>` : enemyHere.length ? `<div style="margin-bottom:12px;font:400 12px/1.4 var(--font-body);color:var(--text-muted)">Spotted here: <b style="color:#fff">${enemyHere.map((st) => armyList(st.units)).join(' + ')}</b></div>` : '';
      return `<div>${SectionHead('Attack ' + esc(props.name))}${defBox}${spotted}`
        + SectionHead('Invade', `<span style="font:400 11px/1 var(--font-body);color:var(--text-muted)">hover to preview route</span>`)
        + plan.invade.map((o) => RouteRow(o, fog ? null : defence, false)).join('')
        + SectionHead(`<span style="display:block;margin-top:12px">Strike from range</span>`, `<span class="iap-tip" data-tip="strikeRule" data-place="left" style="display:inline-flex;align-items:center;gap:4px;font:400 11px/1 var(--font-body);color:var(--text-muted);cursor:help"><i class="ph-fill ph-info"></i>can’t capture land</span>`)
        + plan.strike.map((st) => StrikeRow(st)).join('') + `</div>`;
    }
    const here = stacks[0], strength = here ? armyStrength(here.units) : 0;
    let html = '<div>';
    if (incoming.length) {
      html += `<div style="padding:10px;border-radius:10px;margin-bottom:12px;background:rgba(230,25,75,.12);box-shadow:inset 0 0 0 1px var(--red-800)">`;
      incoming.forEach((mv) => {
        html += `<div style="display:flex;align-items:center;gap:8px"><i class="ph-fill ph-warning" style="font-size:18px;color:var(--red-300);animation:iap-pulse 1s ease-in-out infinite"></i><div style="flex:1;font:500 12px/1.35 var(--font-body);color:#fff"><b>${esc(mv.ownerName)}</b> · ${armyList(mv.units)} · arrives Day ${mv.arriveDay}</div><span style="font:italic 800 15px/1 var(--font-display);color:${armyStrength(mv.units) >= defence ? 'var(--red-300)' : 'var(--green-300)'}">${armyStrength(mv.units)} vs ${defence}</span></div>`;
      });
      html += `<div style="margin-top:6px;font:400 11px/1.3 var(--font-body);color:var(--text-muted)">Your defence here is ${defence} (garrison 4 + troops). Reinforce from a neighbouring land.</div></div>`;
    }
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">`
      + `<div class="iap-tip" data-tip="manpower" data-place="left" style="cursor:help;padding:8px;border-radius:10px;background:var(--navy-850);box-shadow:var(--shadow-inset-well)"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">${Eyebrow('Manpower')}<span style="font:italic 800 14px/1 var(--font-display);color:#fff">${a.manpower.used}/${a.manpower.limit}</span></div>${Meter(a.manpower.used, a.manpower.limit, a.manpower.used / a.manpower.limit > 0.9 ? 'var(--red-500)' : 'var(--sky-400)', 5)}</div>`
      + `<div class="iap-tip" data-tip="upkeep" data-place="left" style="cursor:help;padding:8px;border-radius:10px;background:var(--navy-850);box-shadow:var(--shadow-inset-well)">${Eyebrow('Upkeep / day', undefined, 'margin-bottom:5px')}<div style="display:flex;gap:7px;font:700 12px/1 var(--font-num);color:var(--red-300)">${Object.keys(a.upkeep).map((r) => `<span style="display:inline-flex;align-items:center;gap:2px"><i class="ph-fill ph-${HUD_RES[r].icon}" style="color:${HUD_RES[r].color};font-size:11px"></i>${a.upkeep[r]}</span>`).join('')}</div></div></div>`;
    html += SectionHead('Forces here', `<span class="iap-tip" data-tip="strength" data-place="left" style="font:italic 800 14px/1 var(--font-display);color:var(--teal-300);text-transform:uppercase;cursor:help">Strength ${strength}</span>`);
    html += `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:14px">`;
    Object.keys(D.UNITS).forEach((u) => {
      const n = here ? here.units[u] || 0 : 0;
      html += `<div class="iap-tip" data-tip="unit:${u}" data-place="left" style="cursor:help;text-align:center;padding:8px 4px;border-radius:10px;background:var(--navy-850);box-shadow:var(--shadow-inset-well);opacity:${n ? 1 : 0.5}"><i class="ph-fill ph-${D.UNITS[u].icon}" style="font-size:20px;color:${n ? '#fff' : 'var(--navy-400)'}"></i><div style="font:italic 900 20px/1 var(--font-display);color:#fff;margin-top:4px">${n}</div><div style="font:500 10px/1 var(--font-body);color:var(--text-muted);margin-top:2px;white-space:nowrap">${D.UNITS[u].name.replace('Air Force', 'Air')}</div></div>`;
    });
    html += `</div>`;
    html += SectionHead('Train', `<span style="font:400 11px/1 var(--font-body);color:var(--text-muted)">${a.training.length}/${a.slots} slots busy · batches of 5</span>`);
    a.training.forEach((x) => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:6px;border-radius:8px;background:rgba(63,162,255,.1);box-shadow:inset 0 0 0 1px var(--sky-800);font:500 12px/1 var(--font-body);color:#fff"><i class="ph-fill ph-${D.UNITS[x.u].icon}" style="font-size:14px"></i>5 ${D.UNITS[x.u].name.toLowerCase()}<span style="flex:1"></span><span style="color:var(--sky-300);animation:iap-pulse 1.6s ease-in-out infinite"><i class="ph-fill ph-hourglass"></i> Day ${x.ready}</span></div>`;
    });
    Object.keys(D.UNITS).forEach((u) => {
      const U = D.UNITS[u];
      const afford = Object.keys(U.cost).every((k) => (s.res[k] || 0) >= U.cost[k] * 5);
      const locked = U.tech && !techDone.has(U.tech);
      const atkLabel = U.attack ? 'ATK ' + U.attack : U.capacity ? 'CARRIES ' + U.capacity : 'STRIKE ' + U.strike;
      const costOrLock = locked ? `<span style="display:inline-flex;align-items:center;gap:4px;font:500 11px/1 var(--font-body);color:var(--navy-300)"><i class="ph-fill ph-lock"></i>Research ${U.name} first</span>` : Cost(U.cost, s.res, 11);
      const btn = UI.button({ size: 'sm', variant: afford && !locked ? 'primary' : 'default', disabled: !afford || locked, children: '×5' });
      html += `<div data-train="${u}" style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);opacity:${locked ? 0.55 : 1}">${Tile(U.icon, 'var(--navy-500)', 30)}<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;font:600 13px/1 var(--font-body);color:#fff">${U.name}<span style="font:italic 800 12px/1 var(--font-display);color:var(--red-300)">${atkLabel}</span><span style="font:500 11px/1 var(--font-body);color:var(--text-muted)"><i class="ph-fill ph-hourglass"></i> ${U.build_ticks}d</span></div><div style="margin-top:4px">${costOrLock}</div></div>${btn}</div>`;
    });
    html += SectionHead(`<span style="display:block;margin-top:10px">Send forces</span>`);
    neighbors.forEach((n) => {
      let metaRight;
      if (n.blocked) metaRight = `<span class="iap-tip" data-tip="cantattack:${esc(n.blocked)}" data-place="left" style="cursor:help;font:500 11px/1 var(--font-body);color:var(--navy-300);display:inline-flex;align-items:center;gap:4px"><i class="ph-fill ph-prohibit"></i>${n.blocked.indexOf('Truce') === 0 ? 'Truce' : n.blocked.indexOf('access') >= 0 ? 'No access' : 'Not at war'}</span>`;
      else { const nb = UI.button({ size: 'sm', variant: n.friendly ? 'ghost' : 'danger', disabled: !here, children: n.friendly ? 'Move' : 'Attack' }); metaRight = here ? `<span data-move="${here.id}|${n.code}|land" style="display:contents">${nb}</span>` : nb; }
      const defPart = !n.friendly ? (n.def == null ? `<span class="iap-tip" data-tip="fog" data-place="left" style="display:inline-flex;align-items:center;gap:2px;cursor:help">?<i class="ph-fill ph-eye-slash"></i></span>` : n.def) : '';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;font:600 13px/1.1 var(--font-body);color:#fff">${n.ownerColor ? `<span style="width:8px;height:8px;border-radius:2px;background:${n.ownerColor}"></span>` : ''}${esc(n.name)}</div>`
        + `<div style="display:flex;align-items:center;gap:4px;font:400 11px/1.3 var(--font-body);color:${n.friendly ? 'var(--teal-300)' : 'var(--red-300)'}">${n.friendly ? (n.mine ? 'Yours' : 'Allied') + ' · reinforce' : esc(n.ownerName || 'Neutral') + ' · ' + strength + ' vs '}${defPart}<span style="color:var(--text-muted)">· ${n.days} ${n.days === 1 ? 'day' : 'days'}</span></div></div>${metaRight}</div>`;
    });
    html += '</div>';
    return html;
  }

  // ---- Research pane ----
  function techState(tech, list, s, labs) {
    if (tech.status === 'done') return { kind: 'done' };
    if (tech.status === 'active') return { kind: 'active' };
    const missing = (tech.requires || []).filter((k) => (list.find((x) => x.key === k) || {}).status !== 'done').map((k) => list.find((x) => x.key === k).name);
    if (missing.length) return { kind: 'locked', reason: 'Requires ' + missing.join(', ') };
    if (tech.labs && labs < tech.labs) return { kind: 'locked', reason: 'Requires ' + tech.labs + ' Research Labs (you have ' + labs + ')' };
    const busy = list.find((x) => x.status === 'active');
    if (busy) return { kind: 'queued', reason: 'Finish ' + busy.name + ' first' };
    const short = Object.keys(tech.cost).filter((k) => (s.res[k] || 0) < tech.cost[k]);
    if (short.length) return { kind: 'poor', reason: 'Not enough ' + short.map((k) => HUD_RES[k].label.toLowerCase()).join(' and ') };
    return { kind: 'ready' };
  }

  function TechCard(tech, st, progress, daysLeft, last, s) {
    const nuke = tech.danger;
    const chip = { done: ['ready', 'check', 'Researched'], active: ['host', 'hourglass', 'Researching'], locked: ['default', 'lock', 'Locked'], queued: ['default', 'clock', 'Waiting'], poor: ['danger', 'coins', 'Can’t afford'], ready: ['ai', 'flask', 'Available'] }[st.kind];
    const iconBg = st.kind === 'done' ? 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), var(--teal-600)' : nuke ? 'linear-gradient(180deg,#ff9f43,#b4520c)' : 'var(--navy-750)';
    const left = `<div style="display:flex;flex-direction:column;align-items:center;width:34px;flex-shrink:0">`
      + `<span class="iap-tip" data-tip="tech:${tech.key}" data-place="left" style="cursor:help;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:${iconBg};box-shadow:inset 0 1px 0 rgba(255,255,255,.3), 0 3px 0 rgba(0,0,0,.4);border:${st.kind === 'active' ? '2px solid var(--sky-300)' : '0'}"><i class="ph-fill ph-${tech.icon}" style="font-size:19px;color:${st.kind === 'locked' || st.kind === 'queued' ? 'var(--navy-300)' : '#fff'}"></i></span>`
      + (!last ? `<span style="flex:1;width:3px;min-height:14px;margin:4px 0;border-radius:2px;background:${st.kind === 'done' ? 'var(--teal-400)' : 'var(--navy-600)'}"></span>` : '')
      + `</div>`;
    let detail;
    if (st.kind === 'active') detail = `<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;margin-bottom:5px;font:600 11px/1 var(--font-body);color:var(--sky-300)"><span>${Math.round(progress * 100)}%</span><span style="color:var(--text-muted)">${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left</span></div>${Meter(progress, 1, 'var(--sky-400)', 6)}</div>`;
    else if (st.kind !== 'done') detail = `<div style="display:flex;align-items:center;gap:8px;margin-top:8px">${Cost(tech.cost, Object.assign({ research: 1e9, gold: 1e9, minerals: 1e9 }, st.kind === 'poor' ? s.res : {}), 11)}<span style="font:500 11px/1 var(--font-body);color:var(--text-muted)"><i class="ph-fill ph-hourglass"></i> ${tech.days}d</span><div style="flex:1"></div>${st.kind === 'ready' ? `<span data-research="${tech.key}" style="display:contents">${UI.button({ size: 'sm', variant: nuke ? 'danger' : 'gold', icon: 'flask', children: 'Research' })}</span>` : ''}</div>`;
    else detail = '';
    const reason = st.reason ? `<div style="display:flex;align-items:center;gap:5px;margin-top:7px;font:500 11px/1.3 var(--font-body);color:${st.kind === 'poor' ? 'var(--red-300)' : 'var(--text-muted)'}"><i class="ph-fill ph-${st.kind === 'poor' ? 'warning' : 'lock'}"></i>${esc(st.reason)}</div>` : '';
    const cardBg = nuke ? 'repeating-linear-gradient(135deg, rgba(245,185,66,.08) 0 10px, rgba(0,0,0,.18) 10px 20px), rgba(40,14,10,.55)' : 'var(--grad-navy)';
    const cardBorder = nuke ? '#6b3206' : st.kind === 'active' ? 'var(--sky-700)' : 'var(--navy-600)';
    return `<div data-tech="${tech.key}" style="display:flex;gap:10px">${left}<div style="flex:1;min-width:0;margin-bottom:${last ? 0 : 10}px;padding:10px;border-radius:12px;background:${cardBg};border:1px solid ${cardBorder};box-shadow:0 3px 0 var(--navy-950)">`
      + `<div style="display:flex;align-items:center;gap:6px"><span style="flex:1;font:italic 800 18px/1 var(--font-display);text-transform:uppercase;color:${nuke ? 'var(--gold-300)' : '#fff'}">${tech.name}</span>${UI.badge({ kind: chip[0], icon: chip[1], children: chip[2] })}</div>`
      + `<div style="margin-top:5px;font:400 12px/1.4 var(--font-body);color:var(--navy-200)">${esc(tech.unlocks)}</div>${detail}${reason}</div></div>`;
  }

  function ResearchPane() {
    const s = sc();
    const labs = S.queue.filter((b) => b.type === 'lab' && b.status === 'active').length + 1;
    const dayFloat = S.day + (1 - S.secs / D.TICK_SEC);
    let html = `<div><div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;margin-bottom:14px;background:rgba(6,10,20,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)"><span style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:color-mix(in oklab, var(--res-research) 20%, transparent)"><i class="ph-fill ph-flask" style="font-size:19px;color:var(--res-research)"></i></span>`
      + `<div style="flex:1"><div style="font:700 22px/1 var(--font-num);color:#fff">${hudNum(s.res.research)} <span style="font:600 12px/1 var(--font-body);color:var(--green-300)">+${s.delta.research}/day</span></div><div style="margin-top:3px;font:400 11px/1.3 var(--font-body);color:var(--text-muted)">${labs} Research Labs · build more to research faster</div></div></div>`;
    html += SectionHead('Weapons');
    S.tech.forEach((x, i) => {
      const st = techState(x, S.tech, s, labs);
      const prog = x.status === 'active' ? Math.min(1, x.progress + (dayFloat - x.startDay) / x.days) : 0;
      html += TechCard(x, st, prog, Math.max(1, Math.ceil((1 - prog) * x.days)), i === S.tech.length - 1, s);
    });
    html += '</div>';
    return html;
  }

  // ---- Trade pane ----
  function ResLine(res) {
    return `<span style="display:inline-flex;gap:8px">${Object.keys(res).map((k) => `<span style="display:inline-flex;align-items:center;gap:4px;font:italic 800 18px/1 var(--font-display);color:#fff"><i class="ph-fill ph-${HUD_RES[k].icon}" style="color:${HUD_RES[k].color};font-size:16px"></i>${res[k]}</span>`).join('')}</span>`;
  }
  function TradePane() {
    const players = allPlayers();
    const pl = (id) => players.find((p) => p.id === id);
    const incoming = D.trades.filter((t) => t.dir === 'in');
    const outgoing = D.trades.filter((t) => t.dir === 'out');
    let html = `<div>${SectionHead('Incoming offers', UI.button({ size: 'sm', variant: 'gold', icon: 'plus', children: 'New offer' }))}`;
    if (!incoming.length) html += `<div style="font:400 13px/1.4 var(--font-body);color:var(--text-muted);padding:6px 0 12px">No offers on the table.</div>`;
    incoming.forEach((t) => {
      const p = pl(t.from);
      html += `<div style="padding:12px;border-radius:12px;margin-bottom:8px;background:var(--grad-navy);border:1px solid var(--navy-600);box-shadow:0 3px 0 var(--navy-950)">`
        + `<div style="display:flex;align-items:center;gap:6px;font:600 13px/1 var(--font-body);color:#fff"><span style="width:9px;height:9px;border-radius:3px;background:${p.color}"></span>${esc(p.name)}</div>`
        + `<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin:10px 0"><div>${Eyebrow('You get', undefined, 'margin-bottom:5px')}${ResLine(t.give)}</div><i class="ph-bold ph-arrows-left-right" style="color:var(--text-muted);font-size:18px"></i><div>${Eyebrow('You give', undefined, 'margin-bottom:5px')}${ResLine(t.receive)}</div></div>`
        + `<div style="display:flex;gap:8px"><span style="flex:1">${UI.button({ size: 'sm', variant: 'primary', icon: 'check', block: true, children: 'Accept' })}</span><span style="flex:1">${UI.button({ size: 'sm', variant: 'ghost', block: true, children: 'Decline' })}</span></div></div>`;
    });
    html += SectionHead(`<span style="display:block;margin-top:6px">Your offers</span>`);
    outgoing.forEach((t) => {
      const p = pl(t.to);
      html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:var(--navy-850);box-shadow:var(--shadow-inset-well)"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;font:600 12px/1 var(--font-body);color:#fff;margin-bottom:6px"><span style="width:9px;height:9px;border-radius:3px;background:${p.color}"></span>To ${esc(p.name)}</div><div style="display:flex;align-items:center;gap:6px">${ResLine(t.give)}<i class="ph-bold ph-arrow-right" style="color:var(--text-muted)"></i>${ResLine(t.receive)}</div></div>${UI.pill({ icon: 'hourglass', children: 'Pending' })}</div>`;
    });
    html += '</div>';
    return html;
  }

  // ---- Diplomacy pane ----
  function DiplomacyPane() {
    const players = allPlayers();
    let html = `<div style="display:flex;flex-direction:column;gap:8px">`;
    players.filter((p) => !p.me).forEach((p) => {
      const d = DIPLO[p.diplo || 'neutral'], tl = truceLeft(p), access = !!D.ACCESS[p.id];
      const pend = (k) => S.proposals[p.id + ':' + k];
      const acts = [];
      if (p.diplo === 'neutral' || !p.diplo) acts.push(['alliance', 'Propose alliance', 'primary'], ['war', 'Declare war', 'danger']);
      if (p.diplo === 'allied') acts.push(['break', 'End alliance', 'ghost']);
      if (p.diplo === 'war') acts.push(['truce', 'Offer truce', 'default']);
      if (p.diplo !== 'war' && !access) acts.push(['access', 'Request access', 'default']);
      let pills = '';
      if (access) pills += `<span class="iap-tip" data-tip="access" data-place="left" style="cursor:help">${UI.pill({ tone: 'teal', icon: 'path', children: 'Access granted' })}</span>`;
      if (tl) pills += UI.pill({ tone: 'sky', icon: 'hourglass', children: 'Truce · ' + tl + ' days left' });
      ['alliance', 'access', 'truce'].filter(pend).forEach((k) => { pills += UI.pill({ icon: 'hourglass', children: ({ alliance: 'Alliance', access: 'Access', truce: 'Truce' }[k]) + ' proposed · waiting' }); });
      const actionsRow = tl ? '' : acts.map(([k, label, v]) => `<span style="flex:1" data-diplo-act="${k}">${UI.button({ size: 'sm', variant: v, disabled: !!pend(k), block: true, children: label })}</span>`).join('');
      html += `<div data-diplo="${p.id}" style="padding:12px;border-radius:12px;background:var(--grad-navy);border:1px solid var(--navy-600);box-shadow:0 3px 0 var(--navy-950)">`
        + `<div style="display:flex;align-items:center;gap:10px"><span style="width:6px;height:32px;border-radius:3px;background:${p.color};transform:skewX(var(--skew))"></span><div style="flex:1;min-width:0"><div style="font:600 14px/1.2 var(--font-body);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</div><div style="font:400 11px/1.3 var(--font-body);color:var(--text-muted)">${esc(p.title)} · ${p.lands.length} lands${p.ai ? ' · AI' : ''}</div></div><span class="iap-tip" data-tip="diplo:${p.diplo || 'neutral'}" data-place="left" style="cursor:help">${UI.badge({ kind: d.kind, icon: d.icon, children: d.label })}</span></div>`
        + `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${pills}</div>`
        + (tl ? `<div style="margin-top:8px;font:400 12px/1.4 var(--font-body);color:var(--text-muted)">Truces can’t be broken. You can’t attack each other until Day ${S.day + tl}.</div>` : '')
        + `<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">${actionsRow}</div></div>`;
    });
    html += '</div>';
    return html;
  }

  function ContextPanel() {
    const code = S.selected, props = S.geo && S.geo.props[code];
    if (!props) return '';
    const mm = MODE_META[S.mode], owner = ownerOf(code), mine = owner && owner.me;
    let body = '';
    if (S.mode === 'build') body = mine ? BuildPane(props, sc()) : EmptyNote('lock-simple', 'Not your land', 'Conquer ' + props.name + ' to build farms, mines and power here.', `<span data-empty-attack>${UI.button({ size: 'sm', variant: 'danger', icon: 'sword', children: 'Plan attack' })}</span>`);
    else if (S.mode === 'army') body = ArmyPane();
    else if (S.mode === 'research') body = ResearchPane();
    else if (S.mode === 'trade') body = TradePane();
    else if (S.mode === 'diplomacy') body = DiplomacyPane();
    const showCountry = S.mode === 'build' || S.mode === 'army';
    const used = S.queue.filter((b) => b.country === code).length;
    const header = `<header class="panel__header"><h2 class="panel__title"><span class="panel__tick"></span>${mm.label}</h2><div class="panel__spacer"></div>${KeyCap(mm.key)}</header>`;
    const country = showCountry ? CountryHeader(code, used) : '';
    return `<section class="panel" id="context-panel" data-mode="${S.mode}" style="position:absolute;top:186px;right:14px;bottom:80px;width:340px;display:flex;flex-direction:column">`
      + `<div class="panel__body" style="padding:12px;display:flex;flex-direction:column;min-height:0;flex:1">${header}${country}`
      + `<div id="ctx-scroll" style="flex:1;min-height:0;overflow:auto;margin-top:${showCountry ? 12 : 0}px;margin-right:-6px;padding-right:6px">${body}</div></div></section>`;
  }

  function Comms() {
    const players = allPlayers();
    const pl = (id) => players.find((p) => p.id === id);
    const tab = S.chatTab, scope = S.chatScope;
    const header = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">`
      + TabPlates([{ value: 'feed', label: 'Dispatches', icon: 'broadcast' }, { value: 'chat', label: 'Chat', icon: 'chats', count: tab === 'chat' ? 0 : 2 }], tab)
      + (tab === 'chat' ? `<div style="display:flex;gap:2px;padding:2px;border-radius:999px;background:var(--navy-950)">${['all', 'team'].map((s) => `<button type="button" data-scope="${s}" style="border:0;cursor:pointer;padding:4px 10px;border-radius:999px;font:600 11px/1 var(--font-body);text-transform:uppercase;letter-spacing:.06em;background:${scope === s ? 'var(--navy-600)' : 'transparent'};color:${scope === s ? '#fff' : 'var(--text-muted)'}">${s === 'all' ? 'All' : 'Allies'}</button>`).join('')}</div>` : '')
      + `</div>`;
    let list;
    if (tab === 'feed') list = S.events.map((e) => UI.feedEvent({ type: e.type, actor: e.actor, day: e.day, children: e.text })).join('');
    else list = S.chat.filter((m) => m.scope === scope).map((m) => { const p = pl(m.pid); return UI.chatMessage({ name: p ? p.name : 'System', color: p ? p.color : undefined, children: m.body }); }).join('');
    const composer = tab === 'chat' ? `<div style="display:flex;gap:8px;margin-top:8px"><div style="flex:1">${UI.input({ size: 'sm', placeholder: scope === 'all' ? 'Message the world…' : 'Message your allies…', maxLength: 400 }).replace('<input ', '<input id="chat-input" ')}</div><span data-send>${UI.button({ size: 'sm', icon: 'paper-plane-right', children: 'Send' })}</span></div>` : '';
    return `<section class="panel" style="position:absolute;left:14px;bottom:14px;width:380px"><div class="panel__body" style="padding:12px">${header}<div id="comms-list" style="height:150px;overflow:auto;margin-right:-6px;padding-right:6px">${list}</div>${composer}</div></section>`;
  }

  function HotbarSlot(k, active, count) {
    const m = MODE_META[k];
    const lift = active ? -8 : 0;
    const countEl = count ? `<span style="position:absolute;top:-9px;left:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:var(--grad-danger);box-shadow:0 2px 0 #7a0c27;font:700 12px/22px var(--font-body);color:#fff">${count}</span>` : '';
    return `<button type="button" class="hotbar-slot iap-tip" data-hotbar="${k}" data-tip="mode:${k}" data-place="top" data-active="${active ? 1 : 0}" style="position:relative;width:86px;height:82px;padding:0;border:2px solid ${active ? 'var(--gold-300)' : 'rgba(124,196,255,.22)'};border-radius:14px;cursor:pointer;background:${active ? 'linear-gradient(180deg,#2c4372 0%,#19233b 100%)' : 'rgba(18,26,46,.88)'};backdrop-filter:blur(8px);box-shadow:${(active ? '0 0 0 3px rgba(245,185,66,.25), 0 0 26px rgba(245,185,66,.4), ' : '')}inset 0 1px 0 rgba(255,255,255,.1), 0 4px 0 var(--navy-950), 0 10px 20px rgba(0,0,0,.4);transform:translateY(${lift}px);transition:transform 150ms var(--ease-pop), box-shadow 150ms ease, border-color 150ms ease;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">`
      + `<i class="ph-fill ph-${m.icon}" style="font-size:30px;color:${active ? 'var(--gold-300)' : '#fff'};filter:drop-shadow(0 2px 0 rgba(0,0,0,.4))"></i>`
      + `<span style="font:italic 800 15px/1 var(--font-display);text-transform:uppercase;letter-spacing:.04em;color:${active ? '#fff' : 'var(--navy-200)'}">${m.label}</span>`
      + KeyCap(m.key, 'position:absolute;top:-9px;right:-9px') + countEl + `</button>`;
  }

  function Hotbar() {
    const pending = D.trades.filter((x) => x.dir === 'in').length;
    const m = me();
    const vis = vision();
    const threat = S.armies.filter((a) => a.route && a.owner !== m.id && m.lands.includes(a.to)).filter((a) => alliedIds().has(a.owner) || a.owner === m.id || seen(a.from, vis) || seen(a.to, vis))[0];
    const counts = { trade: pending, army: threat ? '!' : 0 };
    return `<div style="position:absolute;bottom:22px;left:50%;transform:translateX(-50%);display:flex;gap:20px">${Object.keys(MODE_META).map((k) => HotbarSlot(k, S.mode === k, counts[k])).join('')}</div>`;
  }

  const LENSES = [
    { value: 'political', icon: 'flag-banner', label: 'Political' },
    { value: 'farmland', icon: 'grains', label: 'Farmland', color: 'var(--res-food)' },
    { value: 'minerals', icon: 'diamond', label: 'Minerals', color: 'var(--res-minerals)' },
    { value: 'oil', icon: 'drop', label: 'Oil', color: 'var(--res-oil)' },
  ];
  function RoundBtn(icon, title, active, color, data) {
    return `<button type="button" aria-label="${title}" ${data || ''} style="width:38px;height:38px;border-radius:10px;border:1px solid ${active ? 'var(--teal-400)' : 'var(--navy-500)'};cursor:pointer;display:grid;place-items:center;background:${active ? 'linear-gradient(180deg,#22485a,#173040)' : 'var(--grad-navy)'};box-shadow:inset 0 1px 0 rgba(255,255,255,.1), 0 3px 0 var(--navy-950)${active ? ', var(--glow-teal)' : ''};transition:transform 80ms ease"><i class="ph-fill ph-${icon}" style="font-size:18px;color:${active ? (color || 'var(--teal-300)') : '#fff'}"></i></button>`;
  }
  function GlobeControls() {
    const lensBtns = LENSES.map((l) => {
      const active = S.lens === l.value;
      return `<span class="iap-tip" data-tip="lens:${l.value}" data-place="top">${RoundBtn(l.icon, l.label + ' lens', active, l.color, `data-lens="${l.value}" aria-pressed="${active}"`)}</span>`;
    }).join('');
    return `<div style="position:absolute;right:14px;bottom:14px;width:340px;display:flex;align-items:center;gap:5px;padding:6px;border-radius:14px;background:var(--surface-overlay);backdrop-filter:blur(8px);border:1px solid var(--border-glow);box-shadow:var(--shadow-panel)">${lensBtns}<div style="flex:1"></div>`
      + `<span class="iap-tip" data-tip="zoomOut" data-place="top">${RoundBtn('minus', 'Zoom out', false, null, 'data-zoom="0.35"')}</span>`
      + `<span class="iap-tip" data-tip="zoomIn" data-place="top">${RoundBtn('plus', 'Zoom in', false, null, 'data-zoom="-0.35"')}</span>`
      + `<span class="iap-tip" data-tip="focus" data-place="top">${RoundBtn('crosshair', 'Focus capital', false, null, 'data-focus="1"')}</span></div>`;
  }

  function HoverTip() { return `<div id="hover-tip" style="position:absolute;left:0;top:0;pointer-events:none;z-index:30;display:none"></div>`; }

  // ---- Marker layer (army plates, reticles, bursts, strike shots) ----
  function ArmyMarker(a, player, isMe, atWar) {
    const U = D.UNITS, top = armyTop(a.units), moving = !!a.route;
    const dayChip = moving ? `<div style="margin-bottom:3px;padding:2px 6px;border-radius:5px;background:rgba(6,10,20,.85);font:italic 800 11px/1 var(--font-display);text-transform:uppercase;color:${atWar ? 'var(--red-300)' : '#fff'};white-space:nowrap">Day ${a.arriveDay}</div>` : '';
    return `<div class="iap-tip" data-tip="marker:${a.id}" data-place="top" data-pick="${moving ? a.to : a.at}" style="display:flex;flex-direction:column;align-items:center;cursor:pointer">${dayChip}`
      + `<div style="display:flex;align-items:center;gap:4px;height:24px;padding:0 8px 0 3px;border-radius:8px;background:linear-gradient(180deg, rgba(255,255,255,.4), rgba(0,0,0,.14)), ${player.color};border:2px solid ${isMe ? '#fff' : 'rgba(6,10,20,.85)'};box-shadow:0 3px 0 rgba(0,0,0,.5), 0 6px 14px rgba(0,0,0,.5)${atWar ? ', 0 0 0 3px rgba(230,25,75,.6)' : ''};animation:${atWar && moving ? 'iap-pulse 1s ease-in-out infinite' : 'none'}">`
      + `<span style="width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:rgba(6,10,20,.4)"><i class="ph-fill ph-${U[top].icon}" style="font-size:12px;color:#fff"></i></span>`
      + `<span style="font:italic 900 16px/1 var(--font-display);color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.6), 0 0 4px rgba(0,0,0,.5)">${armyCount(a.units)}</span>${moving ? `<i class="ph-fill ph-caret-double-right" style="font-size:11px;color:#fff"></i>` : ''}</div>`
      + `<div style="width:2px;height:7px;background:${isMe ? '#fff' : 'rgba(6,10,20,.85)'}"></div><div style="width:10px;height:4px;border-radius:50%;background:rgba(0,0,0,.55);box-shadow:0 0 4px rgba(0,0,0,.6)"></div></div>`;
  }

  const markerLayer = { els: {}, items: [], raf: null };
  let lastMarkerSig = '';

  // ---- strike / missile FX (transient) ----
  // Fire-and-forget animations triggered by strike/nuclear_strike realtime events: a trajectory
  // arc + a projectile travelling along it, then a burst at the target. Not game state — purely
  // visual, so they live in their own layer and self-remove when the burst finishes.
  const fxLayer = { items: [] };
  let fxSeq = 0;
  const STRIKE_COLOR = { artillery: '#ffcf5a', air: '#6fe9ff', srbm: '#6fe9ff', mrbm: '#7fd0ff', icbm: '#c9a3ff', nuclear: '#ff8a3c' };
  // Trajectory arc height per kind. Kept low enough to read as a missile arc near the surface
  // (0.4+ balloons it off-frame); nuclear arcs a little higher for drama.
  const STRIKE_LIFT = { artillery: 0.05, air: 0.1, srbm: 0.12, mrbm: 0.16, icbm: 0.2, nuclear: 0.24 };
  function strikeFx(payload) {
    if (!globe || !S.geoReady || !payload) return;
    const kind = payload.kind || 'nuclear';   // the nuclear_strike event carries no `kind`
    const toCode = payload.target;
    if (!toCode || !GEO.centroid(toCode)) return;
    let fromCode = payload.from;
    if (!fromCode) { const by = allPlayers().find((p) => p.id === payload.by); fromCode = by && by.country; }   // missiles/nukes launch from the capital
    const host = document.getElementById('fx-layer');
    if (!host) return;
    const nuke = kind === 'nuclear';
    const color = STRIKE_COLOR[kind] || '#ff5a5a';
    const id = 'fx' + (fxSeq++);
    const el = document.createElement('div');
    el.setAttribute('data-fx', id);
    el.style.cssText = 'position:absolute;left:0;top:0;opacity:0;pointer-events:none;will-change:transform;z-index:20';
    host.appendChild(el);
    // No usable origin (or striking its own tile) → just burst on the target.
    if (!fromCode || fromCode === toCode || !GEO.centroid(fromCode)) {
      el.innerHTML = burstHTML(kind, color);
      fxLayer.items.push({ id, el, impacted: true, boomStart: performance.now(), toCode, kind, path: null });
      return;
    }
    const lift = STRIKE_LIFT[kind] != null ? STRIKE_LIFT[kind] : 0.18;
    const route = GEO.pathPoints(globe, [fromCode, toCode], { lift, step: 0.35 });
    const path = globe.addPath(route, { color, opacity: 0.95, radius: nuke ? 0.011 : 0.006, dash: 0, arrow: false });
    // Glowing orb behind a white rocket/radioactive glyph so the projectile reads clearly over land.
    el.innerHTML = `<div style="transform:translate(-50%,-50%);position:relative;display:grid;place-items:center">`
      + `<div style="position:absolute;width:${nuke ? 30 : 22}px;height:${nuke ? 30 : 22}px;border-radius:50%;background:radial-gradient(circle, ${color}, transparent 70%);opacity:.95"></div>`
      + `<i class="ph-fill ph-${nuke ? 'radioactive' : 'rocket'}" style="position:relative;font-size:${nuke ? 24 : 19}px;color:#fff;filter:drop-shadow(0 0 7px ${color}) drop-shadow(0 0 3px ${color})"></i></div>`;
    const dur = nuke ? 2200 : (kind === 'artillery' || kind === 'air' ? 1000 : 1700);
    fxLayer.items.push({ id, el, route, start: performance.now(), dur, kind, toCode, path, impacted: false });
  }
  function burstHTML(kind, color) {
    const size = kind === 'nuclear' ? 74 : 44;
    return `<div style="transform:translate(-50%,-50%);width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${color};background:radial-gradient(circle, ${color}dd, transparent 66%);box-shadow:0 0 24px ${color}, inset 0 0 16px ${color};animation:iap-burst .85s ease-out forwards"></div>`;
  }

  // ---- buildings on the globe ----
  // Each of a player's buildings is pinned to a point inside its country, spread evenly via a
  // golden-angle (phyllotaxis) spiral so a cluster of farms/mines/labs fans out instead of
  // stacking. Positions are keyed by slot index into the country's capacity, so building more
  // appends outward without moving the existing dots. Dots are driven by the live building list,
  // so a building destroyed server-side (e.g. nuked) simply disappears on the next refresh.
  const buildingLayer = { els: {}, items: [] };
  let lastBuildingSig = '';
  const GOLDEN = 2.399963229728653;   // golden angle in radians
  const _cRadius = {};                 // cache: country code -> spread radius in degrees
  // Great-circle angle (degrees) between two [lon,lat] points.
  function angBetween(a, b) {
    const r = Math.PI / 180;
    const d = Math.sin(a[1] * r) * Math.sin(b[1] * r) + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.cos((a[0] - b[0]) * r);
    return Math.acos(Math.max(-1, Math.min(1, d))) / r;
  }
  function countryRadius(code) {
    if (_cRadius[code] != null) return _cRadius[code];
    const c = GEO.centroid(code), f = S.geo && S.geo.feats && S.geo.feats[code];
    let r = 1.2;
    if (c && f && f.geometry) {
      // Largest ring (most points) as a proxy for the mainland; max angular offset from centroid.
      const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
      let best = null;
      polys.forEach((poly) => { const ring = poly[0]; if (ring && (!best || ring.length > best.length)) best = ring; });
      if (best) { let mx = 0; best.forEach((p) => { const d = angBetween(c, p); if (d < 40 && d > mx) mx = d; }); if (mx > 0) r = mx; }
    }
    return (_cRadius[code] = Math.max(0.5, Math.min(7, r * 0.6)));
  }
  // Point inside a country for the slot-th building of `cap` capacity: centroid + spiral offset.
  function buildingLonLat(code, slot, cap) {
    const c = GEO.centroid(code); if (!c) return null;
    const R = countryRadius(code);
    const rr = R * Math.sqrt((slot + 0.5) / Math.max(4, cap));
    const ang = slot * GOLDEN;
    const dLat = rr * Math.sin(ang);
    const dLon = (rr * Math.cos(ang)) / Math.max(0.2, Math.cos(c[1] * Math.PI / 180));
    return [c[0] + dLon, c[1] + dLat];
  }
  function BuildingDot(b, isMe) {
    const B = IAP.BUILDINGS[b.type]; if (!B) return '';
    const building = b.status !== 'active';
    const ring = isMe ? 'rgba(255,255,255,.9)' : 'rgba(6,10,20,.85)';
    return `<div style="display:flex;flex-direction:column;align-items:center">`
      + `<span style="width:20px;height:20px;border-radius:7px;display:grid;place-items:center;background:linear-gradient(180deg, rgba(255,255,255,.35), rgba(0,0,0,.18)), ${B.tone};border:1.5px solid ${ring};box-shadow:0 2px 0 rgba(0,0,0,.45), 0 4px 8px rgba(0,0,0,.45);${building ? 'opacity:.72;animation:iap-pulse 1.3s ease-in-out infinite' : ''}">`
      + `<i class="ph-fill ph-${B.icon}" style="font-size:12px;color:#fff"></i></span>`
      + `<div style="width:2px;height:5px;background:${ring}"></div><div style="width:7px;height:3px;border-radius:50%;background:rgba(0,0,0,.5)"></div>`
      + `</div>`;
  }
  function renderBuildings(force) {
    if (!LIVE) return;   // globe buildings are a live-gameplay feature; mock mode stays design-exact
    const host = document.getElementById('building-layer');
    if (!host || !globe || !S.geoReady) return;
    // My buildings, grouped by country, each assigned a stable slot = index within its country
    // (sorted by id) so new builds append and don't shuffle the others.
    const byCountry = {};
    (S.queue || []).forEach((b) => { if (b.country) (byCountry[b.country] = byCountry[b.country] || []).push(b); });
    const items = [];
    Object.keys(byCountry).forEach((code) => {
      const list = byCountry[code].slice().sort((x, y) => (x.id || 0) - (y.id || 0));
      const cap = Math.max(list.length, (S.geo.props[code] || {}).land_slots || 4);
      list.forEach((b, i) => {
        const ll = buildingLonLat(code, i, cap); if (!ll) return;
        items.push({ id: 'b' + (b.id != null ? b.id : code + '-' + b.type + '-' + i), lon: ll[0], lat: ll[1], b });
      });
    });
    const sig = JSON.stringify(items.map((it) => [it.id, it.b.status, it.lon.toFixed(3), it.lat.toFixed(3)]));
    if (!force && sig === lastBuildingSig && host.childElementCount === items.length) return;
    lastBuildingSig = sig;
    host.innerHTML = items.map((it) => `<div data-bk="${it.id}" style="position:absolute;left:0;top:0;opacity:0"><div style="transform:translate(-50%,-100%)">${BuildingDot(it.b, true)}</div></div>`).join('');
    buildingLayer.items = items;
    buildingLayer.els = {};
    host.querySelectorAll('[data-bk]').forEach((el) => { buildingLayer.els[el.getAttribute('data-bk')] = el; });
  }
  function renderMarkers(force) {
    const m = me(), players = allPlayers(), vis = vision();
    const visibleArmies = S.armies.filter((a) => a.owner === m.id || alliedIds().has(a.owner) || (a.route ? seen(a.from, vis) || seen(a.to, vis) : seen(a.at, vis)));
    // Rebuild the marker DOM only when the visible set or an army's state changes. Otherwise
    // the markerLoop rAF keeps moving the existing nodes — rebuilding every tick would reset
    // them to opacity:0 at the origin for a frame (the "troops flash then vanish" bug).
    const sig = JSON.stringify(visibleArmies.map((a) => [a.id, a.route ? 1 : 0, a.at, a.to, a.arriveDay]));
    if (!force && sig === lastMarkerSig && document.getElementById('marker-layer') && document.getElementById('marker-layer').childElementCount) return;
    lastMarkerSig = sig;
    // reticles: preview target + visible marching destinations
    const reticles = [];
    visibleArmies.filter((a) => a.route).forEach((a) => { if (!reticles.find((r) => r.code === a.to)) reticles.push({ code: a.to, color: a.owner === m.id ? '#7fe6dc' : '#ff4d73' }); });
    const pl = (id) => players.find((p) => p.id === id);
    const host = document.getElementById('marker-layer');
    if (!host) return;
    let html = '';
    reticles.forEach((r) => {
      html += `<div data-mk="ret-${r.code}" style="position:absolute;left:0;top:0;pointer-events:none"><div style="position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:2px solid ${r.color};box-shadow:0 0 12px ${r.color};animation:iap-reticle 1.4s ease-out infinite"></div><i class="ph-bold ph-crosshair" style="position:absolute;left:-11px;top:-11px;font-size:22px;color:${r.color};filter:drop-shadow(0 1px 2px rgba(0,0,0,.8))"></i></div>`;
    });
    visibleArmies.forEach((a) => {
      html += `<div data-mk="${a.id}" style="position:absolute;left:0;top:0;opacity:0"><div style="transform:translate(-50%, -100%)">${ArmyMarker(a, pl(a.owner), a.owner === m.id, warIds().has(a.owner))}</div></div>`;
    });
    host.innerHTML = html;
    markerLayer.items = reticles.map((r) => ({ id: 'ret-' + r.code, code: r.code })).concat(visibleArmies.map((a) => ({ id: a.id, a })));
    markerLayer.els = {};
    host.querySelectorAll('[data-mk]').forEach((el) => { markerLayer.els[el.getAttribute('data-mk')] = el; });
  }
  function markerLoop() {
    markerLayer.raf = requestAnimationFrame(markerLoop);
    if (!globe || !GEO.centroid('SWE')) return;
    const now = performance.now();
    for (const it of markerLayer.items) {
      const el = markerLayer.els[it.id];
      if (!el) continue;
      let p;
      if (it.a && it.a.route) { const f = (now - it.a.start) / it.a.dur; p = GEO.pointAt(it.a.route, it.a.ease ? 1 - Math.pow(1 - Math.min(1, f), 2) : f); }
      else { const c = GEO.centroid(it.a ? it.a.at : it.code); if (!c) continue; p = globe.lonLatVec(c[0], c[1], 1.012); }
      const s = globe.projectLocal(p);
      el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
      el.style.opacity = s.vis;
      el.style.pointerEvents = s.vis > 0.6 ? 'auto' : 'none';
      el.style.zIndex = Math.round(s.y);
    }
    // Building dots are pinned to fixed lon/lat; re-project each frame as the globe rotates.
    for (const it of buildingLayer.items) {
      const el = buildingLayer.els[it.id];
      if (!el) continue;
      const s = globe.projectLocal(globe.lonLatVec(it.lon, it.lat, 1.012));
      el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
      el.style.opacity = s.vis;
      el.style.zIndex = Math.round(s.y) - 1;   // sit just under the army markers
    }
    // Strike FX: fly the projectile along its arc, then burst on the target and self-remove.
    for (let i = fxLayer.items.length - 1; i >= 0; i--) {
      const it = fxLayer.items[i];
      if (!it.impacted) {
        const t = (now - it.start) / it.dur;
        if (t >= 1) {
          if (it.path) { globe.removePath(it.path); it.path = null; }
          it.impacted = true; it.boomStart = now;
          it.el.innerHTML = burstHTML(it.kind, STRIKE_COLOR[it.kind] || '#ff5a5a');
        } else {
          const s = globe.projectLocal(GEO.pointAt(it.route, Math.max(0, t)));
          it.el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
          it.el.style.opacity = s.vis;
        }
      }
      if (it.impacted) {
        const c = GEO.centroid(it.toCode);
        if (c) { const s = globe.projectLocal(globe.lonLatVec(c[0], c[1], 1.012)); it.el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)'; it.el.style.opacity = s.vis; }
        if (now - it.boomStart > 900) { if (it.el.parentNode) it.el.parentNode.removeChild(it.el); fxLayer.items.splice(i, 1); }
      }
    }
  }

  // ---- clock ----
  // Anchor the epoch at script-eval time (like the mockup's module-eval epoch) so the countdown's
  // elapsed time at screenshot matches the reference's; boot() does NOT reset t0.
  const clock = { t0: performance.now(), day0: D.DAY, into: D.TICK_SEC - 12, dayMs: D.TICK_SEC * 1000 };
  function dayNow() { const el = (performance.now() - clock.t0) / clock.dayMs + clock.into / D.TICK_SEC; return clock.day0 + el; }

  // ---- launch a march (port of MatchHud.launch) ----
  function launch(owner, units, codes, kind, days, idHint) {
    return { id: idHint || 'm' + Math.random().toString(36).slice(2, 8), owner, units, from: codes[0], to: codes[codes.length - 1], codes, kind,
      route: GEO.pathPoints(globe, codes, { lift: ROUTE_LIFT[kind], step: 0.5 }), start: performance.now(), dur: Math.max(500, (Math.floor(dayNow()) + days - dayNow()) * clock.dayMs), arriveDay: Math.floor(dayNow()) + days };
  }

  function deriveAlert() {
    const s = sc();
    if (s.alert) return s.alert;
    const m = me(), vis = vision();
    const visibleArmies = S.armies.filter((a) => a.owner === m.id || alliedIds().has(a.owner) || (a.route ? seen(a.from, vis) || seen(a.to, vis) : seen(a.at, vis)));
    const threat = visibleArmies.filter((a) => a.route && a.owner !== m.id && m.lands.includes(a.to)).sort((x, y) => x.arriveDay - y.arriveDay)[0];
    if (!threat) return null;
    return { kind: 'war', title: 'Invasion incoming', body: (allPlayers().find((p) => p.id === threat.owner) || {}).name + '’s ' + armyList(threat.units) + ' is marching on ' + cname(threat.to), eta: Math.max(0, threat.arriveDay - S.day), target: threat.to };
  }

  // Toasts live in their own persistent layer (not inside #hud-panels), so showing/clearing a
  // toast never rebuilds the panels — otherwise clicking Build would tear down and recreate the
  // in-progress progress bars, which reads as a flash.
  function renderToasts() {
    const layer = document.getElementById('toast');
    if (!layer) return;
    const top = deriveAlert() ? 262 : 186;
    layer.style.top = top + 'px';
    layer.innerHTML = S.toasts.map((x) => UI.toast({ kind: x.kind, children: x.msg })).join('');
  }

  // ---- render all regions ----
  // The marker/tip/hover layers persist across re-renders (only the rAF loop moves markers);
  // rebuilding them each render would reset marker transforms to the origin, which the harness
  // can catch between a render and the next animation frame.
  function ensureLayers() {
    const stage = document.getElementById('hud-stage');
    if (!document.getElementById('hud-panels')) {
      stage.insertAdjacentHTML('beforeend', `<div id="building-layer" style="position:absolute;inset:0;pointer-events:none;z-index:0"></div>`);
      stage.insertAdjacentHTML('beforeend', `<div id="marker-layer" style="position:absolute;inset:0;pointer-events:none;z-index:0;isolation:isolate"></div>`);
      stage.insertAdjacentHTML('beforeend', `<div id="fx-layer" style="position:absolute;inset:0;pointer-events:none;z-index:1"></div>`);
      stage.insertAdjacentHTML('beforeend', `<div id="hud-panels"></div>`);
      stage.insertAdjacentHTML('beforeend', `<div id="hover-tip" style="position:absolute;left:0;top:0;pointer-events:none;z-index:30;display:none"></div>`);
      stage.insertAdjacentHTML('beforeend', `<div id="tip-layer" style="position:absolute;inset:0;pointer-events:none;z-index:60"></div>`);
      stage.insertAdjacentHTML('beforeend', `<div id="toast" style="position:absolute;top:186px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;z-index:40"></div>`);
    }
  }
  function render() {
    const stage = document.getElementById('hud-stage');
    if (!stage) return;
    ensureLayers();
    const alert = deriveAlert();
    // Preserve scroll positions across the innerHTML rebuild so a live refresh (every tick)
    // doesn't fling the build list / chat back to the top while the player is reading.
    const scrolls = {};
    ['ctx-scroll', 'comms-list'].forEach((id) => { const el = document.getElementById(id); if (el) scrolls[id] = el.scrollTop; });
    document.getElementById('hud-panels').innerHTML =
      IdentityPlate() + WorldClock() + Treasury() + AlertRibbon(alert)
      + Standings() + ContextPanel() + Comms() + Hotbar() + GlobeControls();
    Object.keys(scrolls).forEach((id) => { const el = document.getElementById(id); if (el) el.scrollTop = scrolls[id]; });
    renderToasts();
    wire();
  }

  function toast(msg, kind) {
    const id = Math.random();
    S.toasts.push({ id, msg, kind });
    renderToasts();   // just the toast layer — never rebuild the panels (would flash the bars)
    setTimeout(() => { S.toasts = S.toasts.filter((y) => y.id !== id); renderToasts(); }, 2600);
  }

  // ---- tooltip resolution (data-tip token -> tip object) ----
  function resolveTip(token) {
    const s = sc(), m = me();
    const [kind, arg] = token.split(':');
    if (kind === 'identity') return TIPS.identity;
    if (kind === 'pop') { const pop = s.fed ? m.pop : m.pop * 0.985; return Object.assign({}, TIPS.pop, { stats: [{ label: 'Now', value: hudNum(pop) }, { label: 'Cap', value: hudNum(m.popCap) }, { label: 'Per day', value: s.fed ? '+1.0%' : '−1.5%', color: s.fed ? 'var(--green-300)' : 'var(--red-300)' }] }); }
    if (kind === 'fed') return TIPS.fed;
    if (kind === 'starving') return TIPS.starving;
    if (kind === 'day') return Object.assign({}, TIPS.day, { stats: [{ label: 'Today', value: 'Day ' + S.day }, { label: 'Next day in', value: S.secs + 's' }] });
    if (kind === 'world') { const players = allPlayers(); const total = D.TOTAL; const sh = (p) => (p.share != null ? p.share : p.lands.length / total); const ranked = players.slice().sort((a, b) => sh(b) - sh(a)); const pct = (p) => (sh(p) * 100).toFixed(1) + '%'; return Object.assign({}, TIPS.world, { stats: ranked.map((p) => ({ label: p.me ? 'You' : p.name.split(' ').slice(-1)[0], value: pct(p) + ' · ' + p.lands.length + ' lands', color: p.color })).concat([{ label: 'To win', value: '60% of world score', color: 'var(--gold-300)', icon: 'trophy' }]) }); }
    if (kind === 'res') { const mr = HUD_RES[arg], d = s.delta[arg], empty = s.res[arg] <= 0; return { title: mr.label, icon: mr.icon, tone: mr.color, body: TIPS.res[arg].body, stats: [{ label: 'Now', value: hudNum(s.res[arg]), color: empty ? 'var(--red-300)' : undefined }, { label: 'Per day', value: (d >= 0 ? '+' : '−') + Math.abs(d), color: d >= 0 ? 'var(--green-300)' : 'var(--red-300)' }, { label: 'Made by', value: TIPS.res[arg].source }] }; }
    if (kind === 'grid') { const eff = Math.round(s.efficiency * 100); return Object.assign({}, TIPS.grid, { stats: [{ label: 'Efficiency', value: eff + '%', color: eff < 100 ? 'var(--red-300)' : 'var(--res-energy)' }] }); }
    if (kind === 'diplo') return TIPS.diplo[arg];
    if (kind === 'mode') return { title: MODE_META[arg].label, icon: MODE_META[arg].icon, tone: 'var(--sky-500)', keyHint: MODE_META[arg].key, body: TIPS.modes[arg].body };
    if (kind === 'lens') return Object.assign({}, TIPS.lens[arg], { icon: LENSES.find((l) => l.value === arg).icon, tone: LENSES.find((l) => l.value === arg).color || 'var(--sky-500)' });
    if (kind === 'zoomOut') return TIPS.zoomOut;
    if (kind === 'zoomIn') return TIPS.zoomIn;
    if (kind === 'focus') return TIPS.focus;
    if (kind === 'attr') { if (arg === 'slots') { const code = S.selected, props = S.geo.props[code], used = S.queue.filter((b) => b.country === code).length, owner = ownerOf(code), mine = owner && owner.me; return Object.assign({}, TIPS.attr.slots, { stats: [{ label: 'Used', value: (mine ? used : 0) + ' of ' + props.land_slots }] }); } const props = S.geo.props[S.selected]; const r = { farmland: 'food', minerals: 'minerals', oil: 'oil' }[arg]; return Object.assign({}, TIPS.attr[arg], { stats: [{ label: props.name, value: props[arg] + ' / 100', color: HUD_RES[r].color }] }); }
    if (kind === 'occupied') { const occ = S.occupied[S.selected] || { until: 0, unrest: 0 }; return Object.assign({}, TIPS.occupied, { stats: [{ label: 'Integrated on', value: 'Day ' + occ.until }, { label: 'Unrest', value: occ.unrest + '%', color: occ.unrest > 60 ? 'var(--red-300)' : 'var(--gold-300)' }] }); }
    if (kind === 'fog') return TIPS.fog;
    if (kind === 'route') return TIPS.route[arg];
    if (kind === 'blocked') return TIPS.blocked;
    if (kind === 'odds') return TIPS.odds;
    if (kind === 'manpower') { const a = armyCtx(); return Object.assign({}, TIPS.manpower, { stats: [{ label: 'In service', value: a.manpower.used }, { label: 'Limit (1% of pop)', value: a.manpower.limit }] }); }
    if (kind === 'upkeep') { const a = armyCtx(); return Object.assign({}, TIPS.upkeep, { stats: Object.keys(a.upkeep).map((r) => ({ label: HUD_RES[r].label, value: '−' + a.upkeep[r] + ' / day', icon: HUD_RES[r].icon, color: HUD_RES[r].color })) }); }
    if (kind === 'strength') return TIPS.strength;
    if (kind === 'strike') return TIPS.strike[arg];
    if (kind === 'strikeRule') return TIPS.strikeRule;
    if (kind === 'access') return TIPS.access;
    if (kind === 'unit') { const U = D.UNITS[arg]; const code = S.selected; const here = S.armies.find((a) => !a.route && a.at === code && a.owner === me().id); const n = here ? here.units[arg] || 0 : 0; return { title: U.name, icon: U.icon, tone: 'var(--navy-500)', body: D.UNITS_TIPS[arg], stats: [{ label: 'Attack', value: U.attack, color: 'var(--red-300)' }, { label: 'Here', value: n + ' units' }, { label: 'Strength', value: n * U.attack, color: 'var(--teal-300)' }] }; }
    if (kind === 'build') { const B = IAP.BUILDINGS[arg], props = S.geo.props[S.selected], y = buildYield(arg, props), afford = Object.keys(B.cost).every((k) => (s.res[k] || 0) >= B.cost[k]); return { title: B.name, icon: B.icon, tone: B.tone, body: B.desc, stats: [{ label: 'Output here', value: y.map(([k, v, txt]) => txt || ((v >= 0 ? '+' : '−') + Math.abs(v) + ' ' + HUD_RES[k].label.toLowerCase())).join(', ') }, { label: 'Energy use', value: B.needs_energy ? B.needs_energy + ' / day' : 'none', color: 'var(--res-energy)', icon: 'lightning' }, { label: 'Build time', value: B.build_ticks + ' days' }].concat(afford ? [] : [{ label: 'Can’t afford', value: 'need more resources', color: 'var(--red-300)', icon: 'warning' }]) }; }
    if (kind === 'tech') { const tech = S.tech.find((x) => x.key === arg); const nuke = tech.danger; return { title: tech.name, icon: tech.icon, tone: nuke ? '#b4520c' : 'var(--teal-600)', body: tech.unlocks, stats: [{ label: 'Research', value: tech.cost.research, icon: 'flask', color: 'var(--res-research)' }, { label: 'Gold', value: hudNum(tech.cost.gold), icon: 'coins', color: 'var(--res-gold)' }].concat(tech.cost.minerals ? [{ label: 'Minerals', value: hudNum(tech.cost.minerals), icon: 'diamond' }] : []).concat([{ label: 'Takes', value: tech.days + ' days' }]) }; }
    if (kind === 'marker') { const a = S.armies.find((x) => x.id === arg); if (!a) return null; const U = D.UNITS, top = armyTop(a.units), moving = !!a.route, player = allPlayers().find((p) => p.id === a.owner), isMe = a.owner === me().id, atWar = warIds().has(a.owner); const where = (S.geo.props[moving ? a.to : a.at] || {}).name; return { title: isMe ? 'Your army' : player.name + '’s army', icon: U[top].icon, tone: player.color, body: TIPS.marker.body, stats: ARMY_UNIT_ORDER.filter((k) => a.units[k] > 0).map((k) => ({ label: U[k].name, value: a.units[k], icon: U[k].icon })).concat([{ label: 'Strength', value: armyStrength(a.units), color: 'var(--teal-300)' }, moving ? { label: 'Marching to', value: where + ' · Day ' + a.arriveDay, color: atWar ? 'var(--red-300)' : 'var(--sky-300)' } : { label: 'Stationed in', value: where }]) }; }
    if (kind === 'cantattack') return { title: 'Can’t attack', icon: 'prohibit', tone: 'var(--navy-500)', body: arg };
    return null;
  }

  // hover-intent tooltip (300ms show, instant hide, clamp 8px inside screen)
  const TIP_W = 260;
  let tipTimer = null;
  let tipShown = false;      // a tooltip is currently on screen (defer panel rebuilds while it is)
  let pendingRender = false;  // a liveRefresh wanted to render() but a tooltip was open
  function showTip(tip, el, place) {
    clearTimeout(tipTimer);
    if (!tip || !el) return;
    tipTimer = setTimeout(() => {
      tipShown = true;
      const stage = document.getElementById('hud-stage');
      const st = stage.getBoundingClientRect(), b = el.getBoundingClientRect(), k = window.__hudScale || 1;
      const r = { x: (b.left - st.left) / k, y: (b.top - st.top) / k, w: b.width / k, h: b.height / k };
      const layer = document.getElementById('tip-layer');
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, gap = 12;
      let style = '', arrowOffset;
      const HUD_W = 1440;
      if (place === 'top' || place === 'bottom') {
        const left = Math.max(8, Math.min(HUD_W - TIP_W - 8, cx - TIP_W / 2));
        arrowOffset = cx - left;
        style = place === 'bottom' ? `left:${left}px;top:${r.y + r.h + gap}px` : `left:${left}px;top:${r.y - gap}px;transform:translateY(-100%)`;
      } else {
        style = place === 'left' ? `left:${r.x - gap - TIP_W}px;top:${cy}px;transform:translateY(-50%)` : `left:${r.x + r.w + gap}px;top:${cy}px;transform:translateY(-50%)`;
      }
      layer.innerHTML = `<div style="position:absolute;z-index:60;pointer-events:none;${style}">${UI.tooltip(Object.assign({}, tip, { placement: place, arrowOffset }))}</div>`;
    }, 300);
  }
  function hideTip() { clearTimeout(tipTimer); tipShown = false; const l = document.getElementById('tip-layer'); if (l) l.innerHTML = ''; if (pendingRender) { pendingRender = false; render(); } }

  // ---- actions ----
  const LIVE = window.HUD_LIVE || null;
  const fail = (e) => toast((e && e.message) || 'Something went wrong.', 'err');
  function setMode(mode) { S.mode = mode; render(); }
  function pick(code) { S.selected = code; if (globe) globe.focus(code); recolor(); render(); }
  function onBuild(type) {
    const B = IAP.BUILDINGS[type], s = sc();
    const afford = Object.keys(B.cost).every((k) => (s.res[k] || 0) >= B.cost[k]);
    if (!afford) return toast('Not enough resources.', 'err');
    if (LIVE) { LIVE.api.build(S.selected, type).then(() => { toast(B.name + ' started.', 'ok'); liveRefresh(); }).catch(fail); return; }
    S.queue.push({ type, status: 'building', country: S.selected, started: S.day, complete_at: S.day + B.build_ticks });
    render();   // toast() no longer re-renders the panels; mock mutators render themselves
    toast(B.name + ' started.', 'ok');
  }
  function onTrain(u) {
    const at = S.selected, U = D.UNITS[u];
    if (LIVE) { LIVE.api.train(at, u, 1).then((resp) => { const rd = resp && resp.started && resp.started[0] && resp.started[0].ready_tick; toast('Training 5 ' + U.name.toLowerCase() + ' in ' + cname(at) + (rd ? ' · ready Day ' + rd : '') + '.', 'ok'); liveRefresh(); }).catch(fail); return; }
    const busy = S.training.filter((x) => x.at === at).length;
    if (busy >= slotsAt(at)) return toast('All ' + slotsAt(at) + ' training slots in ' + cname(at) + ' are busy. Build a Factory for another slot.', 'err');
    const ready = Math.floor(dayNow()) + U.build_ticks;
    S.training.push({ id: Math.random(), u, at, ready });
    render();   // toast() no longer re-renders the panels; mock mutators render themselves
    toast('Training 5 ' + U.name.toLowerCase() + ' in ' + cname(at) + ' · ready Day ' + ready + '.', 'ok');
  }
  function onMove(armyId, target, kind) {
    const a = S.armies.find((x) => x.id === armyId);
    if (LIVE) { LIVE.api.move(a ? a.srvId : armyId, target, kind || 'land').then(() => { toast('Marching on ' + cname(target) + '.', 'ok'); liveRefresh(); }).catch(fail); return; }
    toast('Marching on ' + cname(target) + '.', 'ok');
  }
  function onStrike(kind, from, target) {
    if (LIVE) { LIVE.api.strike({ kind, target: target || S.selected, from: from || undefined }).then(() => { toast('Strike on ' + cname(target || S.selected) + ' launched.', 'ok'); liveRefresh(); }).catch(fail); return; }
    toast('Strike launched.', 'ok');
  }
  function onResearch(key) {
    const t = S.tech.find((x) => x.key === key) || {};
    if (LIVE) { LIVE.api.research(key).then(() => { toast('Researching ' + (t.name || key) + '.', 'ok'); liveRefresh(); }).catch(fail); return; }
    toast('Researching ' + (t.name || key) + '.', 'ok');
  }
  function onDiplo(pid, act) {
    const p = S.players.find((x) => x.id === pid);
    if (LIVE) {
      const call = act === 'war' ? LIVE.api.declareWar(pid) : LIVE.api.propose(pid, act === 'break' ? 'break' : act);
      const msg = { war: 'War declared on ', break: 'Alliance ended with ', alliance: 'Alliance proposed to ', access: 'Military access requested from ', truce: 'Truce offered to ' }[act];
      call.then(() => { toast(msg + p.name + '.', act === 'war' ? 'err' : 'ok'); liveRefresh(); }).catch(fail);
      return;
    }
    if (act === 'war') { p.diplo = 'war'; toast('War declared on ' + p.name + '.', 'err'); S.events.unshift({ id: Math.random(), type: 'war', actor: 'You', text: 'declared war on ' + p.name, day: S.day }); render(); return; }
    if (act === 'break') { p.diplo = 'neutral'; toast('Alliance with ' + p.name + ' ended.', 'default'); render(); return; }
    S.proposals[pid + ':' + act] = { expires: S.day + 3 };
    render();   // toast() no longer re-renders the panels; mock mutators render themselves
    toast(({ alliance: 'Alliance proposed to ', access: 'Military access requested from ', truce: 'Truce offered to ' }[act]) + p.name + '. Waiting for a reply.', 'ok');
  }
  // Pull a fresh snapshot from the backend and fold it into the HUD state (live mode only).
  let lastSig = '';
  function liveRefresh() {
    if (!LIVE) return;
    LIVE.poll().then((snap) => {
      // Skip the whole re-render when nothing meaningful changed (most 3s polls land
      // between server ticks). This stops the HUD from rebuilding its panels — and
      // clobbering an open tooltip / hover — once a second for no reason.
      const sig = JSON.stringify([
        snap.DAY, (snap.events || []).length,
        snap.players.map((p) => [p.id, p.pop, p.lands.length, p.diplo, p.share]),
        snap.armies.map((a) => [a.owner, a.at, a.to, a.arriveDay, JSON.stringify(a.units)]),
        snap.scenarios.live.res, snap.buildingsHere.map((b) => [b.type, b.status, b.country]),
        (snap.TECH || []).map((t) => t.status), snap.ARSENAL, (snap.chat || []).length,
        (snap.training || []).map((t) => [t.at, t.u, t.ready]),
      ]);
      if (sig === lastSig) return;
      lastSig = sig;

      S.players = snap.players.map((p) => Object.assign({}, p, { lands: p.lands.slice() }));
      // Rebuild route geometry for marching armies (the snapshot carries codes but no three.js
      // geometry). Preserve the running animation of a march already in flight — same destination
      // and arrival — so the marker keeps gliding instead of snapping back to its origin each tick
      // (the "I never see the troops march, it vanishes next tick" bug).
      const prev = {}; S.armies.forEach((a) => { prev[a.id] = a; });
      S.armies = snap.armies.map((a) => {
        const b = Object.assign({}, a);
        if (b.codes && b.codes.length > 1 && globe && S.geoReady) {
          const old = prev[b.id];
          if (old && old.route && old.to === b.to && old.arriveDay === b.arriveDay) {
            b.route = old.route; b.start = old.start; b.dur = old.dur;
          } else {
            b.route = GEO.pathPoints(globe, b.codes, { lift: ROUTE_LIFT[b.kind] || 0, step: 0.5 });
            b.start = performance.now();
            b.dur = Math.max(500, ((b.arriveDay || S.day) - dayNow()) * clock.dayMs);
          }
        }
        return b;
      });
      S.events = snap.events; S.tech = snap.TECH; S.chat = snap.chat || [];   // mapSnapshot returns TECH (uppercase)
      S.training = (snap.training || []).slice();
      S.queue = snap.buildingsHere.slice(); D.scenarios.live = snap.scenarios.live; D.ARSENAL = snap.ARSENAL;
      D._defence = snap._defence; D._vision = snap._vision;
      // Keep the day in step with the server: re-anchor the local clock if it has drifted
      // a whole day from the authoritative current_tick (snap.DAY).
      if (snap.DAY != null && Math.abs(snap.DAY - Math.floor(dayNow())) >= 1) {
        clock.day0 = snap.DAY; clock.t0 = performance.now(); clock.into = 0; S.day = snap.DAY;
      }
      computeShares(S.geo ? S.geo.props : {});
      recolor(); renderRoutes(); renderMarkers(); renderBuildings();
      // Don't tear down the panels (and the hovered tooltip) mid-hover — defer the rebuild until
      // the tooltip closes, so info dialogs stop flashing/closing every tick.
      if (tipShown) pendingRender = true; else render();
    }).catch(() => {});
  }

  // Attach delegated listeners after each render.
  function wire() {
    const stage = document.getElementById('hud-stage');
    if (stage.__wired) return; // single delegated listener set survives re-renders (events bubble to stage)
    stage.__wired = true;
    stage.addEventListener('click', (e) => {
      const t = (sel) => e.target.closest(sel);
      let el;
      if ((el = t('[data-hotbar]'))) return setMode(el.getAttribute('data-hotbar'));
      if ((el = t('[data-tab]'))) { S.chatTab = el.getAttribute('data-tab'); render(); return; }
      if ((el = t('[data-scope]'))) { S.chatScope = el.getAttribute('data-scope'); render(); return; }
      if ((el = t('[data-build]'))) return onBuild(el.getAttribute('data-build'));
      if ((el = t('[data-train]'))) return onTrain(el.getAttribute('data-train'));
      if ((el = t('[data-move]'))) { const mv = el.getAttribute('data-move').split('|'); return onMove(mv[0], mv[1], mv[2]); }
      if ((el = t('[data-strike]'))) { const sk = el.getAttribute('data-strike').split('|'); return onStrike(sk[0], sk[1] || null, S.selected); }
      if ((el = t('[data-research]'))) return onResearch(el.getAttribute('data-research'));
      if ((el = t('[data-lens]'))) { S.lens = el.getAttribute('data-lens'); recolor(); render(); return; }
      if ((el = t('[data-zoom]'))) { if (globe) globe.camera.position.z = Math.max(1.6, Math.min(5, globe.camera.position.z + parseFloat(el.getAttribute('data-zoom')))); return; }
      if (t('[data-focus]')) { if (globe) globe.focus(me().country); return; }
      if ((el = t('[data-pick]'))) { const code = el.getAttribute('data-pick'); if (el.closest('[data-mk]')) { S.selected = code; setMode('army'); } else pick(code); return; }
      if ((el = t('[data-diplo-act]'))) { const p = el.closest('[data-diplo]'); return onDiplo(parseInt(p.getAttribute('data-diplo'), 10), el.getAttribute('data-diplo-act')); }
      if (t('[data-empty-attack]')) return setMode('army');
      if (t('[data-alert-action]')) { const al = deriveAlert(); if (al && al.target) { S.selected = al.target; S.mode = 'army'; if (globe) globe.focus(al.target); render(); } return; }
    });
    // tooltips via hover-intent (event delegation on the stage)
    stage.addEventListener('mouseover', (e) => { const el = e.target.closest('.iap-tip'); if (!el) return; const tip = resolveTip(el.getAttribute('data-tip')); showTip(tip, el, el.getAttribute('data-place') || 'bottom'); });
    stage.addEventListener('mouseout', (e) => { const el = e.target.closest('.iap-tip'); if (el) hideTip(); });
    stage.addEventListener('pointerdown', (e) => { if (e.target.closest('.iap-tip')) hideTip(); });
    // chat input: typing must not trigger hotbar shortcuts; Enter sends
    stage.addEventListener('keydown', (e) => {
      if (e.target.id === 'chat-input') { e.stopPropagation(); if (e.key === 'Enter') sendChat(e.target); }
    });
    stage.addEventListener('click', (e) => { if (e.target.closest('[data-send]')) { const inp = document.getElementById('chat-input'); if (inp) sendChat(inp); } }, true);
  }
  function sendChat(inp) {
    const v = inp.value.trim(); if (!v) return; inp.value = '';
    if (LIVE) { LIVE.api.chatSend(v, S.chatScope).catch(fail); return; }
    S.chat.push({ id: Math.random(), scope: S.chatScope, pid: me().id, body: v }); render();
  }

  // keyboard: B/A/R/T/D, ignored while typing in an input
  function onKey(e) {
    if (e.target.tagName === 'INPUT') return;
    const keys = { b: 'build', a: 'army', r: 'research', t: 'trade', d: 'diplomacy' };
    const m = keys[e.key.toLowerCase()];
    if (m) setMode(m);
  }

  // ---- globe colouring (lens + fog) ----
  function recolor() {
    if (!globe || !S.geo) return;
    const map = {};
    const vis = vision();
    if (S.lens === 'political') {
      const fogC = new THREE.Color(FOG_TINT);
      Object.keys(S.geo.props).forEach((c) => {
        const o = ownerOf(c);
        const col = new THREE.Color(o ? o.color : NEUTRAL_LAND);
        if (!vis.has(c)) col.lerp(fogC, o ? 0.6 : 0.5);
        map[c] = '#' + col.getHexString();
      });
      globe.setOwners(map); globe.setSelected(S.selected);
    } else {
      const hex = { farmland: HUD_RES.food.hex, minerals: HUD_RES.minerals.hex, oil: HUD_RES.oil.hex }[S.lens];
      const lo = new THREE.Color('#1c2740'), hi = new THREE.Color(hex);
      Object.keys(S.geo.props).forEach((c) => { map[c] = '#' + lo.clone().lerp(hi, Math.pow(S.geo.props[c][S.lens] / 100, 0.8)).getHexString(); });
      globe.setOwners(map); globe.setSelected(null);
    }
  }

  // ---- route lines on the globe ----
  const pathGroups = {};
  function renderRoutes() {
    if (!globe || !S.geoReady) return;
    const m = me(), vis = vision();
    const visibleArmies = S.armies.filter((a) => a.owner === m.id || alliedIds().has(a.owner) || (a.route ? seen(a.from, vis) || seen(a.to, vis) : seen(a.at, vis)));
    const want = {};
    visibleArmies.filter((a) => a.route).forEach((a) => { want[a.id] = a; });
    Object.keys(pathGroups).forEach((id) => { if (!want[id]) { globe.removePath(pathGroups[id]); delete pathGroups[id]; } });
    Object.values(want).forEach((a) => {
      if (pathGroups[a.id]) return;
      const col = (allPlayers().find((p) => p.id === a.owner) || {}).color || '#fff';
      pathGroups[a.id] = globe.addPath(a.route, { color: col, opacity: 0.95, radius: 0.004, dash: 2 });
    });
  }

  // Scale the fixed 1440×900 design stage to fit the viewport (contain), exactly as the
  // mockup does (MatchHud.jsx: min(innerWidth/1440, innerHeight/900)). Publishes
  // window.__hudScale for the tooltip/cursor math. At the harness's 1440×900 viewport
  // k === 1, so the transform is identity and the visual diffs are unaffected.
  function fitStage() {
    const k = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
    window.__hudScale = k;
    const stage = document.getElementById('hud-stage');
    if (stage) stage.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
  }

  // ---- bootstrap ----
  function boot() {
    const params = new URLSearchParams(location.search);
    BROKE = params.get('broke') === '1';
    // (scenario/mode query params are accepted but ignored, matching the mockup.)
    if (LIVE) S.scenario = 'live';   // use the live scenario from the very first render

    fitStage();
    window.addEventListener('resize', fitStage);

    globe = new window.Globe(document.getElementById('globe'), { autoRotate: false });
    globe.setSelectable(true);
    globe.camera.position.z = 2.6;
    globe.load(IAP.GEO_URL).then(() => {
      const props = {}, feats = {};
      Object.keys(globe.props).forEach((c) => { props[c] = globe.props[c]; });
      fetch(IAP.GEO_URL).then((r) => r.json()).then((fc) => {
        fc.features.forEach((f) => { feats[f.properties.code] = f; });
        GEO.build(fc);
        computeShares(props);
        S.geo = { props, feats }; S.geoReady = true;
        if (LIVE) {
          // Live armies come from the backend snapshot; rebuild route geometry for any in transit.
          S.scenario = 'live';
          S.armies = D.armies.map((a) => { const b = Object.assign({}, a, { units: Object.assign({}, a.units) }); if (b.codes && b.codes.length > 1) { b.route = GEO.pathPoints(globe, b.codes, { lift: ROUTE_LIFT[b.kind] || 0, step: 0.5 }); b.start = performance.now(); b.dur = Math.max(500, ((b.arriveDay || S.day) - dayNow()) * clock.dayMs); } return b; });
          // Buildings come from the snapshot with their real countries (the mock default forces SWE).
          S.queue = (D.buildingsHere || []).slice();
          // Open on the player's own country so the context panel + Build work right away.
          const myC = me() && me().country; if (myC) { S.selected = myC; globe.setSelected(myC); globe.focus(myC); }
        } else {
          // launch the incoming attack march (attack scenario is always active in mock)
          const base = D.armies.map((a) => Object.assign({}, a, { units: Object.assign({}, a.units) }));
          D.incoming.forEach((i) => base.push(launch(i.owner, Object.assign({}, i.units), [i.from, i.to], 'land', i.days, i.id)));
          S.armies = base;
        }
        globe.onHover((c, p) => onHover(c ? { code: c, props: p } : null));
        globe.onSelect((c) => pick(c));
        recolor();
        renderRoutes();
        render();
        renderMarkers(true);
        renderBuildings(true);
      });
      globe.focus('SWE'); globe._targetRotX = Math.min(globe._targetRotX, 0.92);
      // The globe free-runs its focus ease (same 0.08/frame as the mockup) so the army-marker overlay's
      // projected positions co-vary with the reference's as both pages ease under the harness's shared
      // timing. (A fixed snap was tried and rejected — it can't track the reference's per-capture jitter.)
    });
    render();
    markerLoop();
    window.addEventListener('keydown', onKey);

    // Clock tick drives Day + countdown. Update the clock text surgically (not a full re-render)
    // so the main thread stays free for the globe's ease rAF — a full innerHTML rebuild each second
    // stalls easing and shifts the projected markers. A full render only runs when the Day rolls over
    // (that changes other regions, e.g. the alert's arrival day).
    const tick = () => {
      const d = dayNow(), whole = Math.floor(d);
      const s = Math.max(1, Math.ceil((1 - (d - whole)) * D.TICK_SEC));
      if (whole !== S.day) { S.day = whole; S.secs = s; render(); return; }
      if (s !== S.secs) {
        S.secs = s;
        const dsec = document.getElementById('clk-secs'); if (dsec) dsec.textContent = String(s).padStart(2, '0');
        const ring = document.getElementById('clk-ring'); if (ring) ring.innerHTML = Ring(1 - s / D.TICK_SEC, 42, 5, 'var(--gold-400)', `<i class="ph-fill ph-sun" style="font-size:18px;color:var(--gold-300)"></i>`);
      }
    };
    if (window.HUD_MOCK) {
      // Prototype mock mode: pin the countdown to the reference's deterministic capture value
      // (the mockup's live clock reads 0:07 at the harness's screenshot moment) so the clock region
      // diffs to zero instead of drifting ±1s. The live game ticks normally.
      S.secs = 7; S.day = D.DAY; render();
      return;
    }
    tick();
    setInterval(tick, 200);

    // Live mode: poll the backend every 3s (game.js polled at the same cadence) and refresh the HUD,
    // plus a best-effort WebSocket nudge if one is configured.
    if (LIVE) {
      setInterval(liveRefresh, 3000);
      if (window.WS_URL) {
        try {
          const ws = new WebSocket(window.WS_URL + '?match_id=' + LIVE.matchId);
          // Refresh on any real game event (strike, nuclear_strike, conquest, revolt,
          // research_complete, …) — not just a whitelist — so everything is realtime.
          ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (!m.event || m.event === 'ping' || m.event === 'connected') return; if (m.event === 'strike' || m.event === 'nuclear_strike') strikeFx(m.payload || {}); liveRefresh(); };
        } catch (e) { /* polling still works */ }
      }
    }
  }

  let cursor = { x: 0, y: 0 };
  function onHover(h) {
    const el = document.getElementById('hover-tip');
    if (!el) return;
    if (!h) { el.style.display = 'none'; return; }
    const owner = ownerOf(h.code), p = h.props, attr = S.lens !== 'political' ? S.lens : null, fog = fogged(h.code);
    el.innerHTML = `<div style="position:absolute;left:${cursor.x + 18}px;top:${cursor.y + 18}px;padding:9px 12px;border-radius:10px;background:rgba(10,14,26,.94);border:1px solid var(--border-glow);box-shadow:0 8px 24px rgba(0,0,0,.5);min-width:160px">`
      + `<div style="font:italic 900 19px/1 var(--font-display);text-transform:uppercase;color:#fff">${esc(p.name)}</div>`
      + `<div style="display:flex;align-items:center;gap:5px;margin-top:5px;font:600 12px/1 var(--font-body);color:${owner ? (owner.me ? 'var(--teal-300)' : '#fff') : 'var(--text-muted)'}">${owner ? `<span style="width:9px;height:9px;border-radius:3px;background:${owner.color}"></span>` : ''}${owner ? (owner.me ? 'Yours' : esc(owner.name)) : 'Neutral'}</div>`
      + `<div style="display:flex;gap:10px;margin-top:7px;font:italic 800 14px/1 var(--font-display);color:#fff">${[['farmland', 'food'], ['minerals', 'minerals'], ['oil', 'oil']].map(([a, r]) => `<span style="display:inline-flex;align-items:center;gap:3px;opacity:${attr && attr !== a ? 0.45 : 1}"><i class="ph-fill ph-${HUD_RES[r].icon}" style="color:${HUD_RES[r].color};font-size:12px"></i>${p[a]}</span>`).join('')}</div>`
      + (fog ? `<div style="display:flex;align-items:center;gap:5px;margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08);font:500 11px/1 var(--font-body);color:var(--navy-300)"><i class="ph-fill ph-eye-slash"></i>Troops hidden by fog of war</div>` : '')
      + `</div>`;
    el.style.display = 'block';
  }

  window.hudNum = window.hudNum || hudNum;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('pointermove', (e) => { const stage = document.getElementById('hud-stage'); if (!stage) return; const r = stage.getBoundingClientRect(), k = window.__hudScale || 1; cursor = { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; });
})();
