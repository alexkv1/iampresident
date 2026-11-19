import type { ReactNode, CSSProperties } from 'react';
/** Rounded meta pill (outline) or skewed solid "plate" for counters like the Day clock. */
export interface PillProps {
  tone?: 'neutral' | 'gold' | 'sky' | 'teal';
  /** Solid = skewed gradient plate with lip; default is a quiet outline pill. */
  solid?: boolean;
  icon?: string;
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function Pill(props: PillProps): JSX.Element;
