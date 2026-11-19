import React from 'react';

const BTN_VARIANTS = {
  default: { bg: 'var(--grad-navy)', hoverBg: 'var(--grad-navy)', border: 'var(--navy-500)', color: 'var(--text-strong)', lip: 'var(--navy-950)', sheen: 'rgba(255,255,255,.12)', ts: '0 2px 0 rgba(0,0,0,.35)' },
  primary: { bg: 'var(--grad-teal)', border: '#2bbdb0', color: 'var(--teal-900)', lip: 'var(--teal-700)', sheen: 'rgba(255,255,255,.45)', ts: '0 1px 0 rgba(255,255,255,.3)' },
  gold: { bg: 'var(--grad-gold)', border: '#e3ae3e', color: 'var(--gold-900)', lip: 'var(--gold-700)', sheen: 'rgba(255,255,255,.5)', ts: '0 1px 0 rgba(255,255,255,.35)' },
  danger: { bg: 'linear-gradient(180deg,#4a1a2b 0%,#3a1522 100%)', border: 'var(--red-800)', color: 'var(--red-300)', lip: '#1e0a12', sheen: 'rgba(255,255,255,.08)', ts: '0 2px 0 rgba(0,0,0,.35)' },
  ghost: { bg: 'transparent', border: 'var(--navy-600)', color: 'var(--text-body)', lip: null, sheen: null, ts: 'none' },
};

export function Button({ variant = 'default', size = 'md', icon, iconRight, slanted = false, block = false, disabled = false, type = 'button', onClick, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.default;
  const sm = size === 'sm';
  const live = !disabled;
  const lipH = v.lip ? (live && pressed ? 1 : (sm ? 3 : 4)) : 0;
  const ty = live && pressed ? (sm ? 2 : 3) : (live && hover ? -1 : 0);
  const shadows = [];
  if (v.sheen) shadows.push('inset 0 2px 0 ' + v.sheen, 'inset 0 -3px 0 rgba(0,0,0,.15)');
  if (v.lip) shadows.push('0 ' + lipH + 'px 0 ' + v.lip, '0 ' + (lipH + 6) + 'px 14px rgba(0,0,0,.3)');
  const iconSize = sm ? 16 : 20;
  const bg = variant === 'ghost' && live && hover ? 'rgba(255,255,255,.06)' : v.bg;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      style={{
        display: block ? 'flex' : 'inline-flex', width: block ? '100%' : undefined,
        alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: sm ? '7px 12px' : '11px 18px',
        borderRadius: 'var(--radius)', border: '1px solid ' + v.border,
        background: bg, color: v.color,
        font: sm ? 'var(--type-button-sm)' : 'var(--type-button)',
        textTransform: 'uppercase', letterSpacing: '.02em', textShadow: v.ts,
        boxShadow: shadows.length ? shadows.join(', ') : 'none',
        transform: (slanted ? 'skewX(var(--skew)) ' : '') + 'translateY(' + ty + 'px)',
        transition: 'transform var(--dur-press) ease, box-shadow var(--dur-press) ease, filter var(--dur-fast) ease',
        filter: live && hover && variant !== 'ghost' ? 'brightness(1.08)' : 'none',
        opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', userSelect: 'none',
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, transform: slanted ? 'skewX(calc(var(--skew) * -1))' : undefined }}>
        {icon ? <i className={'ph-fill ph-' + icon} aria-hidden="true" style={{ fontSize: iconSize, lineHeight: 1 }} /> : null}
        {children}
        {iconRight ? <i className={'ph-fill ph-' + iconRight} aria-hidden="true" style={{ fontSize: iconSize, lineHeight: 1 }} /> : null}
      </span>
    </button>
  );
}
