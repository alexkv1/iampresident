import React from 'react';
import { resourceMeta } from './resourceMeta.js';

function TagStat({ label, icon, color, children }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ font: '500 11px/1 var(--font-body)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</span>
      <b style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: 'italic 800 20px/1 var(--font-display)', color: 'var(--text-strong)' }}>
        {icon ? <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: 14, color: color }} /> : null}
        {children}
      </b>
    </span>
  );
}

export function CountryTag({ name, leader, owner, ownerColor, farmland, minerals, oil, style }) {
  return (
    <div style={{
      minWidth: 220, padding: '14px 16px', borderRadius: 'var(--radius-tag)',
      background: 'var(--surface-overlay)', backdropFilter: 'var(--blur-overlay)', WebkitBackdropFilter: 'var(--blur-overlay)',
      border: '1px solid var(--border-glow)', boxShadow: 'var(--shadow-panel), var(--shadow-sheen)', ...style,
    }}>
      <div style={{ font: 'italic 900 26px/1 var(--font-display)', textTransform: 'uppercase', color: 'var(--text-strong)', textShadow: 'var(--text-shadow-display)' }}>{name}</div>
      {leader ? <div style={{ marginTop: 4, font: '500 12px/1.3 var(--font-body)', color: 'var(--gold-300)' }}>{leader}</div> : null}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        {owner !== undefined ? (
          <TagStat label="Owner">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: ownerColor || 'var(--globe-land)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.35)' }} />
            <span style={{ font: '600 14px/1 var(--font-body)', fontStyle: 'normal' }}>{owner}</span>
          </TagStat>
        ) : null}
        {farmland !== undefined ? <TagStat label="Farmland" icon={resourceMeta.food.icon} color={resourceMeta.food.color}>{farmland}</TagStat> : null}
        {minerals !== undefined ? <TagStat label="Minerals" icon={resourceMeta.minerals.icon} color={resourceMeta.minerals.color}>{minerals}</TagStat> : null}
        {oil !== undefined ? <TagStat label="Oil" icon={resourceMeta.oil.icon} color={resourceMeta.oil.color}>{oil}</TagStat> : null}
      </div>
    </div>
  );
}
