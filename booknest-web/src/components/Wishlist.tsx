import { useRef } from 'react';
import type { SavedBook } from '../types';
import { isWorkId } from '../lib/preferences';
import { bookHref } from '../lib/navigation';
import { Button } from './Button';
import { Badge } from './Badge';
import { EmptyState } from './EmptyState';
export interface WishlistProps { books: SavedBook[]; onRemove: (id: string) => void }
export function Wishlist({ books, onRemove }: WishlistProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  return <section className="wishlist" id="wishlist" aria-labelledby="wishlist-title">
    <h2 ref={heading} id="wishlist-title" tabIndex={-1}>Мой список <Badge>{books.length}</Badge></h2>
    {books.length === 0 ? <EmptyState>В списке пока нет книг.</EmptyState> : <ul className="wishlist__list" data-wishlist-list>{books.map(book => <li key={book.id}>
      {isWorkId(book.id) ? <a href={bookHref(book.id)}>{book.title} · {book.author}</a> : <span>{book.title} · {book.author} (список ЛР3)</span>}
      <Button data-action="remove" aria-label={`Удалить из списка: ${book.title}`} onClick={() => { heading.current?.focus(); onRemove(book.id); }}>Удалить</Button>
    </li>)}</ul>}
  </section>;
}
