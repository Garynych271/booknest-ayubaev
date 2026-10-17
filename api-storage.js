import { books as legacyBooks } from './data/books.js';
import { defaultFilters, normalizeFilters } from './lib/books.js';
import { isWorkId } from './api/books.js';

export const API_STORAGE_KEY = 'booknest.catalog.v2';
export function normalizeSaved(value) {
  if (!Array.isArray(value)) return [];
  const ids = new Set();
  return value.filter(book => {
    if (!book || !(isWorkId(book.id) || /^b\d{2}$/.test(book.id)) || typeof book.title !== 'string' || typeof book.author !== 'string' || ids.has(book.id)) return false;
    ids.add(book.id);
    return true;
  }).map(({ id, title, author }) => ({ id, title: title.slice(0, 500), author: author.slice(0, 500) }));
}
export function loadApiPreferences(getStorage = () => globalThis.localStorage) {
  const defaults = { filters: defaultFilters(), page: 1, wishlist: [], storageAvailable: true };
  try {
    const storage = getStorage();
    const raw = storage.getItem(API_STORAGE_KEY);
    if (raw) {
      const value = JSON.parse(raw);
      if (value?.version !== 2) return defaults;
      return { ...defaults, filters: normalizeFilters(value.filters), page: Number.isSafeInteger(value.page) && value.page > 0 ? value.page : 1, wishlist: normalizeSaved(value.wishlist) };
    }
    const legacy = JSON.parse(storage.getItem('booknest.catalog.v1') || 'null');
    if (legacy?.version === 1) return { ...defaults, filters: normalizeFilters(legacy.filters), wishlist: normalizeSaved(legacyBooks.filter(book => Array.isArray(legacy.wishlist) && legacy.wishlist.includes(book.id))) };
    return defaults;
  } catch (error) { return { ...defaults, storageAvailable: error instanceof SyntaxError }; }
}
export function saveApiPreferences(state, getStorage = () => globalThis.localStorage) {
  try {
    getStorage().setItem(API_STORAGE_KEY, JSON.stringify({ version: 2, filters: state.filters, page: state.page, wishlist: normalizeSaved(state.wishlist) }));
    return true;
  } catch { return false; }
}
