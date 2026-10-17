import { describe, expect, it } from 'vitest';
import { API_STORAGE_KEY, defaultFilters, loadPreferences, normalizeFilters, normalizeWishlist, savePreferences, toggleWishlist } from '../src/shared/lib/preferences';
import { bookPath, editBookPath } from '../src/shared/lib/navigation';
function memory(entries: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(entries));
  return { get length() { return values.size; }, clear: () => values.clear(), getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null, removeItem: key => { values.delete(key); }, setItem: (key, value) => { values.set(key, value); } };
}
describe('preferences and navigation', () => {
  it('normalizes filters and stable wishlist IDs', () => {
    expect(normalizeFilters({ query: 3, genre: 'bad', sort: 'bad', available: 'yes' })).toEqual(defaultFilters());
    expect(normalizeWishlist([{ id: 'OL1W', title: 'A', author: 'B' }, { id: 'OL1W', title: 'A', author: 'B' }, { id: '../x', title: 'X', author: 'Y' }])).toEqual([{ id: 'OL1W', title: 'A', author: 'B' }]);
    expect(toggleWishlist([], { id: 'OL1W', title: 'A', author: 'B' })).toHaveLength(1);
    expect(toggleWishlist([{ id: 'OL1W', title: 'A', author: 'B' }], { id: 'OL1W', title: 'A', author: 'B' })).toEqual([]);
  });
  it('round-trips v2 and migrates v1 without deleting it', () => {
    const storage = memory({ 'booknest.catalog.v1': JSON.stringify({ version: 1, filters: { query: 'Solaris' }, wishlist: ['b01'] }) });
    const migrated = loadPreferences(() => storage);
    expect(migrated.wishlist[0]?.id).toBe('b01');
    expect(savePreferences(migrated, () => storage)).toBe(true);
    expect(storage.getItem(API_STORAGE_KEY)).toContain('"version":2');
    expect(storage.getItem('booknest.catalog.v1')).not.toBeNull();
  });
  it('survives blocked storage and builds stable route paths', () => {
    expect(loadPreferences(() => { throw new Error('blocked'); }).storageAvailable).toBe(false);
    expect(savePreferences({ filters: defaultFilters(), page: 1, wishlist: [] }, () => { throw new Error('quota'); })).toBe(false);
    expect(bookPath('OL1W')).toBe('/books/OL1W');
    expect(editBookPath('OL1W')).toBe('/books/OL1W/edit');
  });
});
