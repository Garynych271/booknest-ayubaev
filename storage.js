import { defaultFilters, normalizeFilters, normalizeWishlist } from './lib/books.js';

export const STORAGE_KEY = 'booknest.catalog.v1';

export function loadPreferences(books, getStorage = () => globalThis.localStorage) {
  const defaults = { filters: defaultFilters(), wishlist: [], storageAvailable: true };
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return defaults;
    return {
      filters: normalizeFilters(value.filters),
      wishlist: normalizeWishlist(value.wishlist, books),
      storageAvailable: true,
    };
  } catch (error) {
    return { ...defaults, storageAvailable: error instanceof SyntaxError };
  }
}

export function savePreferences(preferences, getStorage = () => globalThis.localStorage) {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify({ version: 1, filters: preferences.filters, wishlist: preferences.wishlist }));
    return true;
  } catch { return false; }
}
