import { useState } from 'react';
import type { Book, Filters, Preferences } from '../types';
import { defaultFilters, loadPreferences, savePreferences, toggleWishlist } from '../shared/lib/preferences';
import { readPage } from '../shared/lib/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { CatalogView } from '../features/catalog/CatalogView';
import { BookDetails } from '../features/books/BookDetails';
import { LoanPage } from '../pages/LoanPage';
import { useTheme } from '../shared/contexts/theme';

export default function App() {
  const { theme } = useTheme();
  const [loaded] = useState(loadPreferences);
  const [preferences, setPreferences] = useState<Preferences>({ filters: loaded.filters, page: loaded.page, wishlist: loaded.wishlist });
  const [storageAvailable, setStorageAvailable] = useState(loaded.storageAvailable);
  const pageInfo = readPage(location.search);
  const apply = (next: Preferences) => { setPreferences(next); setStorageAvailable(savePreferences(next)); };
  const updateFilters = (filters: Filters) => apply({ ...preferences, filters, page: 1 });
  const toggle = (book: Book) => apply({ ...preferences, wishlist: toggleWishlist(preferences.wishlist, book) });
  return <div className="page" data-theme={theme}>
    <Header view={pageInfo.view} wishlistCount={preferences.wishlist.length} />
    {pageInfo.view === 'catalog' && <CatalogView filters={preferences.filters} page={preferences.page} wishlist={preferences.wishlist}
      storageAvailable={storageAvailable} onFiltersChange={updateFilters}
      onReset={() => updateFilters(defaultFilters())} onPageChange={page => apply({ ...preferences, page })}
      onToggle={toggle} onRemove={id => apply({ ...preferences, wishlist: preferences.wishlist.filter(book => book.id !== id) })} />}
    {pageInfo.view === 'book' && <BookDetails id={pageInfo.id} wishlist={preferences.wishlist} storageAvailable={storageAvailable} onToggle={toggle} />}
    {pageInfo.view === 'loan' && <LoanPage />}
    <Footer />
  </div>;
}
