import test from 'node:test';
import assert from 'node:assert/strict';
import { request, ApiError } from '../api/client.js';
import { searchParams, searchBooks, getBook, normalizeBook } from '../api/books.js';
import { createLoader, errorMessage } from '../lib/api-state.js';
import { loadApiPreferences, saveApiPreferences, API_STORAGE_KEY } from '../api-storage.js';

test('API client: encoded parameters, response.ok, HTTP and JSON failures', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(new URL(url).searchParams.get('q'), 'Лем & Solaris');
    return new Response('{"ok":true}');
  });
  assert.deepEqual(await request('/search.json', { q: 'Лем & Solaris' }), { ok: true });
  globalThis.fetch = async () => new Response('', { status: 503 });
  await assert.rejects(request('/search.json'), error => error instanceof ApiError && error.status === 503);
  globalThis.fetch = async () => new Response('not JSON');
  await assert.rejects(request('/search.json'), error => error.kind === 'data');
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(request('/search.json'), error => error.kind === 'network');
  await assert.rejects(request('https://example.org'), error => error.kind === 'data');
});

test('API client: cancellation and timeout are distinct and settle', async t => {
  t.mock.method(globalThis, 'fetch', async (url, { signal }) => new Promise((resolve, reject) => {
    const fail = () => reject(new DOMException('Canceled', 'AbortError'));
    if (signal.aborted) fail();
    else signal.addEventListener('abort', fail, { once: true });
  }));
  const controller = new AbortController();
  const pending = request('/search.json', {}, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  await assert.rejects(request('/search.json', {}, { timeout: 10 }), error => error.kind === 'timeout');
});

test('search: 20 per page, server filters/sorts, escaped user input', () => {
  const params = searchParams({ query: 'Lem" OR *', genre: 'science-fiction', sort: 'year-desc', available: true }, 2);
  assert.equal(params.limit, '20');
  assert.equal(params.page, '2');
  assert.equal(params.sort, 'new');
  assert.ok(params.q.includes('subject:"science fiction" AND ebook_access:public'));
  assert.ok(params.q.includes('Lem\\" OR *'));
  assert.equal(searchParams({ query: 'aa', sort: 'rating-desc' }).sort, 'rating');
});

test('search: minimum length skips network, normalization and invalid data', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(JSON.stringify({ numFound: 1, docs: [{ key: '/works/OL1W', title: 'Test', ebook_access: 'public' }] })); });
  assert.deepEqual(await searchBooks({ query: 'a' }, 1), { books: [], total: 0 });
  assert.equal(calls, 0);
  const result = await searchBooks({ query: 'aa' }, 1);
  assert.equal(result.books[0].id, 'OL1W');
  assert.equal(result.books[0].available, true);
  assert.equal(result.books[0].rating, null);
  assert.equal(normalizeBook({ key: '../../bad' }), null);
  assert.equal(normalizeBook({ key: '/works/OL19413970M' }), null);
  globalThis.fetch = async () => new Response('{}');
  await assert.rejects(searchBooks({ query: 'aa' }, 1), error => error.kind === 'data');
});

test('details: independent requests start together, work 404 is preserved', async t => {
  const pending = [];
  t.mock.method(globalThis, 'fetch', url => new Promise(resolve => pending.push({ url: String(url), resolve })));
  const result = getBook('OL1W');
  assert.equal(pending.length, 2);
  pending[0].resolve(new Response(JSON.stringify({ title: 'Work', description: { value: 'Text' } })));
  pending[1].resolve(new Response(JSON.stringify({ docs: [{ key: '/works/OL1W', author_name: ['Author'] }] })));
  assert.equal((await result).description, 'Text');
  globalThis.fetch = async () => new Response('', { status: 404 });
  await assert.rejects(getBook('OL1W'), error => error.status === 404);
  await assert.rejects(getBook('../x'), error => error.status === 404);
});

test('loader: stale success cannot replace latest result, loading always clears', async () => {
  const state = {};
  const loader = createLoader(state, () => {});
  let resolveOld;
  let oldSignal;
  const old = loader.run(signal => { oldSignal = signal; return new Promise(resolve => { resolveOld = resolve; }); }, () => { state.value = 'old'; });
  await loader.run(async () => 'new', value => { state.value = value; state.status = 'success'; });
  assert.equal(oldSignal.aborted, true);
  resolveOld('old');
  await old;
  assert.equal(state.value, 'new');
  assert.equal(state.loading, false);
  await loader.run(async () => { throw new ApiError('server', 500); }, () => {});
  assert.equal(state.status, 'error');
  assert.equal(state.loading, false);
  await loader.run(async () => { throw new DOMException('', 'AbortError'); }, () => {});
  assert.equal(state.status, 'empty');
  assert.equal(state.error, '');
});

test('error messages distinguish Offline, network, 404, 4xx and 5xx', () => {
  assert.match(errorMessage(new ApiError('', 0), false), /Нет подключения/);
  assert.match(errorMessage(new ApiError('', 0)), /Не удалось/);
  assert.match(errorMessage(new ApiError('', 404)), /не найдены/);
  assert.match(errorMessage(new ApiError('', 429)), /отклонил/);
  assert.match(errorMessage(new ApiError('', 503)), /временно/);
});

test('API storage: stable snapshots, legacy migration, bad data, blocked storage', () => {
  const map = new Map([['booknest.catalog.v1', JSON.stringify({ version: 1, wishlist: ['b01'] })]]);
  const get = () => ({ getItem: key => map.get(key), setItem: (key, value) => map.set(key, value) });
  const state = loadApiPreferences(get);
  assert.equal(state.wishlist[0].title, 'Solaris');
  state.wishlist.push({ id: 'OL109524W', title: 'Solaris', author: 'Lem' });
  assert.equal(saveApiPreferences(state, get), true);
  assert.equal(loadApiPreferences(get).wishlist.length, 2);
  assert.ok(map.has('booknest.catalog.v1'));
  map.set(API_STORAGE_KEY, '{');
  assert.equal(loadApiPreferences(get).wishlist.length, 0);
  assert.equal(loadApiPreferences(() => { throw new Error('blocked'); }).storageAvailable, false);
  assert.equal(saveApiPreferences(state, () => { throw new Error('quota'); }), false);
});
