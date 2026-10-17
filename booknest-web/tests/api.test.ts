import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, errorMessage } from '../src/api/client';
import { getBook, normalizeBook, searchBooks, searchParams } from '../src/api/books';
import type { Filters } from '../src/types';
const filters: Filters = { query: 'Solaris', genre: '', sort: 'title', available: false };
afterEach(() => vi.unstubAllGlobals());
describe('Open Library API layer', () => {
  it('encodes params and checks response.ok', async () => {
    const fetchMock = vi.fn(async (value: URL | RequestInfo) => {
      expect(new URL(String(value)).searchParams.get('q')).toBe('Лем & Solaris');
      return new Response('{"ok":true}');
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(request('/search.json', { q: 'Лем & Solaris' })).resolves.toEqual({ ok: true });
    vi.stubGlobal('fetch', async () => new Response('', { status: 503 }));
    await expect(request('/search.json')).rejects.toMatchObject({ status: 503 });
  });
  it('aborts and distinguishes error messages', async () => {
    vi.stubGlobal('fetch', (_value: URL | RequestInfo, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Canceled', 'AbortError')), { once: true });
    }));
    const controller = new AbortController();
    const pending = request('/search.json', {}, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(errorMessage(new ApiError('', 404))).toContain('404');
    expect(errorMessage(new ApiError('', 503))).toContain('временно');
    expect(errorMessage(new ApiError('', 0), false)).toContain('Нет подключения');
  });
  it('builds server-side filters and rejects malformed works', () => {
    const params = searchParams({ query: 'Lem" OR *', genre: 'science-fiction', sort: 'rating-desc', available: true }, 2);
    expect(params.limit).toBe('20');
    expect(params.page).toBe('2');
    expect(params.sort).toBe('rating');
    expect(params.q).toContain('subject:"science fiction" AND ebook_access:public');
    expect(normalizeBook({ key: '/works/OL109524W', title: 'Solaris' })?.id).toBe('OL109524W');
    expect(normalizeBook({ key: '/works/OL19413970M' })).toBeNull();
  });
  it('uses no request below minimum query and starts detail requests together', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ numFound: 0, docs: [] })));
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchBooks({ ...filters, query: 'a' }, 1)).resolves.toEqual({ books: [], total: 0, skipped: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
    const resolvers: Array<(value: Response) => void> = [];
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => resolvers.push(resolve))));
    const detail = getBook('OL109524W');
    expect(resolvers).toHaveLength(2);
    resolvers[0]?.(new Response(JSON.stringify({ title: 'Solaris', description: 'Text' })));
    resolvers[1]?.(new Response(JSON.stringify({ docs: [{ key: '/works/OL109524W', title: 'Solaris', author_name: ['Lem'] }] })));
    await expect(detail).resolves.toMatchObject({ id: 'OL109524W', author: 'Lem', description: 'Text' });
  });
});
