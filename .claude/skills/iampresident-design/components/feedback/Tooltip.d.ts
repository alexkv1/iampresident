import type { ReactNode, CSSProperties } from 'react';
/** Explainer popup for HUD icons: title, short "what it is / how it's used" body, optional live stats. Presentational — the caller positions it. */
export interface TooltipProps {
  title: ReactNode;
  /** One or two sentences: what it is and how to use it. */
  body?: ReactNode;
  /** Phosphor Fill icon name, shown in a tone-coloured tile. */
  icon?: string;
  tone?: string;
  /** Keyboard shortcut shown as a keycap. */
  keyHint?: string;
  /** Label/value rows under a divider, e.g. Now / Per day / Made by. */
  stats?: Array<{ label: ReactNode; value: ReactNode; color?: string; icon?: string }>;
  /** Side of the anchor the tooltip sits on (arrow points back at the anchor). */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Arrow x-position in px for top/bottom placement (default: centred). */
  arrowOffset?: number;
  width?: number;
  style?: CSSProperties;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
