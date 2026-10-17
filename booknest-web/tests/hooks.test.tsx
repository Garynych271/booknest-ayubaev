// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Filters } from '../src/types';
import { useDebounce } from '../src/shared/hooks/useDebounce';
import { useFetch } from '../src/shared/hooks/useFetch';

const api = vi.hoisted(() => ({ searchBooks: vi.fn(), getBook: vi.fn() }));
vi.mock('../src/api/books', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/api/books')>();
  return { ...actual, searchBooks: api.searchBooks, getBook: api.getBook };
});

import { useBooks } from '../src/features/books/useBooks';

const filters = (query: string): Filters => ({ query, genre: '', sort: 'title', available: false });

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('custom data hooks', () => {
  it('debounces the latest generic value', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 350), { initialProps: { value: 'A' } });
    rerender({ value: 'B' });
    act(() => vi.advanceTimersByTime(349));
    expect(result.current).toBe('A');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('B');
  });

  it('loads typed data and retries through useFetch', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const { result } = renderHook(() => useFetch('books', fetcher));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('first'));
    act(() => result.current.retry());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('second'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('aborts the previous effect on key change and unmount', async () => {
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<string>(() => undefined);
    });
    const { rerender, unmount } = renderHook(({ key }) => useFetch(key, fetcher), { initialProps: { key: 'first' } });
    await waitFor(() => expect(signals).toHaveLength(1));
    rerender({ key: 'second' });
    expect(signals[0]?.aborted).toBe(true);
    await waitFor(() => expect(signals).toHaveLength(2));
    unmount();
    expect(signals[1]?.aborted).toBe(true);
  });

  it('avoids short searches and cancels an active search while debouncing', async () => {
    const signals: AbortSignal[] = [];
    api.searchBooks.mockImplementation((_filters: Filters, _page: number, options: { signal: AbortSignal }) => {
      signals.push(options.signal);
      return new Promise(() => undefined);
    });
    const { result, rerender, unmount } = renderHook(({ query }) => useBooks(filters(query), 1), { initialProps: { query: 'a' } });
    expect(result.current.isTooShort).toBe(true);
    expect(api.searchBooks).not.toHaveBeenCalled();
    rerender({ query: 'Solaris' });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 360)); });
    expect(api.searchBooks).toHaveBeenCalledTimes(1);
    rerender({ query: 'Lem' });
    expect(signals[0]?.aborted).toBe(true);
    expect(result.current.isLoading).toBe(true);
    unmount();
  });
});
