import React from 'react';
import { Badge } from '../core/Badge.jsx';

const BADGE_LABELS = { ai: 'AI', ready: 'Ready', host: 'Host' };

export function PlayerRow({ color = 'var(--player-1)', name, meta, me = false, badges = [], defeated = false, onClick, style }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--radius-row)',
      background: me ? 'var(--me-tint)' : 'transparent',
      boxShadow: me ? 'inset 0 0 0 1px rgba(79,209,197,.3)' : 'none',
      opacity: defeated ? 0.55 : 1, cursor: onClick ? 'pointer' : undefined, ...style,
    }}>
      <span style={{ width: 14, height: 14, borderRadius: 'var(--radius-xs)', background: color, flexShrink: 0, boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), inset 0 -2px 0 rgba(0,0,0,.25), 0 0 0 2px rgba(0,0,0,.3)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, font: '600 14px/1.25 var(--font-body)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          {defeated ? <i className="ph-fill ph-skull" aria-hidden="true" style={{ fontSize: 14, color: 'var(--red-300)' }} /> : null}
        </div>
        {meta ? <div style={{ font: '400 11px/1.3 var(--font-body)', color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>{meta}</div> : null}
      </div>
      {badges.map((b) => <Badge key={b} kind={b}>{BADGE_LABELS[b] || b}</Badge>)}
    </div>
  );
}
