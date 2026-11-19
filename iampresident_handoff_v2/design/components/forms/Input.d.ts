import type { ChangeEventHandler, KeyboardEventHandler, CSSProperties } from 'react';
/** Sunken text input / select with 2px border that glows teal on focus. */
export interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  /** Phosphor Bold icon name shown inside the field on the left. */
  icon?: string;
  /** Uppercase + tracked — for room codes. */
  uppercase?: boolean;
  size?: 'md' | 'sm';
  disabled?: boolean;
  /** Render as a <select> with a caret. */
  as?: 'input' | 'select';
  options?: Array<string | { value: string; label: string }>;
  style?: CSSProperties;
  inputStyle?: CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
