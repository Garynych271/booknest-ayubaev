import { Button } from './Button';
export interface ErrorBoxProps { message: string; onRetry: () => void }
export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return <div data-state="error"><p role="alert" data-error-message>{message}</p><Button onClick={onRetry} data-action="retry">Повторить</Button></div>;
}
