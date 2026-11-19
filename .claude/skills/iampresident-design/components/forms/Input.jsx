import React from 'react';

export function Input({ value, defaultValue, onChange, onKeyDown, placeholder, maxLength, type = 'text', icon, uppercase = false, size = 'md', disabled = false, as = 'input', options = [], style, inputStyle, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const sm = size === 'sm';
  const base = {
    width: '100%', padding: sm ? '7px 12px' : '11px 14px',
    paddingLeft: icon ? (sm ? 32 : 40) : undefined,
    paddingRight: as === 'select' ? 38 : undefined,
    borderRadius: 'var(--radius)',
    border: '2px solid ' + (focus ? 'var(--teal-400)' : 'var(--navy-600)'),
    background: 'var(--navy-850)', color: 'var(--text-body)',
    font: '500 ' + (sm ? '13px' : '15px') + '/1.2 var(--font-body)',
    boxShadow: 'var(--shadow-inset-well)' + (focus ? ', var(--focus-ring)' : ''),
    outline: 'none', transition: 'border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease',
    textTransform: uppercase ? 'uppercase' : undefined, letterSpacing: uppercase ? '.12em' : undefined,
    opacity: disabled ? 0.5 : 1, appearance: 'none', WebkitAppearance: 'none',
    cursor: as === 'select' && !disabled ? 'pointer' : undefined,
    ...inputStyle,
  };
  const handlers = { onFocus: () => setFocus(true), onBlur: () => setFocus(false) };
  const field = as === 'select'
    ? (
      <select value={value} defaultValue={defaultValue} onChange={onChange} disabled={disabled} style={base} {...handlers} {...rest}>
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    )
    : (
      <input type={type} value={value} defaultValue={defaultValue} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} maxLength={maxLength} disabled={disabled} style={base} {...handlers} {...rest} />
    );
  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      {icon ? <i className={'ph-bold ph-' + icon} aria-hidden="true" style={{ position: 'absolute', left: sm ? 11 : 14, top: '50%', transform: 'translateY(-50%)', fontSize: sm ? 15 : 18, color: focus ? 'var(--teal-400)' : 'var(--text-muted)', pointerEvents: 'none' }} /> : null}
      {field}
      {as === 'select' ? <i className="ph-bold ph-caret-down" aria-hidden="true" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none' }} /> : null}
    </div>
  );
}
