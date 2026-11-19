// Small HUD building blocks for the Match HUD mockup (kit-local; candidates for promotion into components/).
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
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

function hudSurface(solid) {
  return solid ? { background: 'linear-gradient(180deg,#1a2747 0%,#121a2e 100%)', backdropFilter: 'none', WebkitBackdropFilter: 'none' } : {};
}

function Eyebrow({ children, color = 'var(--text-muted)', style }) {
  return <div style={{ font: '600 11px/1 var(--font-body)', textTransform: 'uppercase', letterSpacing: '.08em', color, ...style }}>{children}</div>;
}

function Meter({ value, max = 1, color = 'var(--teal-400)', height = 8, marker }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0)) * 100;
  return (
    <div style={{ position: 'relative', height, borderRadius: 999, background: 'var(--navy-950)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.6)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%', borderRadius: 999, background: 'linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,0) 65%), ' + color, transition: 'width .5s var(--ease-out)' }} />
      {marker != null ? <div style={{ position: 'absolute', left: marker * 100 + '%', top: -4, bottom: -4, width: 3, marginLeft: -1, background: 'var(--gold-300)', borderRadius: 2, boxShadow: '0 0 8px rgba(245,185,66,.9)' }} /> : null}
    </div>
  );
}

function Ring({ pct, size = 44, stroke = 5, color = 'var(--gold-400)', children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(6,10,20,.7)" stroke="var(--navy-700)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

function Tile({ icon, tone = 'var(--sky-500)', size = 40, iconSize }) {
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size / 4), flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ' + tone, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.35)' }}>
      <i className={'ph-fill ph-' + icon} style={{ fontSize: iconSize || Math.round(size * 0.55), color: '#fff', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))' }} />
    </span>
  );
}

function Cost({ cost, have, size = 12 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', font: '600 ' + size + 'px/1 var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
      {Object.keys(cost).map((k) => {
        const short = have && (have[k] || 0) < cost[k];
        return (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: short ? 'var(--red-300)' : 'var(--text-body)' }}>
            <i className={'ph-fill ph-' + HUD_RES[k].icon} style={{ color: HUD_RES[k].color, fontSize: size + 1 }} />{cost[k]}
          </span>
        );
      })}
    </span>
  );
}

function KeyCap({ k, style }) {
  return <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 20, height: 20, padding: '0 5px', borderRadius: 5, background: 'var(--navy-950)', border: '1px solid var(--navy-500)', boxShadow: '0 2px 0 #000', font: '700 11px/1 var(--font-body)', color: 'var(--navy-200)', ...style }}>{k}</span>;
}

function Silhouette({ d, color = '#fff', size = 48 }) {
  if (!d) return <i className="ph-fill ph-flag-banner" style={{ fontSize: size * 0.6, color }} />;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.45))' }}>
      <path d={d} fill={color} stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function TabPlates({ tabs, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button key={t.value} type="button" onClick={() => onChange(t.value)} style={{ border: 0, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', transform: 'skewX(var(--skew))', background: on ? 'var(--grad-gold)' : 'rgba(255,255,255,.06)', boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,.45), 0 3px 0 var(--gold-700)' : 'inset 0 0 0 1px var(--navy-600)', color: on ? 'var(--gold-900)' : 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, transform: 'skewX(calc(var(--skew) * -1))', font: 'italic 800 15px/1 var(--font-display)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {t.icon ? <i className={'ph-fill ph-' + t.icon} style={{ fontSize: 13 }} /> : null}{t.label}
              {t.count ? <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: on ? 'var(--gold-900)' : 'var(--red-500)', color: on ? 'var(--gold-300)' : '#fff', font: '700 10px/16px var(--font-body)', fontStyle: 'normal' }}>{t.count}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const DIPLO = {
  allied: { label: 'Allied', icon: 'handshake', kind: 'ready', color: 'var(--green-300)' },
  war: { label: 'At war', icon: 'sword', kind: 'danger', color: 'var(--red-300)' },
  truce: { label: 'Truce', icon: 'flag', kind: 'host', color: 'var(--sky-300)' },
  neutral: { label: 'Neutral', icon: 'minus-circle', kind: 'default', color: 'var(--text-muted)' },
};

// ---- Explainer tooltips -------------------------------------------------
// <Tip tip={{title, body, icon, tone, keyHint, stats}} place="bottom" style={…}>…</Tip>
// Renders a div (pass layout styles through `style`); MatchHud's TipLayer positions the DS Tooltip.
const HudTipCtx = React.createContext({ show() {}, hide() {} });

function Tip({ tip, place = 'bottom', style, children, ...rest }) {
  const ctx = React.useContext(HudTipCtx);
  const ref = React.useRef(null);
  return (
    <div ref={ref} onMouseEnter={() => ctx.show(typeof tip === 'function' ? tip() : tip, ref.current, place)} onMouseLeave={ctx.hide} onPointerDown={ctx.hide} style={style} {...rest}>
      {children}
    </div>
  );
}

Object.assign(window, { HUD_RES, hudNum, hudSurface, Eyebrow, Meter, Ring, Tile, Cost, KeyCap, Silhouette, TabPlates, DIPLO, HudTipCtx, Tip });
