export interface SpinnerProps { label: string }
export function Spinner({ label }: SpinnerProps) {
  return <p data-state="loading" role="status" aria-live="polite">{label}</p>;
}
