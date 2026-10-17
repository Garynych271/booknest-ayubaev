import { useState } from 'react';
import type { Book } from '../../types';
export interface BookCoverProps { book: Book; detail?: boolean }
export function BookCover({ book, detail = false }: BookCoverProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  return <figure className={detail ? 'book-detail__cover' : undefined}>
    {book.cover !== null && <img src={`https://covers.openlibrary.org/b/id/${book.cover}-M.jpg`}
      width={detail ? 360 : 180} height={detail ? 540 : 270} alt={`Обложка: ${book.title}`}
      hidden={status !== 'ready'} loading="eager"
      onLoad={event => setStatus(event.currentTarget.naturalWidth > 1 ? 'ready' : 'error')}
      onError={() => setStatus('error')} />}
    <figcaption>{book.author}</figcaption>
  </figure>;
}
