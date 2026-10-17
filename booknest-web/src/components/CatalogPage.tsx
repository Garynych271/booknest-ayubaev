import { useEffect, useState } from 'react';
import { searchBooks, MIN_QUERY, PAGE_SIZE } from '../api/books';
import { errorMessage, isAbort } from '../api/client';
import type { Book, CompletedRequest, Filters, RequestState, SavedBook, SearchResult } from '../types';
import { FiltersPanel } from './FiltersPanel';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { ErrorBox } from './ErrorBox';
import { BookList } from './BookList';
import { Pagination } from './Pagination';
import { Wishlist } from './Wishlist';
export interface CatalogPageProps {
  filters: Filters; page: number; wishlist: SavedBook[]; storageAvailable: boolean;
  onFiltersChange: (filters: Filters) => void; onReset: () => void;
  onPageChange: (page: number) => void; onToggle: (book: Book) => void; onRemove: (id: string) => void;
}
const initial: CompletedRequest<SearchResult> = { key: '', result: { status: 'empty', message: '' } };
export function CatalogPage(props: CatalogPageProps) {
  const { filters, page, wishlist, storageAvailable, onFiltersChange, onReset, onPageChange, onToggle, onRemove } = props;
  const [completed, setCompleted] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const requestKey = JSON.stringify([filters, page, attempt]);
  const short = filters.query.trim().length < MIN_QUERY;
  const result: RequestState<SearchResult> = short
    ? { status: 'empty', message: 'Введите не менее двух символов названия или имени автора.' }
    : completed.key === requestKey ? completed.result : { status: 'loading' };
  useEffect(() => {
    if (short) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        let next: RequestState<SearchResult> = { status: 'loading' };
        try {
          const data = await searchBooks(filters, page, { signal: controller.signal });
          next = data.books.length ? { status: 'success', data } : { status: 'empty', message: 'Книги не найдены. Измените запрос или сбросьте фильтры.' };
        } catch (error) {
          if (!isAbort(error)) next = { status: 'error', message: errorMessage(error, navigator.onLine) };
        } finally {
          if (!controller.signal.aborted && next.status !== 'loading') setCompleted({ key: requestKey, result: next });
        }
      })();
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, page, requestKey, short]);
  const totalPages = result.status === 'success' ? Math.max(1, Math.ceil(result.data.total / PAGE_SIZE)) : 1;
  useEffect(() => { if (result.status === 'success' && page > totalPages) onPageChange(totalPages); }, [onPageChange, page, result.status, totalPages]);
  return <main className="main main--catalog">
    <h1>Каталог книг BookNest</h1>
    <FiltersPanel filters={filters} onChange={onFiltersChange} onReset={onReset} storageAvailable={storageAvailable} />
    <section className="catalog" aria-labelledby="catalog-title" aria-busy={result.status === 'loading'}>
      <h2 id="catalog-title" tabIndex={-1}>Найденные книги</h2>
      {result.status === 'loading' && <Spinner label="Загружаем книги…" />}
      {result.status === 'empty' && <EmptyState>{result.message}</EmptyState>}
      {result.status === 'error' && <ErrorBox message={result.message} onRetry={() => setAttempt(value => value + 1)} />}
      {result.status === 'success' && <div data-state="success">
        <p data-result-count role="status" aria-live="polite">Найдено записей: {result.data.total}. Книг на странице: {result.data.books.length}{result.data.skipped ? `. Некорректных записей пропущено: ${result.data.skipped}` : ''}</p>
        <BookList books={result.data.books} wishlist={wishlist} onToggle={onToggle} />
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      </div>}
    </section>
    <Wishlist books={wishlist} onRemove={onRemove} />
    <aside className="club-note"><h2>Правило книжного клуба</h2><p>Книги клуба выдаются на 14 дней. Электронная доступность поступает из Open Library и не означает свободный экземпляр клуба.</p></aside>
  </main>;
}
