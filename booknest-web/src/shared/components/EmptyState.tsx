import type { ReactNode } from 'react';
export interface EmptyStateProps { children: ReactNode; stateful?: boolean }
export function EmptyState({ children, stateful = true }: EmptyStateProps) {
  return <p data-state={stateful ? 'empty' : undefined} role="status">{children}</p>;
}
