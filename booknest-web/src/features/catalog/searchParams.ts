import type { Filters } from '../../types';
import { defaultFilters, isGenre, isSort } from '../../shared/lib/preferences';

export interface CatalogUrlState { filters: Filters; page: number }

export function readCatalogParams(params: URLSearchParams): CatalogUrlState {
  const defaults = defaultFilters();
  const genre = params.get('genre');
  const sort = params.get('sort');
  const rawPage = Number(params.get('page'));
  return {
    filters: {
      query: (params.get('q') ?? '').slice(0, 80),
      genre: isGenre(genre) ? genre : defaults.genre,
      sort: isSort(sort) ? sort : defaults.sort,
      available: params.get('available') === '1',
    },
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function writeCatalogParams(filters: Filters, page: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.genre) params.set('genre', filters.genre);
  if (filters.available) params.set('available', '1');
  if (filters.sort !== 'title') params.set('sort', filters.sort);
  if (page > 1) params.set('page', String(page));
  return params;
}
