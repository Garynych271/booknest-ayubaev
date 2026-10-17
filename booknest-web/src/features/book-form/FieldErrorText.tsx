export interface FieldErrorTextProps { id: string; message?: string }

export function FieldErrorText({ id, message }: FieldErrorTextProps) {
  return message ? <span className="field-error" id={id} role="alert">{message}</span> : null;
}
