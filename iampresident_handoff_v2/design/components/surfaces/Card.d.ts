import type { ReactNode, CSSProperties } from 'react';
/** Solid raised card for full-screen menus (home, results). */
export interface CardProps {
  padding?: number | string;
  /** hero = brighter sky-tinted card with outer glow (main menu). */
  tone?: 'default' | 'hero';
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
