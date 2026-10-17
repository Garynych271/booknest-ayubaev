import type { Book, SavedBook } from '../types';
import { BookCard } from './BookCard';
export interface BookListProps { books: Book[]; wishlist: SavedBook[]; onToggle: (book: Book) => void }
export function BookList({ books, wishlist, onToggle }: BookListProps) {
  return <div className="book-grid">{books.map(book => <BookCard key={book.id} book={book} saved={wishlist.some(item => item.id === book.id)} onToggle={onToggle} />)}</div>;
}
