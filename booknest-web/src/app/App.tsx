import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { Book, Preferences, SavedBook } from '../types';
import { defaultFilters, loadPreferences, savePreferences, toggleWishlist } from '../shared/lib/preferences';
import { AppLayout } from './AppLayout';
import { RequireAuth } from './RequireAuth';
import { CatalogPage } from '../pages/CatalogPage';
import { BookDetailsPage } from '../pages/BookDetailsPage';
import { BookFormPage } from '../pages/BookFormPage';
import { WishlistPage } from '../pages/WishlistPage';
import { LoginPage } from '../pages/LoginPage';
import { LoanPage } from '../pages/LoanPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export default function App() {
  const [loaded] = useState(loadPreferences);
  const [wishlist, setWishlist] = useState(loaded.wishlist);
  const [storageAvailable, setStorageAvailable] = useState(loaded.storageAvailable);
  const persist = (next: SavedBook[]) => {
    const value: Preferences = { filters: defaultFilters(), page: 1, wishlist: next };
    setWishlist(next);
    setStorageAvailable(savePreferences(value));
  };
  const toggle = (book: Book) => persist(toggleWishlist(wishlist, book));
  const remove = (id: string) => persist(wishlist.filter(book => book.id !== id));

  return <Routes>
    <Route element={<AppLayout wishlistCount={wishlist.length} />}>
      <Route index element={<Navigate to="/books" replace />} />
      <Route path="books" element={<CatalogPage wishlist={wishlist} onToggle={toggle} />} />
      <Route path="books/new" element={<BookFormPage mode="create" />} />
      <Route path="books/:bookId" element={<BookDetailsPage wishlist={wishlist} storageAvailable={storageAvailable} onToggle={toggle} />} />
      <Route path="books/:bookId/edit" element={<BookFormPage mode="edit" />} />
      <Route path="wishlist" element={<RequireAuth><WishlistPage books={wishlist} onRemove={remove} storageAvailable={storageAvailable} /></RequireAuth>} />
      <Route path="login" element={<LoginPage />} />
      <Route path="loan" element={<LoanPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
