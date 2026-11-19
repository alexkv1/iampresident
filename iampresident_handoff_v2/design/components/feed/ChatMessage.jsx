import React from 'react';

export function ChatMessage({ name = 'System', color = 'var(--text-muted)', children, style }) {
  return (
    <div style={{ padding: '3px 0', font: '400 13px/1.4 var(--font-body)', color: 'var(--text-body)', ...style }}>
      <span style={{ fontWeight: 700, color: color }}>{name}:</span> {children}
    </div>
  );
}
