import React from 'react';

const TIP_W = 260;
const TIP_EDGE = '1px solid rgba(124,196,255,.3)';
// rotate(45deg): top+left edges form the up-pointing tip, bottom+right the down tip, top+right the right tip, bottom+left the left tip.
const TIP_ARROW_EDGES = {
  bottom: { borderTop: TIP_EDGE, borderLeft: TIP_EDGE },
  top: { borderBottom: TIP_EDGE, borderRight: TIP_EDGE },
  left: { borderTop: TIP_EDGE, borderRight: TIP_EDGE },
  right: { borderBottom: TIP_EDGE, borderLeft: TIP_EDGE },
};

export function Tooltip({ title, body, icon, tone = 'var(--sky-500)', keyHint, stats = [], placement = 'bottom', arrowOffset, width = TIP_W, style }) {
  const arrow = 12;
  const arrowPos = {
    bottom: { top: -arrow / 2, left: (arrowOffset != null ? arrowOffset : width / 2) - arrow / 2 },
    top: { bottom: -arrow / 2, left: (arrowOffset != null ? arrowOffset : width / 2) - arrow / 2 },
    left: { right: -arrow / 2, top: '50%', marginTop: -arrow / 2 },
    right: { left: -arrow / 2, top: '50%', marginTop: -arrow / 2 },
  }[placement];
  return (
    <div role="tooltip" style={{
      position: 'relative', width: width, padding: '12px 14px', borderRadius: 12,
      background: 'linear-gradient(180deg,#1f2e50 0%,#131c33 100%)', border: '1px solid rgba(124,196,255,.3)',
      boxShadow: '0 14px 34px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.1)', color: 'var(--text-body)',
      animation: 'iap-tip-in 150ms var(--ease-out)', pointerEvents: 'none', ...style,
    }}>
      <span aria-hidden="true" style={{ position: 'absolute', width: arrow, height: arrow, transform: 'rotate(45deg)', background: placement === 'top' ? '#131c33' : '#1a2745', ...TIP_ARROW_EDGES[placement], ...arrowPos }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9 }}>
        {icon ? (
          <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ' + tone, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 2px 0 rgba(0,0,0,.35)' }}>
            <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: 15, color: '#fff', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.3))' }} />
          </span>
        ) : null}
        <span style={{ flex: 1, minWidth: 0, font: 'italic 800 19px/1 var(--font-display)', textTransform: 'uppercase', letterSpacing: '.02em', color: '#fff', textShadow: 'var(--text-shadow-display)' }}>{title}</span>
        {keyHint ? <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 20, height: 20, padding: '0 5px', borderRadius: 5, background: 'var(--navy-950)', border: '1px solid var(--navy-500)', boxShadow: '0 2px 0 #000', font: '700 11px/1 var(--font-body)', color: 'var(--navy-200)' }}>{keyHint}</span> : null}
      </div>
      {body ? <div style={{ position: 'relative', marginTop: 8, font: '400 13px/1.45 var(--font-body)', color: 'var(--navy-200)', textWrap: 'pretty' }}>{body}</div> : null}
      {stats.length ? (
        <div style={{ position: 'relative', marginTop: 10, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ font: '600 11px/1 var(--font-body)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '600 13px/1 var(--font-body)', color: s.color || '#fff', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {s.icon ? <i className={'ph-fill ph-' + s.icon} aria-hidden="true" style={{ fontSize: 13 }} /> : null}{s.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
