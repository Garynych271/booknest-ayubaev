import { request, ApiError } from './client';
import type { RequestOptions } from './client';
import type { Book, BookDetail, Filters, Genre, Sort, SearchResult } from '../types';
import { isWorkId, normalizeFilters } from '../lib/preferences';
import { record, strings, finite } from '../lib/values';
export const PAGE_SIZE = 20;
export const MIN_QUERY = 2;
const fields = 'key,title,author_name,first_publish_year,subject,ebook_access,ratings_average,cover_i';
const subjects: Record<Genre, string> = { '': '', 'science-fiction': 'science fiction', novel: 'fiction', 'non-fiction': 'nonfiction', history: 'history', programming: 'programming' };
const sorts: Record<Sort, string> = { title: 'title', 'year-desc': 'new', 'rating-desc': 'rating' };
const quote = (value: string): string => `"${value.replace(/[\\"]/g, '\\$&')}"`;
export function normalizeBook(value: unknown): Book | null {
  const doc = record(value);
  const id = typeof doc.key === 'string' ? doc.key.replace(/^\/works\//, '') : '';
  if (!isWorkId(id)) return null;
  const year = finite(doc.first_publish_year);
  const cover = finite(doc.cover_i);
  return { id, title: typeof doc.title === 'string' ? doc.title : 'Без названия', author: strings(doc.author_name).join(', ') || 'Автор не указан',
    year: year !== null && Number.isInteger(year) ? year : null, genre: strings(doc.subject).slice(0, 3).join(', ') || 'Не указан',
    available: doc.ebook_access === 'public', rating: finite(doc.ratings_average), cover: cover !== null && Number.isInteger(cover) && cover > 0 ? cover : null };
}
export function searchParams(filters: Filters, page = 1): Record<string, string> {
  const value = normalizeFilters(filters);
  const term = quote(value.query.trim());
  const clauses = [`(title:${term} OR author:${term})`];
  if (value.genre) clauses.push(`subject:${quote(subjects[value.genre])}`);
  if (value.available) clauses.push('ebook_access:public');
  return { q: clauses.join(' AND '), fields, limit: String(PAGE_SIZE), page: String(Math.max(1, Math.trunc(page) || 1)), sort: sorts[value.sort] };
}
export async function searchBooks(filters: Filters, page: number, options?: RequestOptions): Promise<SearchResult> {
  if (filters.query.trim().length < MIN_QUERY) return { books: [], total: 0, skipped: 0 };
  const data = record(await request('/search.json', searchParams(filters, page), options));
  const total = finite(data.numFound ?? data.num_found);
  if (!Array.isArray(data.docs) || total === null) throw new ApiError('Invalid search response', 0, 'data');
  const books = data.docs.map(normalizeBook).filter((book): book is Book => book !== null);
  return { books, total: Math.max(0, total), skipped: data.docs.length - books.length };
}
export async function getBook(id: string, options?: RequestOptions): Promise<BookDetail> {
  if (!isWorkId(id)) throw new ApiError('Invalid work identifier', 404);
  const [rawWork, rawSearch] = await Promise.all([
    request(`/works/${id}.json`, {}, options),
    request('/search.json', { q: `key:/works/${id}`, fields, limit: '1' }, options),
  ]);
  const work = record(rawWork);
  const search = record(rawSearch);
  if (typeof work.title !== 'string') throw new ApiError('Invalid work response', 0, 'data');
  const metadata: unknown = Array.isArray(search.docs) ? search.docs.find((doc: unknown) => normalizeBook(doc)?.id === id) : undefined;
  const cover: unknown = Array.isArray(work.covers) ? work.covers[0] : undefined;
  const book = normalizeBook(metadata || { key: id, title: work.title, subject: work.subjects, cover_i: cover });
  if (!book) throw new ApiError('Invalid metadata', 0, 'data');
  const description = typeof work.description === 'string' ? work.description : record(work.description).value;
  return { ...book, title: work.title, description: typeof description === 'string' ? description : 'Описание отсутствует в Open Library.' };
}
