import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Book, Filters, SavedBook } from '../types';
import { defaultFilters } from '../shared/lib/preferences';
import { CatalogView } from '../features/catalog/CatalogView';
import { readCatalogParams, writeCatalogParams } from '../features/catalog/searchParams';

export interface CatalogPageProps { wishlist: SavedBook[]; onToggle: (book: Book) => void }

export function CatalogPage({ wishlist, onToggle }: CatalogPageProps) {
  const [params, setParams] = useSearchParams();
  const { filters, page } = useMemo(() => readCatalogParams(params), [params]);
  const updateFilters = useCallback((next: Filters) => setParams(writeCatalogParams(next, 1)), [setParams]);
  const updatePage = useCallback((next: number) => setParams(writeCatalogParams(filters, next)), [filters, setParams]);
  const reset = useCallback(() => setParams(writeCatalogParams(defaultFilters(), 1)), [setParams]);

  return <CatalogView filters={filters} page={page} wishlist={wishlist} onFiltersChange={updateFilters}
    onReset={reset} onPageChange={updatePage} onToggle={onToggle} />;
}
