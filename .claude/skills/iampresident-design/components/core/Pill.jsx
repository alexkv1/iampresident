import React from 'react';

const PILL_TONES = {
  neutral: { text: 'var(--text-muted)', grad: 'var(--grad-navy)', lip: 'var(--navy-950)', solidText: 'var(--text-strong)' },
  gold: { text: 'var(--gold-400)', grad: 'var(--grad-gold)', lip: 'var(--gold-700)', solidText: 'var(--gold-900)' },
  sky: { text: 'var(--sky-300)', grad: 'var(--grad-sky)', lip: '#13367a', solidText: 'var(--white)' },
  teal: { text: 'var(--teal-400)', grad: 'var(--grad-teal)', lip: 'var(--teal-700)', solidText: 'var(--teal-900)' },
};

export function Pill({ tone = 'neutral', solid = false, icon, children, style }) {
  const t = PILL_TONES[tone] || PILL_TONES.neutral;
  if (!solid) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        font: '500 12px/1 var(--font-body)', color: t.text,
        border: '1px solid var(--border-default)', padding: '4px 10px',
        borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap', ...style,
      }}>
        {icon ? <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: 13 }} /> : null}
        {children}
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: 6,
      background: t.grad, color: t.solidText, transform: 'skewX(var(--skew))',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 3px 0 ' + t.lip,
      whiteSpace: 'nowrap', ...style,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, transform: 'skewX(calc(var(--skew) * -1))',
        font: 'italic 800 16px/1 var(--font-display)', textTransform: 'uppercase', letterSpacing: '.04em',
      }}>
        {icon ? <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: 14 }} /> : null}
        {children}
      </span>
    </span>
  );
}
