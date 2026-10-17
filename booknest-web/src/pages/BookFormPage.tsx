import { useParams } from 'react-router-dom';
import { BookForm } from '../features/book-form/BookForm';

export interface BookFormPageProps { mode: 'create' | 'edit' }

export function BookFormPage({ mode }: BookFormPageProps) {
  const { bookId } = useParams();
  return <BookForm mode={mode} id={bookId ?? null} />;
}
