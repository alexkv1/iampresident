import type { CSSProperties } from 'react';
/** Loading ring (teal arc on navy track). */
export interface SpinnerProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}
export declare function Spinner(props: SpinnerProps): JSX.Element;
