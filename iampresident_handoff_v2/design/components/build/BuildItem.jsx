import React from 'react';
import { resourceMeta } from '../hud/resourceMeta.js';

export function BuildItem({ name, icon = 'buildings', tone = 'var(--sky-500)', cost = {}, days, description, disabled = false, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const live = !disabled;
  const h = live && hover;
  return (
    <div
      role="button" tabIndex={disabled ? -1 : 0} title={description}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPressed(false); }}
      onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius)',
        border: '1px solid ' + (h ? 'var(--teal-400)' : 'var(--navy-600)'), background: 'var(--grad-navy)',
        boxShadow: '0 ' + (live && pressed ? 1 : 3) + 'px 0 var(--navy-950), inset 0 1px 0 rgba(255,255,255,.06)' + (h ? ', var(--glow-teal)' : ''),
        transform: live && pressed ? 'translateY(2px)' : h ? 'translateY(-1px)' : 'none',
        transition: 'transform var(--dur-press) ease, box-shadow var(--dur-fast) ease, border-color var(--dur-fast) ease',
        opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', userSelect: 'none', ...style,
      }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 'var(--radius)', flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(0,0,0,.18)), ' + tone, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35), 0 3px 0 rgba(0,0,0,.35)' }}>
        <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: 22, color: '#fff', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))' }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 14px/1.2 var(--font-body)', color: 'var(--text-strong)' }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, font: '500 12px/1 var(--font-body)', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' }}>
          {Object.keys(cost).map((r) => {
            const m = resourceMeta[r] || { icon: 'circle', color: 'var(--text-muted)' };
            return (
              <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <i className={'ph-fill ph-' + m.icon} aria-hidden="true" style={{ fontSize: 13, color: m.color }} />{cost[r]}
              </span>
            );
          })}
          {days != null ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <i className="ph-fill ph-hourglass" aria-hidden="true" style={{ fontSize: 12 }} />{days} days
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
