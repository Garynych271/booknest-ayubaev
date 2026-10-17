export const BASE_URL = 'https://openlibrary.org';

export class ApiError extends Error {
  constructor(message, status = 0, kind = 'http') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
  }
}

export async function request(path, params = {}, { signal, timeout = 20000 } = {}) {
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
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Canceled', 'AbortError');
    if (expired) throw new ApiError('Request timed out', 0, 'timeout');
    if (error instanceof ApiError || error.name === 'AbortError') throw error;
    throw new ApiError(error.message, 0, error instanceof SyntaxError ? 'data' : 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
