import type { Book } from '../../types';
import { Link } from 'react-router-dom';
import { bookPath } from '../../shared/lib/navigation';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { BookCover } from '../../shared/components/BookCover';
export interface BookCardProps { book: Book; saved: boolean; onToggle: (book: Book) => void }
export function BookCard({ book, saved, onToggle }: BookCardProps) {
  return <article className="book-card book-card--interactive" data-book-id={book.id}>
    <h3>{book.title}</h3>
    <BookCover key={book.cover ?? 'none'} book={book} />
    <dl>
      <dt>Год</dt><dd>{book.year ?? 'Не указан'}</dd>
      <dt>Темы</dt><dd>{book.genre}</dd>
      <dt>Доступность</dt><dd><Badge tone={book.available ? 'available' : 'neutral'}>{book.available ? 'Открытый электронный доступ' : 'Открытый доступ не подтверждён'}</Badge></dd>
      <dt>Рейтинг Open Library</dt><dd>{book.rating === null ? 'Нет оценок' : `${book.rating.toFixed(1)} из 5`}</dd>
    </dl>
    <footer className="book-card__actions">
      <Button data-action="toggle" aria-pressed={saved} aria-label={`${saved ? 'В моём списке' : 'Хочу прочитать'}: ${book.title}`} onClick={() => onToggle(book)}>{saved ? 'В моём списке' : 'Хочу прочитать'}</Button>
      <Link to={bookPath(book.id)}>Подробнее: {book.title}</Link>
    </footer>
  </article>;
}
