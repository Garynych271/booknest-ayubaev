export type Genre = '' | 'science-fiction' | 'novel' | 'non-fiction' | 'history' | 'programming';
export type Sort = 'title' | 'year-desc' | 'rating-desc';
export type View = 'catalog' | 'book' | 'loan';
export type ErrorKind = 'http' | 'network' | 'timeout' | 'data';
export interface Filters { query: string; genre: Genre; sort: Sort; available: boolean }
export interface Book {
  id: string; title: string; author: string; year: number | null; genre: string;
  available: boolean; rating: number | null; cover: number | null;
}
export interface BookDetail extends Book { description: string }
export interface SavedBook { id: string; title: string; author: string }
export interface SearchResult { books: Book[]; total: number; skipped: number }
export interface Preferences { filters: Filters; page: number; wishlist: SavedBook[] }
export interface LoadedPreferences extends Preferences { storageAvailable: boolean }
export interface PageInfo { view: View; id: string | null }
export type RequestState<T> =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
