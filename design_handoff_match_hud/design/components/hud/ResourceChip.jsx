import React from 'react';
import { resourceMeta, formatNum } from './resourceMeta.js';

export function ResourceChip({ resource = 'gold', value = 0, showName = true, style }) {
  const m = resourceMeta[resource] || resourceMeta.gold;
  return (
    <div title={m.label} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px 4px 4px',
      borderRadius: 'var(--radius-pill)', background: 'var(--navy-850)', border: '1px solid var(--navy-600)',
      boxShadow: 'var(--shadow-inset-well)', fontVariantNumeric: 'tabular-nums', ...style,
    }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'color-mix(in oklab, ' + m.color + ' 20%, transparent)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)' }}>
        <i className={'ph-fill ph-' + m.icon} aria-hidden="true" style={{ fontSize: 15, color: m.color, filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.5))' }} />
      </span>
      <span style={{ font: 'var(--type-hud-value)', color: m.color, textShadow: '0 1px 0 rgba(0,0,0,.4)' }}>{typeof value === 'number' ? formatNum(value) : value}</span>
      {showName ? <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{m.label}</span> : null}
    </div>
  );
}
