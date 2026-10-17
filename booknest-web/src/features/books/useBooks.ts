import { useCallback, useMemo } from 'react';
import { MIN_QUERY, searchBooks } from '../../api/books';
import { getBookDetails, getEditableBook } from '../../api/bookRecords';
import type { BookDetail, Filters, SearchResult } from '../../types';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { useFetch } from '../../shared/hooks/useFetch';
import type { FetchState } from '../../shared/hooks/useFetch';
import type { BookFormValues } from '../../shared/validation/bookFormSchema';

export interface BooksState {
  data: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  isTooShort: boolean;
  retry: () => void;
}

export function useBooks(filters: Filters, page: number): BooksState {
  const { query, genre, sort, available } = filters;
  const debouncedQuery = useDebounce(query, 350);
  const isTooShort = query.trim().length < MIN_QUERY;
  const isDebouncing = !isTooShort && debouncedQuery !== query;
  const apiFilters = useMemo<Filters>(() => ({ query: debouncedQuery, genre, sort, available }), [available, debouncedQuery, genre, sort]);
  const key = JSON.stringify([apiFilters, page]);
  const fetcher = useCallback((signal: AbortSignal) => searchBooks(apiFilters, page, { signal }), [apiFilters, page]);
  const request = useFetch(key, fetcher, !isTooShort && !isDebouncing);

  return {
    data: isDebouncing ? null : request.data,
    isLoading: isDebouncing || request.isLoading,
    error: isDebouncing ? null : request.error,
    isTooShort,
    retry: request.retry,
  };
}

export function useBook(id: string | null): FetchState<BookDetail> {
  const fetcher = useCallback((signal: AbortSignal): Promise<BookDetail> => {
    if (id === null) return Promise.reject(new Error('Book identifier is missing'));
    return getBookDetails(id, { signal });
  }, [id]);
  return useFetch(id ?? '', fetcher, id !== null);
}

export function useEditableBook(id: string | null): FetchState<BookFormValues> {
  const fetcher = useCallback((signal: AbortSignal): Promise<BookFormValues> => {
    if (id === null) return Promise.reject(new Error('Book identifier is missing'));
    return getEditableBook(id, { signal });
  }, [id]);
  return useFetch(`edit:${id ?? ''}`, fetcher, id !== null);
}
