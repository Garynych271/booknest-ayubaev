import test from 'node:test';
import assert from 'node:assert/strict';
import { books } from '../data/books.js';
import { defaultFilters } from '../lib/books.js';
import { loadPreferences, savePreferences, STORAGE_KEY } from '../storage.js';

test('round trip restores all filters and wishlist using one versioned key', () => {
  const values = new Map();
  const storage = () => ({ getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) });
  const original = { filters: { query: 'Solaris', genre: 'science-fiction', sort: 'year-desc', available: true }, wishlist: ['b01'] };
  assert.equal(savePreferences(original, storage), true);
  assert.equal(values.size, 1);
  assert.ok(values.has(STORAGE_KEY));
  assert.deepEqual(loadPreferences(books, storage), { ...original, storageAvailable: true });
});

test('invalid JSON and invalid schemas safely recover default filters', () => {
  for (const raw of ['{broken', 'null', '[]', '42', '{"version":99}', '{"version":1,"filters":null,"wishlist":"wrong"}']) {
    assert.deepEqual(loadPreferences(books, () => ({ getItem: () => raw })), { filters: defaultFilters(), wishlist: [], storageAvailable: true });
  }
  const raw = JSON.stringify({ version: 1, filters: { genre: 'unknown' }, wishlist: ['b01', 'b01', 'b404'] });
  assert.deepEqual(loadPreferences(books, () => ({ getItem: () => raw })).wishlist, ['b01']);
});

test('blocked storage getter, failed reads and quota failures never escape', () => {
  const blocked = () => { throw new Error('SecurityError'); };
  assert.equal(loadPreferences(books, blocked).storageAvailable, false);
  assert.equal(savePreferences({ filters: defaultFilters(), wishlist: [] }, blocked), false);
  assert.equal(loadPreferences(books, () => ({ getItem() { throw new Error('unreadable'); } })).storageAvailable, false);
  assert.equal(savePreferences({}, () => ({ setItem() { throw new Error('QuotaExceededError'); } })), false);
});
