export type Genre = '' | 'science-fiction' | 'novel' | 'non-fiction' | 'history' | 'programming';
export type Author = string;
export type Sort = 'title' | 'year-desc' | 'rating-desc';
export type Theme = 'light' | 'dark';
export type ErrorKind = 'http' | 'network' | 'timeout' | 'data';
export interface CurrentUser { id: string; displayName: string; role: 'reader' }
export interface Filters { query: string; genre: Genre; sort: Sort; available: boolean }
export interface Book {
  id: string; title: string; author: Author; year: number | null; genre: string;
  available: boolean; rating: number | null; cover: number | null;
}
export interface BookDetail extends Book { description: string }
export interface SavedBook { id: string; title: string; author: Author }
export interface SearchResult { books: Book[]; total: number; skipped: number }
export interface Preferences { filters: Filters; page: number; wishlist: SavedBook[] }
export interface LoadedPreferences extends Preferences { storageAvailable: boolean }
export type RequestState<T> =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
