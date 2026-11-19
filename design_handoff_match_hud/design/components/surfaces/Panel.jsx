import React from 'react';

export function Panel({ title, actions, padding = 16, children, style, bodyStyle, ...rest }) {
  return (
    <section
      style={{
        background: 'var(--grad-panel)',
        backdropFilter: 'var(--blur-overlay)', WebkitBackdropFilter: 'var(--blur-overlay)',
        border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-panel)',
        boxShadow: 'var(--shadow-panel), var(--shadow-sheen)', color: 'var(--text-body)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ padding: padding, ...bodyStyle }}>
        {title || actions ? (
          <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {title ? (
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 9, margin: 0, font: 'var(--type-panel-title)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-strong)', textShadow: 'var(--text-shadow-display)' }}>
                <span aria-hidden="true" style={{ width: 5, height: 16, borderRadius: 2, background: 'var(--grad-gold)', transform: 'skewX(var(--skew))', boxShadow: '0 2px 0 var(--gold-700)' }} />
                {title}
              </h2>
            ) : null}
            <div style={{ flex: 1 }} />
            {actions}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
