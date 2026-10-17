import type { ReactNode } from 'react';
export interface EmptyStateProps { children: ReactNode }
export function EmptyState({ children }: EmptyStateProps) {
  return <p data-state="empty" role="status">{children}</p>;
}
