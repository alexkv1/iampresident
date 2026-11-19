import type { CSSProperties } from 'react';
/** Phosphor icon glyph (Fill weight by default). Requires styles.css (loads the local Phosphor Fill + Bold icon fonts). */
export interface IconProps {
  /** Phosphor icon name without prefix, e.g. "coins", "lightning", "globe-hemisphere-west". */
  name: string;
  /** "fill" for game/HUD glyphs (default); "bold" for utility/inline UI icons. */
  weight?: 'fill' | 'bold';
  size?: number;
  color?: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
