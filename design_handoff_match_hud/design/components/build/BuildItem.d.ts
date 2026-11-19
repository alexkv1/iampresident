import type { CSSProperties, MouseEventHandler } from 'react';
/** Build catalogue entry: icon tile, name, resource cost and build time. */
export interface BuildItemProps {
  name: string;
  /** Phosphor Fill icon name. */
  icon?: string;
  /** CSS colour for the icon tile. */
  tone?: string;
  /** e.g. { gold: 120, minerals: 40 } */
  cost?: Partial<Record<'food' | 'energy' | 'minerals' | 'gold' | 'oil' | 'research', number>>;
  /** Build time in in-game days (ticks). */
  days?: number;
  description?: string;
  /** Can't afford — dims and blocks. */
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  style?: CSSProperties;
}
export declare function BuildItem(props: BuildItemProps): JSX.Element;
