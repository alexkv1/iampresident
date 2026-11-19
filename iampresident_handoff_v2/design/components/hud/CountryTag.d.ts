import type { ReactNode, CSSProperties } from 'react';
/** Hover card for a country on the globe: name, leader persona, owner and land attributes. */
export interface CountryTagProps {
  name: string;
  /** e.g. "Lead as Supreme Leader Kim Jong Un" */
  leader?: ReactNode;
  owner?: ReactNode;
  ownerColor?: string;
  farmland?: number;
  minerals?: number;
  oil?: number;
  style?: CSSProperties;
}
export declare function CountryTag(props: CountryTagProps): JSX.Element;
