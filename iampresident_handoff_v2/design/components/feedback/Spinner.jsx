import React from 'react';

export function Spinner({ size = 34, color = 'var(--teal-400)', style }) {
  return (
    <span role="progressbar" aria-label="Loading" style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      border: Math.max(2, Math.round(size / 11)) + 'px solid var(--navy-600)', borderTopColor: color,
      animation: 'iap-spin 1s linear infinite', ...style,
    }} />
  );
}
