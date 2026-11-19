import React from 'react';

export function Icon({ name, weight = 'fill', size = 18, color, style, className = '', title, ...rest }) {
  return (
    <i
      className={'ph-' + weight + ' ph-' + name + (className ? ' ' + className : '')}
      aria-hidden={title ? undefined : 'true'}
      title={title}
      style={{ fontSize: size, color: color, lineHeight: 1, display: 'inline-block', ...style }}
      {...rest}
    />
  );
}
