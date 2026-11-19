import React from 'react';

const FEED_TYPES = {
  conquest: { icon: 'sword', color: 'var(--red-300)' },
  build_complete: { icon: 'check-circle', color: 'var(--green-300)' },
  ai_build: { icon: 'robot', color: 'var(--gold-400)' },
  player_defeated: { icon: 'skull', color: 'var(--red-300)' },
  match_ended: { icon: 'trophy', color: 'var(--gold-400)' },
  match_started: { icon: 'flag', color: 'var(--sky-300)' },
  battle_repelled: { icon: 'shield', color: 'var(--sky-300)' },
  trade: { icon: 'handshake', color: 'var(--teal-300)' },
  war: { icon: 'sword', color: 'var(--red-500)' },
  alliance: { icon: 'handshake', color: 'var(--green-300)' },
};

export function FeedEvent({ type = 'match_started', actor, day, children, style }) {
  const t = FEED_TYPES[type] || FEED_TYPES.match_started;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)', font: '400 13px/1.4 var(--font-body)', color: 'var(--text-muted)', ...style }}>
      <i className={'ph-fill ph-' + t.icon} aria-hidden="true" style={{ fontSize: 15, color: t.color, marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {actor ? <b style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{actor}</b> : null}
        {actor ? ' ' : null}
        {children}
      </div>
      {day != null ? <span style={{ font: 'italic 700 12px/1.6 var(--font-display)', color: 'var(--navy-400)', textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0 }}>Day {day}</span> : null}
    </div>
  );
}
