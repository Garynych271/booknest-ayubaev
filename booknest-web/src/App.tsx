import { useState } from 'react';
import type { Book, Filters, Preferences } from './types';
import { defaultFilters, loadPreferences, savePreferences, toggleWishlist } from './lib/preferences';
import { readPage } from './lib/navigation';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CatalogPage } from './components/CatalogPage';
import { BookDetails } from './components/BookDetails';
import { LoanPage } from './components/LoanPage';
import { useTheme } from './contexts/theme';

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
    {pageInfo.view === 'catalog' && <CatalogPage filters={preferences.filters} page={preferences.page} wishlist={preferences.wishlist}
      storageAvailable={storageAvailable} onFiltersChange={updateFilters}
      onReset={() => updateFilters(defaultFilters())} onPageChange={page => apply({ ...preferences, page })}
      onToggle={toggle} onRemove={id => apply({ ...preferences, wishlist: preferences.wishlist.filter(book => book.id !== id) })} />}
    {pageInfo.view === 'book' && <BookDetails id={pageInfo.id} wishlist={preferences.wishlist} storageAvailable={storageAvailable} onToggle={toggle} />}
    {pageInfo.view === 'loan' && <LoanPage />}
    <Footer />
  </div>;
}
