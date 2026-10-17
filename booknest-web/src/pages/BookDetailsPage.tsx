import { useParams } from 'react-router-dom';
import type { Book, SavedBook } from '../types';
import { BookDetails } from '../features/books/BookDetails';

export interface BookDetailsPageProps { wishlist: SavedBook[]; storageAvailable: boolean; onToggle: (book: Book) => void }

export function BookDetailsPage(props: BookDetailsPageProps) {
  const { bookId } = useParams();
  return <BookDetails id={bookId ?? null} {...props} />;
}
