import { useEffect, useState } from 'react';
import { getBook } from '../api/books';
import { BASE_URL, errorMessage, isAbort } from '../api/client';
import type { BookDetail, CompletedRequest, RequestState, SavedBook } from '../types';
import { Badge } from './Badge';
import { BookCover } from './BookCover';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { ErrorBox } from './ErrorBox';
import { Spinner } from './Spinner';
export interface BookDetailsProps { id: string | null; wishlist: SavedBook[]; storageAvailable: boolean; onToggle: (book: BookDetail) => void }
const initial: CompletedRequest<BookDetail> = { key: '', result: { status: 'empty', message: '' } };
export function BookDetails({ id, wishlist, storageAvailable, onToggle }: BookDetailsProps) {
  const [completed, setCompleted] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const key = `${id ?? ''}:${attempt}`;
  const result: RequestState<BookDetail> = id === null ? { status: 'empty', message: 'Выберите книгу в каталоге.' } : completed.key === key ? completed.result : { status: 'loading' };
  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    void (async () => {
      let next: RequestState<BookDetail> = { status: 'loading' };
      try { next = { status: 'success', data: await getBook(id, { signal: controller.signal }) }; }
      catch (error) { if (!isAbort(error)) next = { status: 'error', message: errorMessage(error, navigator.onLine) }; }
      finally { if (!controller.signal.aborted && next.status !== 'loading') setCompleted({ key, result: next }); }
    })();
    return () => controller.abort();
  }, [id, key]);
  const book = result.status === 'success' ? result.data : null;
  const saved = book ? wishlist.some(item => item.id === book.id) : false;
  return <main className="main main--book" aria-busy={result.status === 'loading'}>
    <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><a href="?">Каталог</a></li><li><span aria-current="page">{book?.title ?? 'Карточка книги'}</span></li></ol></nav>
    <h1>{book?.title ?? 'Карточка книги'}</h1>
    {result.status === 'loading' && <Spinner label="Загружаем книгу…" />}
    {result.status === 'empty' && <EmptyState><a href="?">{result.message}</a></EmptyState>}
    {result.status === 'error' && <ErrorBox message={result.message} onRetry={() => setAttempt(value => value + 1)} />}
    {book && <article className="book-detail" data-state="success">
      <BookCover key={book.cover ?? 'none'} book={book} detail />
      <section className="book-detail__specs"><h2>Характеристики</h2><dl>
        <dt>Автор</dt><dd>{book.author}</dd><dt>Год первой публикации</dt><dd>{book.year ?? 'Не указан'}</dd>
        <dt>Темы</dt><dd>{book.genre}</dd><dt>Рейтинг Open Library</dt><dd>{book.rating === null ? 'Нет оценок' : `${book.rating.toFixed(1)} из 5`}</dd>
        <dt>Электронный доступ</dt><dd><Badge tone={book.available ? 'available' : 'neutral'}>{book.available ? 'Открытый доступ' : 'Открытый доступ не подтверждён'}</Badge></dd>
      </dl><p><a href={`${BASE_URL}/works/${book.id}`}>Запись в Open Library</a></p>
      <Button aria-pressed={saved} onClick={() => onToggle(book)}>{saved ? 'В моём списке' : 'Хочу прочитать'}</Button>
      {!storageAvailable && <p className="storage-notice" role="status">Сохранение недоступно. Изменения действуют до закрытия страницы.</p>}</section>
      <section className="book-detail__description"><h2>Описание</h2><p>{book.description}</p></section>
    </article>}
  </main>;
}
