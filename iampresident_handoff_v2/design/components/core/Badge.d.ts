import type { ReactNode, CSSProperties } from 'react';
/** Tiny status tag next to a player (AI / READY / HOST) or a state flag. */
export interface BadgeProps {
  kind?: 'default' | 'ready' | 'ai' | 'host' | 'danger';
  icon?: string;
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
