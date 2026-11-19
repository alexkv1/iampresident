import type { ReactNode, CSSProperties } from 'react';
/** Label + control + optional hint wrapper. */
export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}
export declare function Field(props: FieldProps): JSX.Element;
