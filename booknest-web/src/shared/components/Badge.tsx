import type { ReactNode } from 'react';
export interface BadgeProps { children: ReactNode; variant?: 'ok' | 'busy' | 'warn' }
export function Badge({ children, variant = 'busy' }: BadgeProps) {
  return <span className="badge" data-variant={variant}>{children}</span>;
}
