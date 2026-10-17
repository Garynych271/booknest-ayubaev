import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { SavedBook } from '../../types';
import { isBookId } from '../../shared/lib/preferences';
import { bookPath } from '../../shared/lib/navigation';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { EmptyState } from '../../shared/components/EmptyState';
export interface WishlistProps { books: SavedBook[]; onRemove: (id: string) => void }
export function Wishlist({ books, onRemove }: WishlistProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  return <section className="wishlist" id="wishlist" aria-labelledby="wishlist-title">
    <h1 ref={heading} id="wishlist-title" tabIndex={-1}>Мой список <Badge>{books.length}</Badge></h1>
    {books.length === 0 ? <EmptyState stateful={false}>В списке пока нет книг.</EmptyState> : <ul className="wishlist__list" data-wishlist-list>{books.map(book => <li key={book.id}>
      {isBookId(book.id) ? <Link to={bookPath(book.id)}>{book.title} · {book.author}</Link> : <span>{book.title} · {book.author} (список ЛР3)</span>}
      <Button data-action="remove" aria-label={`Удалить из списка: ${book.title}`} onClick={() => { heading.current?.focus(); onRemove(book.id); }}>Удалить</Button>
    </li>)}</ul>}
  </section>;
}
