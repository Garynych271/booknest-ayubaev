import test from 'node:test';
import assert from 'node:assert/strict';
import { books, genres } from '../data/books.js';
import { defaultFilters, normalizeFilters, normalizeWishlist, selectBooks, toggleWishlist } from '../lib/books.js';

test('dataset has 40 unique books in five genres, eight per genre', () => {
  assert.equal(books.length, 40);
  assert.equal(new Set(books.map(b => b.id)).size, 40);
  for (const genre of Object.keys(genres)) assert.equal(books.filter(b => b.genre === genre).length, 8);
  for (const b of books) {
    assert.equal(typeof b.title, 'string');
    assert.equal(typeof b.author, 'string');
    assert.ok(Number.isInteger(b.year));
    assert.ok(b.rating >= 0 && b.rating <= 5);
    assert.equal(typeof b.available, 'boolean');
  }
});

test('search ignores case, trims whitespace and matches title or author', () => {
  assert.deepEqual(selectBooks(books, { query: ' sOLaRis ' }).map(b => b.id), ['b01']);
  assert.deepEqual(selectBooks(books, { query: 'РОБЕРТ МАРТИН' }).map(b => b.id).sort(), ['b33', 'b38']);
  assert.deepEqual(selectBooks(books, { query: 'нет такой книги' }), []);
});

test('combined filters intersect and sorting does not mutate frozen inputs', () => {
  const before = [...books];
  const filters = Object.freeze({ query: 'мартин', genre: 'programming', available: true, sort: 'rating-desc' });
  assert.deepEqual(selectBooks(books, filters).map(b => b.id), ['b40', 'b33']);
  assert.deepEqual(books, before);
  for (const [sort, key] of [['year-desc', 'year'], ['rating-desc', 'rating']]) {
    const sorted = selectBooks(books, { sort });
    assert.ok(sorted.every((b, i) => !i || sorted[i - 1][key] >= b[key]));
  }
  const titles = selectBooks(books);
  assert.ok(titles.every((b, i) => !i || titles[i - 1].title.localeCompare(b.title, 'ru') <= 0));
});

test('sort ties are deterministic', () => {
  const input = Object.freeze([{ id: '2', title: 'Б', year: 2000, rating: 4 }, { id: '1', title: 'А', year: 2000, rating: 4 }]);
  for (const sort of ['title', 'year-desc', 'rating-desc']) assert.deepEqual(selectBooks(input, { sort }).map(b => b.id), ['1', '2']);
});

test('saved filters and wishlist reject bad types, unknown IDs and duplicates', () => {
  for (const bad of [null, false, [], 'text', 42]) assert.deepEqual(normalizeFilters(bad), defaultFilters());
  assert.deepEqual(normalizeFilters({ query: 4, genre: 'toString', sort: 'bad', available: 'true' }), defaultFilters());
  assert.equal(normalizeFilters({ query: 'x'.repeat(100) }).query.length, 80);
  assert.deepEqual(normalizeWishlist(['b01', 'b01', 'missing', null, 1], books), ['b01']);
  assert.deepEqual(normalizeWishlist({}, books), []);
});

test('wishlist toggles without mutating the input', () => {
  const input = Object.freeze(['b01']);
  assert.deepEqual(toggleWishlist(input, 'b02'), ['b01', 'b02']);
  assert.deepEqual(toggleWishlist(input, 'b01'), []);
  assert.deepEqual(input, ['b01']);
});
