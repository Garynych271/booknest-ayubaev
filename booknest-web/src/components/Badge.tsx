import type { ReactNode } from 'react';
export interface BadgeProps { children: ReactNode; tone?: 'available' | 'neutral' }
export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className="badge" data-tone={tone}>{children}</span>;
}
