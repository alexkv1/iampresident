import type { CSSProperties } from 'react';
/** HUD stockpile chip: coloured icon + big number + small label. */
export interface ResourceChipProps {
  resource?: 'food' | 'energy' | 'minerals' | 'gold' | 'oil' | 'research';
  /** Numbers are compacted like UI.num (12.3K, 1.23M); strings pass through. */
  value?: number | string;
  showName?: boolean;
  style?: CSSProperties;
}
export declare function ResourceChip(props: ResourceChipProps): JSX.Element;
