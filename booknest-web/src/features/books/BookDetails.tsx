import { Link } from 'react-router-dom';
import { BASE_URL } from '../../api/client';
import { useBook } from './useBooks';
import type { BookDetail, RequestState, SavedBook } from '../../types';
import { Badge } from '../../shared/components/Badge';
import { BookCover } from '../../shared/components/BookCover';
import { Button } from '../../shared/components/Button';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorBox } from '../../shared/components/ErrorBox';
import { Spinner } from '../../shared/components/Spinner';
import { isWorkId } from '../../shared/lib/preferences';
import { editBookPath } from '../../shared/lib/navigation';
export interface BookDetailsProps { id: string | null; wishlist: SavedBook[]; storageAvailable: boolean; onToggle: (book: BookDetail) => void }
export function BookDetails({ id, wishlist, storageAvailable, onToggle }: BookDetailsProps) {
  const request = useBook(id);
  const result: RequestState<BookDetail> = id === null ? { status: 'empty', message: 'Выберите книгу в каталоге.' }
    : request.isLoading ? { status: 'loading' }
    : request.error ? { status: 'error', message: request.error }
    : request.data ? { status: 'success', data: request.data }
    : { status: 'loading' };
  const book = result.status === 'success' ? result.data : null;
  const saved = book ? wishlist.some(item => item.id === book.id) : false;
  return <main className="main main--book" aria-busy={result.status === 'loading'}>
    <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><Link to="/books">Каталог</Link></li><li><span aria-current="page">{book?.title ?? 'Карточка книги'}</span></li></ol></nav>
    <h1>{book?.title ?? 'Карточка книги'}</h1>
    {result.status === 'loading' && <Spinner label="Загружаем книгу…" />}
    {result.status === 'empty' && <EmptyState><Link to="/books">{result.message}</Link></EmptyState>}
    {result.status === 'error' && <ErrorBox message={result.message} onRetry={request.retry} />}
    {book && <article className="book-detail" data-state="success">
      <BookCover key={book.cover ?? 'none'} book={book} detail />
      <section className="book-detail__specs"><h2>Характеристики</h2><dl>
        <dt>Автор</dt><dd>{book.author}</dd><dt>Год первой публикации</dt><dd>{book.year ?? 'Не указан'}</dd>
        <dt>Темы</dt><dd>{book.genre}</dd><dt>Рейтинг Open Library</dt><dd>{book.rating === null ? 'Нет оценок' : `${book.rating.toFixed(1)} из 5`}</dd>
        <dt>Электронный доступ</dt><dd><Badge tone={book.available ? 'available' : 'neutral'}>{book.available ? 'Открытый доступ' : 'Открытый доступ не подтверждён'}</Badge></dd>
      </dl>{isWorkId(book.id) && <p><a href={`${BASE_URL}/works/${book.id}`}>Запись в Open Library</a></p>}
      <Button aria-pressed={saved} onClick={() => onToggle(book)}>{saved ? 'В моём списке' : 'Хочу прочитать'}</Button>
      <p><Link to={editBookPath(book.id)}>Редактировать запись</Link></p>
      {!storageAvailable && <p className="storage-notice" role="status">Сохранение недоступно. Изменения действуют до закрытия страницы.</p>}</section>
      <section className="book-detail__description"><h2>Описание</h2><p>{book.description}</p></section>
    </article>}
  </main>;
}
