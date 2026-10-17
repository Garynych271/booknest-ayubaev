import type { Filters, Genre, Sort, SavedBook, Preferences, LoadedPreferences } from '../../types';
import { record } from './values';
import { books as legacyBooks } from '../../../../data/books.js';

export const API_STORAGE_KEY = 'booknest.catalog.v2';
export const genres: Record<Genre, string> = { '': 'Все жанры', 'science-fiction': 'Научная фантастика', novel: 'Роман', 'non-fiction': 'Нон-фикшн', history: 'История', programming: 'Программирование' };
export const sorts: Record<Sort, string> = { title: 'По названию', 'year-desc': 'Сначала новые', 'rating-desc': 'По рейтингу' };
export const defaultFilters = (): Filters => ({ query: '', genre: '', sort: 'title', available: false });
export const isGenre = (value: unknown): value is Genre => typeof value === 'string' && Object.hasOwn(genres, value);
export const isSort = (value: unknown): value is Sort => typeof value === 'string' && Object.hasOwn(sorts, value);
export const isWorkId = (value: unknown): value is string => typeof value === 'string' && /^OL\d+W$/.test(value);
export function normalizeFilters(value: unknown): Filters {
  const source = record(value);
  return { query: typeof source.query === 'string' ? source.query.slice(0, 80) : '', genre: isGenre(source.genre) ? source.genre : '', sort: isSort(source.sort) ? source.sort : 'title', available: source.available === true };
}
export function normalizeWishlist(value: unknown): SavedBook[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item: unknown) => {
    const book = record(item);
    if (typeof book.id !== 'string' || !(isWorkId(book.id) || /^b\d{2}$/.test(book.id)) || typeof book.title !== 'string' || typeof book.author !== 'string' || seen.has(book.id)) return [];
    seen.add(book.id);
    return [{ id: book.id, title: book.title.slice(0, 500), author: book.author.slice(0, 500) }];
  });
}
export function toggleWishlist(books: SavedBook[], book: SavedBook): SavedBook[] {
  return books.some(item => item.id === book.id) ? books.filter(item => item.id !== book.id) : [...books, { id: book.id, title: book.title, author: book.author }];
}
export function loadPreferences(getStorage: () => Storage = () => localStorage): LoadedPreferences {
  const defaults: LoadedPreferences = { filters: defaultFilters(), page: 1, wishlist: [], storageAvailable: true };
  try {
    const storage = getStorage();
    const raw = storage.getItem(API_STORAGE_KEY);
    if (raw) {
      const value = record(JSON.parse(raw));
      if (value.version !== 2) return defaults;
      return { ...defaults, filters: normalizeFilters(value.filters), page: typeof value.page === 'number' && Number.isSafeInteger(value.page) && value.page > 0 ? value.page : 1, wishlist: normalizeWishlist(value.wishlist) };
    }
    const legacy = record(JSON.parse(storage.getItem('booknest.catalog.v1') || 'null'));
    const ids: unknown[] = Array.isArray(legacy.wishlist) ? legacy.wishlist : [];
    return legacy.version === 1 ? { ...defaults, filters: normalizeFilters(legacy.filters), wishlist: normalizeWishlist(legacyBooks.filter(book => ids.includes(book.id))) } : defaults;
  } catch (error) { return { ...defaults, storageAvailable: error instanceof SyntaxError }; }
}
export function savePreferences(value: Preferences, getStorage: () => Storage = () => localStorage): boolean {
  try {
    getStorage().setItem(API_STORAGE_KEY, JSON.stringify({ version: 2, filters: value.filters, page: value.page, wishlist: normalizeWishlist(value.wishlist) }));
    return true;
  } catch { return false; }
}
