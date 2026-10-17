import type { SavedBook } from '../types';
import { Wishlist } from '../features/wishlist/Wishlist';

export interface WishlistPageProps { books: SavedBook[]; onRemove: (id: string) => void; storageAvailable: boolean }

export function WishlistPage({ books, onRemove, storageAvailable }: WishlistPageProps) {
  return <main className="main">
    <Wishlist books={books} onRemove={onRemove} />
    {!storageAvailable && <p className="storage-notice" role="status">Сохранение недоступно. Изменения действуют до закрытия страницы.</p>}
  </main>;
}
