import type { ErrorKind } from '../types';
export const BASE_URL = 'https://openlibrary.org';
export interface RequestOptions { signal?: AbortSignal; timeout?: number }
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ErrorKind;
  constructor(message: string, status = 0, kind: ErrorKind = 'http') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }
}
export async function request(path: string, params: Record<string, string> = {}, { signal, timeout = 20000 }: RequestOptions = {}): Promise<unknown> {
  const url = new URL(path, BASE_URL);
  if (url.origin !== BASE_URL) throw new ApiError('Invalid API origin', 0, 'data');
  url.search = new URLSearchParams(params).toString();
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  let expired = false;
  const timer = setTimeout(() => { expired = true; controller.abort(); }, timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new ApiError(`HTTP ${response.status}`, response.status);
    return await response.json() as unknown;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Canceled', 'AbortError');
    if (expired) throw new ApiError('Request timed out', 0, 'timeout');
    if (error instanceof ApiError || isAbort(error)) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Request failed', 0, error instanceof SyntaxError ? 'data' : 'network');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
export function isAbort(error: unknown): boolean { return error instanceof Error && error.name === 'AbortError'; }
export function errorMessage(error: unknown, online = true): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Книга или адрес API не найдены (HTTP 404).';
    if (error.status >= 500) return `Сервис временно недоступен (HTTP ${error.status}). Попробуйте позже.`;
    if (error.status >= 400) return `API отклонил запрос (HTTP ${error.status}). Проверьте запрос и повторите.`;
    if (error.kind === 'timeout') return 'Сервис не ответил за 20 секунд. Повторите запрос.';
    if (error.kind === 'data') return 'API вернул некорректные данные. Повторите запрос позже.';
  }
  return online ? 'Не удалось связаться с Open Library. Проверьте соединение и повторите.' : 'Нет подключения к сети. Подключитесь и повторите запрос.';
}
