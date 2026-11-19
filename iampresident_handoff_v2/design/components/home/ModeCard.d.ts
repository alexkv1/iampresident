import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';
/**
 * Large tappable game-mode tile for the main menu.
 */
export interface ModeCardProps {
  /** Phosphor Fill icon name. */
  icon?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: 'sky' | 'gold' | 'teal' | 'violet';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
}
export declare function ModeCard(props: ModeCardProps): JSX.Element;
