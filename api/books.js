import { request, ApiError } from './client.js';
import { normalizeFilters } from '../lib/books.js';

export const PAGE_SIZE = 20;
export const MIN_QUERY = 2;
export const isWorkId = id => typeof id === 'string' && /^OL\d+W$/.test(id);
const fields = 'key,title,author_name,first_publish_year,subject,ebook_access,ratings_average,cover_i';
const subjects = { 'science-fiction': 'science fiction', novel: 'fiction', 'non-fiction': 'nonfiction', history: 'history', programming: 'programming' };
const sorts = { title: 'title', 'year-desc': 'new', 'rating-desc': 'rating' };
const quote = value => `"${value.replace(/[\\"]/g, '\\$&')}"`;
const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

export function normalizeBook(doc) {
  const id = typeof doc?.key === 'string' ? doc.key.replace(/^\/works\//, '') : '';
  if (!isWorkId(id)) return null;
  return {
    id, title: typeof doc.title === 'string' ? doc.title : 'Без названия',
    author: strings(doc.author_name).join(', ') || 'Автор не указан',
    year: Number.isInteger(doc.first_publish_year) ? doc.first_publish_year : null,
    genre: strings(doc.subject).slice(0, 3).join(', ') || 'Не указан',
    available: doc.ebook_access === 'public',
    rating: Number.isFinite(doc.ratings_average) ? doc.ratings_average : null,
    cover: Number.isInteger(doc.cover_i) && doc.cover_i > 0 ? doc.cover_i : null,
  };
}

export function searchParams(filters, page = 1) {
  const value = normalizeFilters(filters);
  const term = quote(value.query.trim());
  const clauses = [`(title:${term} OR author:${term})`];
  if (value.genre) clauses.push(`subject:${quote(subjects[value.genre])}`);
  if (value.available) clauses.push('ebook_access:public');
  return { q: clauses.join(' AND '), fields, limit: String(PAGE_SIZE), page: String(Math.max(1, Math.trunc(page) || 1)), sort: sorts[value.sort] };
}

export async function searchBooks(filters, page, options) {
  if (filters.query.trim().length < MIN_QUERY) return { books: [], total: 0 };
  const data = await request('/search.json', searchParams(filters, page), options);
  if (!Array.isArray(data?.docs) || !Number.isFinite(data.numFound ?? data.num_found)) throw new ApiError('Invalid search response', 0, 'data');
  const books = data.docs.map(normalizeBook).filter(Boolean);
  return { books, total: Math.max(0, data.numFound ?? data.num_found), skipped: data.docs.length - books.length };
}

export async function getBook(id, options) {
  if (!isWorkId(id)) throw new ApiError('Invalid work identifier', 404);
  // Both endpoints depend only on the work ID, not on each other's response.
  const [work, search] = await Promise.all([
    request(`/works/${id}.json`, {}, options),
    request('/search.json', { q: `key:/works/${id}`, fields, limit: '1' }, options),
  ]);
  if (!work || typeof work.title !== 'string') throw new ApiError('Invalid work response', 0, 'data');
  const metadata = search?.docs?.find(doc => normalizeBook(doc)?.id === id);
  const book = normalizeBook(metadata || { key: id, title: work.title, subject: work.subjects, cover_i: work.covers?.[0] });
  const description = typeof work.description === 'string' ? work.description : work.description?.value;
  return { ...book, title: work.title, description: typeof description === 'string' ? description : 'Описание отсутствует в Open Library.' };
}
