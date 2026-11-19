import type { ReactNode, CSSProperties } from 'react';
/** Typeset "I Am President" name (no logo exists — this is type only). */
export interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** stacked = small "I AM" over big gold "PRESIDENT"; inline = one line. */
  layout?: 'stacked' | 'inline';
  tagline?: ReactNode;
  align?: 'left' | 'center';
  style?: CSSProperties;
}
export declare function Wordmark(props: WordmarkProps): JSX.Element;
