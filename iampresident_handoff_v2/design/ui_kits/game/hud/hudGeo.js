// Geography helpers for troop movement: centroids, land adjacency, route planning, great-circle paths.
// Pure JS; needs a Globe instance only for lonLatVec (globe-local coordinates).
window.HUD_GEO = (function () {
  const cent = {}, adj = {}, coast = {};
  const TERRAIN = { mountains: ['CHE', 'AUT', 'NPL', 'BTN', 'AFG', 'BOL', 'PER', 'NOR', 'GEO', 'ARM', 'KGZ', 'TJK'], forest: ['BRA', 'COD', 'COG', 'GAB', 'CMR', 'IDN', 'PNG', 'FIN', 'SWE', 'CAN'] };
  const TERRAIN_MULT = { plains: 1, forest: 1.2, mountains: 1.5 };
  // Readable "staging" points for countries whose largest-polygon centroid sits far from where the action is.
  const CENTROID_OVERRIDE = { RUS: [44, 57], USA: [-98, 39], CAN: [-100, 56], NOR: [10, 61.5], FRA: [2.5, 46.6], CHL: [-71, -33], IDN: [113, -1] };
  // Safety net in case simplified borders don't share an exact vertex.
  const EXTRA_LINKS = [['SWE', 'FIN'], ['SWE', 'NOR'], ['FIN', 'NOR'], ['FIN', 'RUS'], ['NOR', 'RUS'], ['EST', 'RUS'], ['EST', 'LVA'], ['LVA', 'LTU'], ['LVA', 'RUS'], ['LVA', 'BLR'], ['LTU', 'BLR'], ['LTU', 'POL'], ['LTU', 'RUS'], ['DNK', 'DEU'], ['DEU', 'POL'], ['DEU', 'NLD'], ['DEU', 'BEL'], ['DEU', 'FRA'], ['FRA', 'BEL'], ['FRA', 'ESP'], ['RUS', 'MNG'], ['RUS', 'KAZ'], ['RUS', 'CHN'], ['RUS', 'PRK'], ['PRK', 'KOR'], ['PRK', 'CHN']];

  function link(a, b) { if (a === b) return; (adj[a] = adj[a] || new Set()).add(b); (adj[b] = adj[b] || new Set()).add(a); }

  function centroidOf(f) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let best = null, bestA = 0;
    for (const p of polys) {
      const ring = p[0];
      const lons = ring.map((c) => c[0]);
      const wrap = Math.max(...lons) - Math.min(...lons) > 180;
      const r = ring.map((c) => [wrap && c[0] < 0 ? c[0] + 360 : c[0], c[1]]);
      let a = 0, cx = 0, cy = 0;
      for (let i = 0; i < r.length - 1; i++) {
        const cr = r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
        a += cr; cx += (r[i][0] + r[i + 1][0]) * cr; cy += (r[i][1] + r[i + 1][1]) * cr;
      }
      a /= 2;
      if (Math.abs(a) > bestA && a !== 0) { bestA = Math.abs(a); best = [cx / (6 * a), cy / (6 * a)]; }
    }
    if (!best) best = polys[0][0][0];
    let lon = best[0]; if (lon > 180) lon -= 360;
    return [lon, best[1]];
  }

  function build(fc) {
    const pts = {};
    for (const f of fc.features) {
      const code = f.properties.code;
      cent[code] = CENTROID_OVERRIDE[code] || centroidOf(f);
      adj[code] = adj[code] || new Set();
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const p of polys) for (const ring of p) for (const c of ring) {
        const k = Math.round(c[0] * 20) + ',' + Math.round(c[1] * 20);
        (pts[k] = pts[k] || new Set()).add(code);
      }
    }
    Object.values(pts).forEach((s) => { if (s.size > 1) { const a = [...s]; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) link(a[i], a[j]); } else { coast[[...s][0]] = true; } });
    EXTRA_LINKS.forEach(([a, b]) => { if (cent[a] && cent[b]) link(a, b); });
  }

  const neighbors = (c) => [...(adj[c] || [])];

  // Shortest land path from -> to where every intermediate country passes `passable(code)`.
  function landPath(from, to, passable) {
    if (from === to) return [from];
    const prev = { [from]: null }, q = [from];
    while (q.length) {
      const c = q.shift();
      for (const n of neighbors(c)) {
        if (n in prev) continue;
        if (n !== to && !passable(n)) continue;
        prev[n] = c;
        if (n === to) { const path = [to]; let x = c; while (x) { path.unshift(x); x = prev[x]; } return path; }
        q.push(n);
      }
    }
    return null;
  }

  function angleDeg(a, b) {
    const ca = cent[a], cb = cent[b];
    const r = Math.PI / 180;
    const d = Math.sin(ca[1] * r) * Math.sin(cb[1] * r) + Math.cos(ca[1] * r) * Math.cos(cb[1] * r) * Math.cos((ca[0] - cb[0]) * r);
    return Math.acos(Math.max(-1, Math.min(1, d))) / r;
  }

  // Globe-local 3D points along consecutive great circles through `codes`.
  // lift: 0 = hug the ground; >0 = arc up by that much at the midpoint of each leg (sea/air).
  function pathPoints(globe, codes, { alt = 1.012, lift = 0, step = 0.8 } = {}) {
    const out = [];
    for (let i = 0; i < codes.length - 1; i++) {
      const A = globe.lonLatVec(cent[codes[i]][0], cent[codes[i]][1], 1), B = globe.lonLatVec(cent[codes[i + 1]][0], cent[codes[i + 1]][1], 1);
      const dot = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]));
      const om = Math.acos(dot), deg = (om * 180) / Math.PI, n = Math.max(2, Math.ceil(deg / step));
      for (let k = i === 0 ? 0 : 1; k <= n; k++) {
        const t = k / n;
        const s0 = om < 1e-6 ? 1 - t : Math.sin((1 - t) * om) / Math.sin(om), s1 = om < 1e-6 ? t : Math.sin(t * om) / Math.sin(om);
        const h = alt + lift * Math.sin(Math.PI * t) * Math.min(1, deg / 25);
        out.push([(A[0] * s0 + B[0] * s1) * h, (A[1] * s0 + B[1] * s1) * h, (A[2] * s0 + B[2] * s1) * h]);
      }
    }
    return out;
  }

  // Position at fraction t (0..1) along a polyline, by arc length.
  function pointAt(pts, t) {
    if (!pts._len) {
      let L = 0; pts._cum = [0];
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; L += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); pts._cum.push(L); }
      pts._len = L;
    }
    const target = Math.max(0, Math.min(1, t)) * pts._len;
    let i = 1; while (i < pts.length - 1 && pts._cum[i] < target) i++;
    const seg = pts._cum[i] - pts._cum[i - 1] || 1, f = (target - pts._cum[i - 1]) / seg, a = pts[i - 1], b = pts[i];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  const km = (a, b) => angleDeg(a, b) * 111.2;
  const pathKm = (codes) => { let s = 0; for (let i = 0; i < codes.length - 1; i++) s += km(codes[i], codes[i + 1]); return s * 1.2; };
  const terrain = (c) => (TERRAIN.mountains.includes(c) ? 'mountains' : TERRAIN.forest.includes(c) ? 'forest' : 'plains');
  return { build, neighbors, landPath, angleDeg, km, pathKm, coastal: (c) => !!coast[c], terrain, terrainMult: (c) => TERRAIN_MULT[terrain(c)], pathPoints, pointAt, centroid: (c) => cent[c] };
})();
