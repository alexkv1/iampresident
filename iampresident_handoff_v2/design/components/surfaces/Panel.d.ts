import type { ReactNode, CSSProperties } from 'react';
/** Translucent blurred HUD panel that floats over the globe, with a game-style title plate. */
export interface PanelProps {
  title?: ReactNode;
  /** Right-aligned header slot (buttons, pills). */
  actions?: ReactNode;
  padding?: number | string;
  children?: ReactNode;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}
export declare function Panel(props: PanelProps): JSX.Element;
