import { genres } from '../data/books.js';

export function defaultFilters() {
  return { query: '', genre: '', sort: 'title', available: false };
}

export function normalizeFilters(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    query: typeof source.query === 'string' ? source.query.slice(0, 80) : '',
    genre: Object.hasOwn(genres, source.genre) ? source.genre : '',
    sort: ['title', 'year-desc', 'rating-desc'].includes(source.sort) ? source.sort : 'title',
    available: source.available === true,
  };
}

export function selectBooks(books, filters = defaultFilters()) {
  const criteria = normalizeFilters(filters);
  const query = criteria.query.trim().toLocaleLowerCase('ru');
  const compareTitle = (a, b) => a.title.localeCompare(b.title, 'ru') || a.id.localeCompare(b.id);
  return books.filter(book =>
    (!query || `${book.title} ${book.author}`.toLocaleLowerCase('ru').includes(query)) &&
    (!criteria.genre || book.genre === criteria.genre) &&
    (!criteria.available || book.available)
  ).sort((a, b) => {
    if (criteria.sort === 'year-desc') return b.year - a.year || compareTitle(a, b);
    if (criteria.sort === 'rating-desc') return b.rating - a.rating || compareTitle(a, b);
    return compareTitle(a, b);
  });
}

export function normalizeWishlist(value, books) {
  const ids = new Set(books.map(book => book.id));
  return Array.isArray(value) ? [...new Set(value.filter(id => ids.has(id)))] : [];
}

export function toggleWishlist(wishlist, id) {
  return wishlist.includes(id) ? wishlist.filter(item => item !== id) : [...wishlist, id];
}
