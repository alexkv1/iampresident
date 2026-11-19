import React from 'react';

const BADGE_KINDS = {
  default: { color: 'var(--text-muted)', bg: 'rgba(255,255,255,.04)', border: 'var(--navy-600)' },
  ready: { color: 'var(--green-300)', bg: 'rgba(60,180,75,.12)', border: 'var(--green-800)' },
  ai: { color: 'var(--gold-400)', bg: 'rgba(245,185,66,.10)', border: '#5a4a1e' },
  host: { color: 'var(--sky-300)', bg: 'rgba(63,162,255,.10)', border: 'var(--sky-800)' },
  danger: { color: 'var(--red-300)', bg: 'rgba(230,25,75,.12)', border: 'var(--red-800)' },
};

export function Badge({ kind = 'default', icon, children, style }) {
  const k = BADGE_KINDS[kind] || BADGE_KINDS.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
      padding: '3px 8px 2px', borderRadius: 'var(--radius-pill)',
      border: '1px solid ' + k.border, background: k.bg, color: k.color,
      font: 'italic 800 12px/1 var(--font-display)', textTransform: 'uppercase', letterSpacing: '.06em',
      whiteSpace: 'nowrap', ...style,
    }}>
      {icon ? <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: 11 }} /> : null}
      {children}
    </span>
  );
}
