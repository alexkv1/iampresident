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

// ---- emit SQL ---------------------------------------------------------------
let sql = '-- GENERATED by worker/gen_countries.js — do not edit by hand.\n';
sql += 'SET NAMES utf8mb4;\n';
sql += 'DELETE FROM `country_neighbors`;\nDELETE FROM `countries`;\n\n';

sql += 'INSERT INTO `countries` (`code`,`code2`,`name`,`continent`,`region`,`subregion`,`pop_est`,`gdp_md`,`land_slots`,`farmland`,`minerals`,`oil`,`start_pop`,`lon`,`lat`) VALUES\n';
sql += rows.map(r =>
  `('${r.code}',${r.code2 ? `'${r.code2}'` : 'NULL'},'${esc(r.name)}',` +
  `${r.continent ? `'${esc(r.continent)}'` : 'NULL'},${r.region ? `'${esc(r.region)}'` : 'NULL'},${r.subregion ? `'${esc(r.subregion)}'` : 'NULL'},` +
  `${r.pop_est},${r.gdp_md},${r.land_slots},${r.farmland},${r.minerals},${r.oil},${r.start_pop},${r.lon},${r.lat})`
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
    },
    geometry: r.geometry,
  })),
};
fs.writeFileSync(GEO_OUT, JSON.stringify(fc));

console.log(`Wrote ${rows.length} countries, ${neighbors.length / 2} adjacency pairs`);
console.log(`  -> ${path.relative(ROOT, OUT)}`);
console.log(`  -> ${path.relative(ROOT, GEO_OUT)}`);
