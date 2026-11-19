import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';
/**
 * Chunky "game plastic" button with a 3D lip that compresses on press.
 */
export interface ButtonProps {
  /** gold = hero CTA (Play, Start); primary = teal confirm; default = navy; danger = destructive; ghost = flat (Exit/Leave). */
  variant?: 'default' | 'primary' | 'gold' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  /** Phosphor Fill icon name shown before the label. */
  icon?: string;
  iconRight?: string;
  /** Skews the button into a parallelogram (-8deg) for hero CTAs. */
  slanted?: boolean;
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
