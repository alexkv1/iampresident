import type { ReactNode, CSSProperties } from 'react';
/** One chat line: coloured speaker name + message. */
export interface ChatMessageProps {
  name?: string;
  /** Speaker's player colour. */
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function ChatMessage(props: ChatMessageProps): JSX.Element;
