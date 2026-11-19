import type { ReactNode, CSSProperties } from 'react';
/** Pop-in notification shown top-centre for ~2.6s. */
export interface ToastProps {
  kind?: 'default' | 'ok' | 'err';
  /** Override the default icon (Phosphor Fill name). */
  icon?: string;
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
