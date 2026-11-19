// Small HUD building blocks — vanilla-JS port of design/ui_kits/game/hud/HudParts.jsx.
// Each helper returns an HTML string with inline styles copied verbatim from the JSX.
(function () {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const HUD_RES = {
    food: { icon: 'grains', color: 'var(--res-food)', hex: '#7bc86c', label: 'Food' },
    energy: { icon: 'lightning', color: 'var(--res-energy)', hex: '#f5d14e', label: 'Energy' },
    minerals: { icon: 'diamond', color: 'var(--res-minerals)', hex: '#c9d4ea', label: 'Minerals' },
    gold: { icon: 'coins', color: 'var(--res-gold)', hex: '#f5b942', label: 'Gold' },
    oil: { icon: 'drop', color: 'var(--res-oil)', hex: '#a885d8', label: 'Oil' },
    research: { icon: 'flask', color: 'var(--res-research)', hex: '#4fd1c5', label: 'Research' },
  };

  function hudNum(n) {
    n = Number(n) || 0; const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e8 ? 0 : 1) + 'M';
    if (a >= 1e5) return Math.round(n / 1e3) + 'K';
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  const ic = (name, weight, style) => `<i class="ph-${weight || 'fill'} ph-${name}"${style ? ` style="${style}"` : ''}></i>`;

  function Eyebrow(children, color, style) {
    color = color || 'var(--text-muted)';
    return `<div style="font:600 11px/1 var(--font-body);text-transform:uppercase;letter-spacing:.08em;color:${color};${style || ''}">${children}</div>`;
  }

  function Meter(value, max, color, height, marker) {
    max = max == null ? 1 : max; color = color || 'var(--teal-400)'; height = height || 8;
    const pct = Math.max(0, Math.min(1, max ? value / max : 0)) * 100;
    const m = marker != null ? `<div style="position:absolute;left:${marker * 100}%;top:-4px;bottom:-4px;width:3px;margin-left:-1px;background:var(--gold-300);border-radius:2px;box-shadow:0 0 8px rgba(245,185,66,.9)"></div>` : '';
    return `<div style="position:relative;height:${height}px;border-radius:999px;background:var(--navy-950);box-shadow:inset 0 1px 2px rgba(0,0,0,.6)">`
      + `<div style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;border-radius:999px;background:linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 65%), ${color};transition:width .5s var(--ease-out)"></div>${m}</div>`;
  }

  // Countdown ring (SVG). Masked by the harness, but rendered faithfully.
  function Ring(pct, size, stroke, color, inner) {
    size = size || 44; stroke = stroke || 5; color = color || 'var(--gold-400)';
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0">`
      + `<svg width="${size}" height="${size}" style="transform:rotate(-90deg);display:block">`
      + `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="rgba(6,10,20,.7)" stroke="var(--navy-700)" stroke-width="${stroke}"></circle>`
      + `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" style="transition:stroke-dashoffset 1s linear"></circle>`
      + `</svg><div style="position:absolute;inset:0;display:grid;place-items:center">${inner || ''}</div></div>`;
  }

  function Tile(icon, tone, size, iconSize) {
    tone = tone || 'var(--sky-500)'; size = size || 40;
    return `<span style="width:${size}px;height:${size}px;border-radius:${Math.round(size / 4)}px;flex-shrink:0;display:grid;place-items:center;background:linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ${tone};box-shadow:inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.35)">`
      + `<i class="ph-fill ph-${icon}" style="font-size:${iconSize || Math.round(size * 0.55)}px;color:#fff;filter:drop-shadow(0 2px 0 rgba(0,0,0,.3))"></i></span>`;
  }

  function Cost(cost, have, size) {
    size = size || 12;
    return `<span style="display:inline-flex;gap:8px;flex-wrap:wrap;font:600 ${size}px/1 var(--font-body);font-variant-numeric:tabular-nums">`
      + Object.keys(cost).map((k) => {
        const short = have && (have[k] || 0) < cost[k];
        return `<span style="display:inline-flex;align-items:center;gap:3px;color:${short ? 'var(--red-300)' : 'var(--text-body)'}">`
          + `<i class="ph-fill ph-${HUD_RES[k].icon}" style="color:${HUD_RES[k].color};font-size:${size + 1}px"></i>${cost[k]}</span>`;
      }).join('') + `</span>`;
  }

  function KeyCap(k, style) {
    return `<span style="display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:5px;background:var(--navy-950);border:1px solid var(--navy-500);box-shadow:0 2px 0 #000;font:700 11px/1 var(--font-body);color:var(--navy-200);${style || ''}">${k}</span>`;
  }

  function Silhouette(d, color, size) {
    color = color || '#fff'; size = size || 48;
    if (!d) return `<i class="ph-fill ph-flag-banner" style="font-size:${size * 0.6}px;color:${color}"></i>`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="display:block;filter:drop-shadow(0 2px 0 rgba(0,0,0,.45))"><path d="${d}" fill="${color}" stroke="rgba(255,255,255,.7)" stroke-width="1.5" stroke-linejoin="round"></path></svg>`;
  }

  // tabs: [{value,label,icon,count}]; `on` is the active value. data-tab on each button.
  function TabPlates(tabs, value) {
    return `<div style="display:flex;gap:6px">` + tabs.map((t) => {
      const on = t.value === value;
      const count = t.count ? `<span style="min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:${on ? 'var(--gold-900)' : 'var(--red-500)'};color:${on ? 'var(--gold-300)' : '#fff'};font:700 10px/16px var(--font-body);font-style:normal">${t.count}</span>` : '';
      return `<button type="button" data-tab="${t.value}" style="border:0;padding:6px 12px;border-radius:6px;cursor:pointer;transform:skewX(var(--skew));background:${on ? 'var(--grad-gold)' : 'rgba(255,255,255,.06)'};box-shadow:${on ? 'inset 0 1px 0 rgba(255,255,255,.45), 0 3px 0 var(--gold-700)' : 'inset 0 0 0 1px var(--navy-600)'};color:${on ? 'var(--gold-900)' : 'var(--text-muted)'}">`
        + `<span style="display:inline-flex;align-items:center;gap:6px;transform:skewX(calc(var(--skew) * -1));font:italic 800 15px/1 var(--font-display);text-transform:uppercase;letter-spacing:.04em">`
        + `${t.icon ? `<i class="ph-fill ph-${t.icon}" style="font-size:13px"></i>` : ''}${t.label}${count}</span></button>`;
    }).join('') + `</div>`;
  }

  const DIPLO = {
    allied: { label: 'Allied', icon: 'handshake', kind: 'ready', color: 'var(--green-300)' },
    war: { label: 'At war', icon: 'sword', kind: 'danger', color: 'var(--red-300)' },
    truce: { label: 'Truce', icon: 'flag', kind: 'host', color: 'var(--sky-300)' },
    neutral: { label: 'Neutral', icon: 'minus-circle', kind: 'default', color: 'var(--text-muted)' },
  };

  window.HUD = Object.assign(window.HUD || {}, { esc, ic, HUD_RES, hudNum, Eyebrow, Meter, Ring, Tile, Cost, KeyCap, Silhouette, TabPlates, DIPLO });
  window.hudNum = hudNum; // exposed for test-hud.mjs
})();
