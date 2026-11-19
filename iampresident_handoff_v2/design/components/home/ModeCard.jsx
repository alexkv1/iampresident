import React from 'react';

const MODE_TONES = {
  sky: { grad: 'var(--grad-sky)', lip: '#13367a' },
  gold: { grad: 'var(--grad-gold)', lip: 'var(--gold-700)' },
  teal: { grad: 'var(--grad-teal)', lip: 'var(--teal-700)' },
  violet: { grad: 'linear-gradient(180deg,#c9adf2 0%,#a885d8 50%,#7a58b0 100%)', lip: '#4e3577' },
};

export function ModeCard({ icon = 'globe-hemisphere-west', title, description, tone = 'sky', onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const t = MODE_TONES[tone] || MODE_TONES.sky;
  return (
    <button
      type="button" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPressed(false); }}
      onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: 18,
        borderRadius: 'var(--radius-panel)', border: '1px solid ' + (hover ? 'var(--teal-400)' : 'var(--navy-600)'),
        background: 'var(--grad-navy)', color: 'var(--text-body)', cursor: 'pointer', font: 'inherit',
        boxShadow: '0 ' + (pressed ? 1 : 4) + 'px 0 var(--navy-950), 0 10px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08)' + (hover ? ', var(--glow-teal)' : ''),
        transform: pressed ? 'translateY(3px)' : hover ? 'translateY(-2px)' : 'none',
        transition: 'transform var(--dur-press) ease, box-shadow var(--dur-fast) ease, border-color var(--dur-fast) ease',
        ...style,
      }}
    >
      <span style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, display: 'grid', placeItems: 'center', background: t.grad, boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 3px 0 ' + t.lip }}>
        <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: 26, color: '#fff', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.3))' }} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', font: 'italic 800 24px/1 var(--font-display)', textTransform: 'uppercase', color: 'var(--text-strong)', textShadow: 'var(--text-shadow-display)', marginBottom: 4 }}>{title}</span>
        <span style={{ display: 'block', font: '400 13px/1.4 var(--font-body)', color: 'var(--text-muted)' }}>{description}</span>
      </span>
    </button>
  );
}
