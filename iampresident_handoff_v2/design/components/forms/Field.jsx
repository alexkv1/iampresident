import React from 'react';

export function Field({ label, hint, children, style }) {
  return (
    <label style={{ display: 'block', ...style }}>
      {label ? <span style={{ display: 'block', font: '500 13px/1.2 var(--font-body)', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</span> : null}
      {children}
      {hint ? <span style={{ display: 'block', font: '400 12px/1.4 var(--font-body)', color: 'var(--text-muted)', marginTop: 6 }}>{hint}</span> : null}
    </label>
  );
}
