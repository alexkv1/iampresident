import React from 'react';

const WM_SIZES = { sm: [16, 30], md: [24, 52], lg: [36, 84], xl: [52, 124] };

export function Wordmark({ size = 'md', layout = 'stacked', tagline, align = 'left', style }) {
  const s = WM_SIZES[size] || WM_SIZES.md;
  const gold = {
    background: 'linear-gradient(180deg,#fff4cf 0%,#ffd864 38%,#f5b942 62%,#d89a28 100%)',
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
  };
  const font = 'italic 900 ' + s[1] + 'px/.86 var(--font-display)';
  const stacked = layout === 'stacked';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, ...style }}>
      <div style={{ filter: 'drop-shadow(0 ' + Math.max(2, Math.round(s[1] / 18)) + 'px 0 rgba(6,10,20,.6))', textTransform: 'uppercase', letterSpacing: '.005em', display: 'flex', flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? (align === 'center' ? 'center' : 'flex-start') : 'baseline', gap: stacked ? 2 : '.22em' }}>
        <span style={{ font: stacked ? 'italic 900 ' + s[0] + 'px/1 var(--font-display)' : font, color: 'var(--white)', letterSpacing: stacked ? '.14em' : undefined, paddingLeft: stacked ? '.12em' : 0 }}>I Am</span>
        <span style={{ font: font, paddingRight: '.06em', ...gold }}>President</span>
      </div>
      {tagline ? <div style={{ marginTop: Math.round(s[1] / 4), font: '500 15px/1.4 var(--font-body)', color: 'var(--text-muted)' }}>{tagline}</div> : null}
    </div>
  );
}
