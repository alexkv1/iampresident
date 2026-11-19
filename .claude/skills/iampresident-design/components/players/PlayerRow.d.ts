import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';
/** One player in the lobby list or world standings. */
export interface PlayerRowProps {
  /** Player slot colour (GameConfig::COLORS / --player-N). */
  color?: string;
  name: ReactNode;
  meta?: ReactNode;
  /** Highlights the local player's row. */
  me?: boolean;
  badges?: Array<'ai' | 'ready' | 'host'>;
  defeated?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  style?: CSSProperties;
}
export declare function PlayerRow(props: PlayerRowProps): JSX.Element;
