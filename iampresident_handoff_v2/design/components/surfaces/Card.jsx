import React from 'react';

export function Card({ padding = 26, tone = 'default', children, style, ...rest }) {
  const hero = tone === 'hero';
  return (
    <div
      style={{
        position: 'relative', padding: padding, color: 'var(--text-body)',
        background: hero ? 'linear-gradient(180deg,#1f3466 0%,#15213d 55%,#121a2e 100%)' : 'var(--grad-card)',
        border: '1px solid ' + (hero ? 'rgba(124,196,255,.28)' : 'var(--navy-600)'),
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-panel), var(--shadow-sheen)' + (hero ? ', 0 0 60px rgba(63,162,255,.18)' : ''),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
