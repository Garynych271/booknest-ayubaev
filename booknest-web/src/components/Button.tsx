import type { ButtonHTMLAttributes } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { tone?: 'primary' | 'quiet' }
export function Button({ type = 'button', tone = 'primary', ...props }: ButtonProps) {
  return <button type={type} data-tone={tone} {...props} />;
}
