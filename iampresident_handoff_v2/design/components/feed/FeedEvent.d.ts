import type { ReactNode, CSSProperties } from 'react';
/** One line in the Dispatches feed. */
export interface FeedEventProps {
  type?: 'conquest' | 'build_complete' | 'ai_build' | 'player_defeated' | 'match_ended' | 'match_started' | 'battle_repelled' | 'trade' | 'war' | 'alliance';
  /** Bolded leader name that starts the line. */
  actor?: ReactNode;
  day?: number;
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function FeedEvent(props: FeedEventProps): JSX.Element;
