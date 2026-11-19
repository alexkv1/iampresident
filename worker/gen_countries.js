#!/usr/bin/env node
/**
 * gen_countries.js
 * Reads public/assets/countries-110m.geojson (Natural Earth) and emits
 * db/seeds/countries.sql: one row per country with gameplay attributes
 * derived from real-world geography, plus a land-adjacency table used for
 * army movement / conquest.
 *
 *   node worker/gen_countries.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GEO = path.join(ROOT, 'public/assets/countries-110m.geojson');
const OUT = path.join(ROOT, 'db/seeds/countries.sql');

const gj = JSON.parse(fs.readFileSync(GEO, 'utf8'));

// ---- curated resource richness (0-100). Everything else is derived. --------
const MINERALS = {
  AUS:90, COD:95, CHL:85, RUS:85, CHN:80, ZAF:88, CAN:80, BRA:78, PER:82,
  USA:70, KAZ:75, IND:65, IDN:70, ARG:55, BOL:72, ZMB:78, GHA:62, MEX:68,
  SWE:66, UKR:60, TUR:50, MNG:72, PHL:55, VNM:48, COG:58, GIN:70, NAM:68,
};
const OIL = {
  SAU:98, RUS:90, USA:85, IRN:88, IRQ:86, ARE:85, KWT:85, VEN:92, NGA:72,
  CAN:80, NOR:76, QAT:82, KAZ:70, LBY:74, DZA:68, AGO:62, MEX:56, BRA:55,
  GBR:42, OMN:60, AZE:66, IDN:46, EGY:42, COL:46, MYS:46, SDN:40, ECU:44,
};
// climate factor for food potential, by UN subregion
const FARM = {
  'Northern Europe':0.62, 'Western Europe':0.78, 'Eastern Europe':0.72, 'Southern Europe':0.70,
  'Northern America':0.80, 'Central America':0.72, 'Caribbean':0.68,
  'South America':0.80,
  'Western Africa':0.55, 'Eastern Africa':0.50, 'Middle Africa':0.52, 'Southern Africa':0.48,
  'Northern Africa':0.20,
  'Western Asia':0.25, 'Central Asia':0.32, 'Southern Asia':0.78,
  'South-Eastern Asia':0.86, 'Eastern Asia':0.60,
  'Australia and New Zealand':0.42,
  'Melanesia':0.55, 'Polynesia':0.55, 'Micronesia':0.55,
  'Antarctica':0.0,
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const esc = s => String(s).replace(/'/g, "''");

// ---- phase-2 geography tables (mirror of client hud/hudGeo.js) -------------
// Keep these in sync with the client illustration so gameplay and HUD agree.
const TERRAIN = {
  mountains: ['CHE', 'AUT', 'NPL', 'BTN', 'AFG', 'BOL', 'PER', 'NOR', 'GEO', 'ARM', 'KGZ', 'TJK'],
  forest: ['BRA', 'COD', 'COG', 'GAB', 'CMR', 'IDN', 'PNG', 'FIN', 'SWE', 'CAN'],
};
// Readable "staging" points for countries whose largest-polygon centroid sits far from where the action is.
const CENTROID_OVERRIDE = { RUS: [44, 57], USA: [-98, 39], CAN: [-100, 56], NOR: [10, 61.5], FRA: [2.5, 46.6], CHL: [-71, -33], IDN: [113, -1] };
// Safety net in case simplified borders don't share an exact vertex.
const EXTRA_LINKS = [['SWE', 'FIN'], ['SWE', 'NOR'], ['FIN', 'NOR'], ['FIN', 'RUS'], ['NOR', 'RUS'], ['EST', 'RUS'], ['EST', 'LVA'], ['LVA', 'LTU'], ['LVA', 'RUS'], ['LVA', 'BLR'], ['LTU', 'BLR'], ['LTU', 'POL'], ['LTU', 'RUS'], ['DNK', 'DEU'], ['DEU', 'POL'], ['DEU', 'NLD'], ['DEU', 'BEL'], ['DEU', 'FRA'], ['FRA', 'BEL'], ['FRA', 'ESP'], ['RUS', 'MNG'], ['RUS', 'KAZ'], ['RUS', 'CHN'], ['RUS', 'PRK'], ['PRK', 'KOR'], ['PRK', 'CHN']];

const terrainOf = code =>
  TERRAIN.mountains.includes(code) ? 'mountains'
  : TERRAIN.forest.includes(code) ? 'forest'
  : 'plains';

// Area-weighted centroid of the largest polygon, antimeridian-aware.
// Ported verbatim from hud/hudGeo.js centroidOf().
function centroidOf(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
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

// Geodesic spherical polygon area in km^2 (sum outer rings, subtract holes).
function geodesicAreaKm2(geom) {
  const R = 6371, rad = Math.PI / 180;
  const ringArea = ring => {
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const lon1 = ring[i][0] * rad, lat1 = ring[i][1] * rad;
      const lon2 = ring[i + 1][0] * rad, lat2 = ring[i + 1][1] * rad;
      a += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs(a) * R * R / 2;
  };
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let total = 0;
  for (const p of polys) {
    for (let ri = 0; ri < p.length; ri++) {
      total += ri === 0 ? ringArea(p[ri]) : -ringArea(p[ri]);
    }
  }
  return Math.max(0, Math.round(total));
}

// flatten a geometry into an array of rings (each ring = [[lon,lat],...])
function ringsOf(geom) {
  if (!geom) return [];
  if (geom.type === 'Polygon') return geom.coordinates;
  if (geom.type === 'MultiPolygon') return geom.coordinates.flat();
  return [];
}

// rough spherical area (km^2) via shoelace scaled by cos(lat)
function areaKm2(rings) {
  const R = 111.32; // km per degree at equator
  let total = 0;
  for (const ring of rings) {
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
      const cosLat = Math.cos(((y1 + y2) / 2) * Math.PI / 180);
      a += (x1 * y2 - x2 * y1) * cosLat;
    }
    total += Math.abs(a) / 2;
  }
  return total * R * R;
}

function bboxOf(rings) {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const ring of rings)
    for (const [x, y] of ring) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

// ---- build per-country records ---------------------------------------------
const rows = [];
for (const f of gj.features) {
  const p = f.properties;
  if (p.CONTINENT === 'Antarctica') continue;

  let code = (p.ISO_A3 && p.ISO_A3 !== '-99') ? p.ISO_A3
           : (p.ADM0_ISO && p.ADM0_ISO.length === 3 && p.ADM0_ISO !== '-99') ? p.ADM0_ISO
           : (p.ISO_A3_EH && p.ISO_A3_EH !== '-99') ? p.ISO_A3_EH
           : (p.NAME || 'XXX').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  const code2 = (p.ISO_A2 && p.ISO_A2.length === 2) ? p.ISO_A2
              : (p.ISO_A2_EH && p.ISO_A2_EH.length === 2) ? p.ISO_A2_EH
              : null;
  const name = p.NAME_LONG || p.NAME || p.ADMIN;

  const rings = ringsOf(f.geometry);
  const area = Math.max(1, areaKm2(rings));
  const bb = bboxOf(rings);
  const logA = Math.log10(area);

  // land slots scale with area
  const landSlots = clamp(Math.round(5 + (logA - 3) * 5), 6, 40);

  // farmland: climate factor, damped by extreme latitude, mild size bonus
  let climate = FARM[p.SUBREGION] ?? 0.4;
  const absLat = Math.abs(bb.cy);
  if (absLat > 70) climate *= 0.15;
  else if (absLat > 60) climate *= 0.45;
  const sizeBonus = 0.6 + 0.4 * Math.min(1, area / 3_000_000);
  const farmland = clamp(Math.round(climate * 100 * sizeBonus), 3, 100);

  const minerals = MINERALS[code] ?? clamp(Math.round(8 + (logA - 3) * 6), 8, 45);
  const oil = OIL[code] ?? clamp(Math.round(4 + (logA - 4) * 3), 3, 22);

  const startPop = Math.max(500000, Math.round(Number(p.POP_EST) || 1_000_000));

  rows.push({
    code, code2, name,
    continent: p.CONTINENT, region: p.REGION_UN, subregion: p.SUBREGION,
    pop_est: Math.round(Number(p.POP_EST) || 0),
    gdp_md: Math.round(Number(p.GDP_MD) || 0),
    land_slots: landSlots, farmland, minerals, oil,
    start_pop: startPop,
    lon: +bb.cx.toFixed(5), lat: +bb.cy.toFixed(5),
    rings,
    geometry: f.geometry,
  });
}

// de-duplicate codes (Natural Earth can repeat -99 fallbacks)
const seen = new Set();
for (const r of rows) {
  let c = r.code, n = 1;
  while (seen.has(c)) c = r.code.slice(0, 2) + (n++);
  r.code = c;
  seen.add(c);
}

// ---- phase-2 computed geography (centroid, area, terrain, gdp fallback) -----
// Codes are now final (post-dedup), matching the emitted geo.json the client
// illustration consumes, so terrain/coastal/links line up with hud/hudGeo.js.
for (const r of rows) {
  const cen = CENTROID_OVERRIDE[r.code] || centroidOf(r.geometry);
  r.lon = +cen[0].toFixed(5);
  r.lat = +cen[1].toFixed(5);
  r.area_km2 = geodesicAreaKm2(r.geometry);
  r.terrain = terrainOf(r.code);
  // gdp_md fallback: ~$10k per-capita in millions USD when real GDP is missing.
  if (!r.gdp_md) r.gdp_md = Math.round(r.pop_est / 100);
}

// coastal: a vertex-grid cell owned by exactly one country marks it coastal.
const cell = {};
for (const r of rows) {
  const polys = r.geometry.type === 'Polygon' ? [r.geometry.coordinates] : r.geometry.coordinates;
  for (const p of polys) for (const ring of p) for (const c of ring) {
    const k = Math.round(c[0] * 20) + ',' + Math.round(c[1] * 20);
    (cell[k] = cell[k] || new Set()).add(r.code);
  }
}
const coast = new Set();
for (const s of Object.values(cell)) if (s.size === 1) coast.add([...s][0]);
for (const r of rows) r.coastal = coast.has(r.code) ? 1 : 0;

// ---- land adjacency via vertex proximity -----------------------------------
const THRESH = 0.8;           // degrees ~ 88km, catches shared land borders
const STEP = 3;               // sample every Nth vertex for speed
function sampledPoints(r) {
  const pts = [];
  for (const ring of r.rings)
    for (let i = 0; i < ring.length; i += STEP) pts.push(ring[i]);
  return pts;
}
const pts = rows.map(sampledPoints);
const bbs = rows.map(r => bboxOf(r.rings));
const neighbors = [];
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const a = bbs[i], b = bbs[j];
    if (a.maxX + THRESH < b.minX || b.maxX + THRESH < a.minX) continue;
    if (a.maxY + THRESH < b.minY || b.maxY + THRESH < a.minY) continue;
    let touch = false;
    const A = pts[i], B = pts[j];
    outer:
    for (const [ax, ay] of A)
      for (const [bx, by] of B) {
        if (Math.abs(ax - bx) < THRESH && Math.abs(ay - by) < THRESH) { touch = true; break outer; }
      }
    if (touch) { neighbors.push([rows[i].code, rows[j].code]); neighbors.push([rows[j].code, rows[i].code]); }
  }
}

// safety net: add every hudGeo.js EXTRA_LINKS pair (both directions), de-duped.
const validCode = new Set(rows.map(r => r.code));
for (const [a, b] of EXTRA_LINKS) {
  if (validCode.has(a) && validCode.has(b)) {
    neighbors.push([a, b]);
    neighbors.push([b, a]);
  }
}
const nseen = new Set();
const dedupedNeighbors = [];
for (const [a, b] of neighbors) {
  const k = a + '\x00' + b;
  if (nseen.has(k)) continue;
  nseen.add(k);
  dedupedNeighbors.push([a, b]);
}
neighbors.length = 0;
neighbors.push(...dedupedNeighbors);

// ---- emit SQL ---------------------------------------------------------------
let sql = '-- GENERATED by worker/gen_countries.js — do not edit by hand.\n';
sql += 'SET NAMES utf8mb4;\n';
sql += 'DELETE FROM `country_neighbors`;\nDELETE FROM `countries`;\n\n';

sql += 'INSERT INTO `countries` (`code`,`code2`,`name`,`continent`,`region`,`subregion`,`pop_est`,`gdp_md`,`land_slots`,`farmland`,`minerals`,`oil`,`start_pop`,`lon`,`lat`,`area_km2`,`coastal`,`terrain`) VALUES\n';
sql += rows.map(r =>
  `('${r.code}',${r.code2 ? `'${r.code2}'` : 'NULL'},'${esc(r.name)}',` +
  `${r.continent ? `'${esc(r.continent)}'` : 'NULL'},${r.region ? `'${esc(r.region)}'` : 'NULL'},${r.subregion ? `'${esc(r.subregion)}'` : 'NULL'},` +
  `${r.pop_est},${r.gdp_md},${r.land_slots},${r.farmland},${r.minerals},${r.oil},${r.start_pop},${r.lon},${r.lat},${r.area_km2},${r.coastal},'${r.terrain}')`
).join(',\n') + ';\n\n';

if (neighbors.length) {
  sql += 'INSERT INTO `country_neighbors` (`country`,`neighbor`) VALUES\n';
  sql += neighbors.map(([a, b]) => `('${a}','${b}')`).join(',\n') + ';\n';
}

fs.writeFileSync(OUT, sql);

// ---- emit trimmed geojson for the frontend globe ---------------------------
// Same codes as the DB + gameplay attributes, so ownership colouring lines up.
const GEO_OUT = path.join(ROOT, 'public/assets/countries.geo.json');
const fc = {
  type: 'FeatureCollection',
  features: rows.map(r => ({
    type: 'Feature',
    properties: {
      code: r.code, name: r.name,
      farmland: r.farmland, minerals: r.minerals, oil: r.oil,
      land_slots: r.land_slots, pop: r.start_pop,
      continent: r.continent,
      area_km2: r.area_km2, coastal: r.coastal, terrain: r.terrain,
    },
    geometry: r.geometry,
  })),
};
fs.writeFileSync(GEO_OUT, JSON.stringify(fc));

console.log(`Wrote ${rows.length} countries, ${neighbors.length / 2} adjacency pairs`);
console.log(`  -> ${path.relative(ROOT, OUT)}`);
console.log(`  -> ${path.relative(ROOT, GEO_OUT)}`);
