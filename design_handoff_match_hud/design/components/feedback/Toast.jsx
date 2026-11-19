import React from 'react';

const TOAST_KINDS = {
  default: { border: 'var(--navy-500)', color: 'var(--text-body)', icon: 'info' },
  ok: { border: 'var(--green-800)', color: 'var(--green-300)', icon: 'check-circle' },
  err: { border: 'var(--red-800)', color: 'var(--red-300)', icon: 'warning-circle' },
};

export function Toast({ kind = 'default', icon, children, style }) {
  const k = TOAST_KINDS[kind] || TOAST_KINDS.default;
  return (
    <div role="status" style={{
      display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderRadius: 'var(--radius)',
      background: 'var(--grad-navy)', border: '1px solid ' + k.border, color: k.color,
      boxShadow: 'var(--shadow-panel), inset 0 1px 0 rgba(255,255,255,.08), 0 3px 0 var(--navy-950)',
      font: '500 14px/1.3 var(--font-body)', animation: 'iap-toast-in var(--dur-base) var(--ease-pop)', ...style,
    }}>
      <i className={'ph-fill ph-' + (icon || k.icon)} aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}
