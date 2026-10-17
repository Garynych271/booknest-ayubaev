import { ApiError } from './client';
import type { RequestOptions } from './client';
import { getBook } from './books';
import type { BookDetail } from '../types';
import { genres, isLocalBookId, isWorkId } from '../shared/lib/preferences';
import { bookFormSchema, newBookDefaults } from '../shared/validation/bookFormSchema';
import type { BookFormValues } from '../shared/validation/bookFormSchema';

export const BOOK_RECORDS_KEY = 'booknest.records.mock.v1';
export const MOCK_422_TITLE = 'Серверная проверка';
export const MOCK_500_TITLE = 'Сбой сервера';
export const MOCK_409_ISBN = '9783161484100';

interface StoredBookRecord { id: string; values: BookFormValues }
export interface BookRecordResult { id: string; values: BookFormValues }
export interface BookRecordOptions extends RequestOptions { storage?: Storage; delay?: number }

export class BookRecordApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Partial<Record<keyof BookFormValues, string>>;
  constructor(message: string, status: number, fieldErrors: Partial<Record<keyof BookFormValues, string>> = {}) {
    super(message);
    this.name = 'BookRecordApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function wait(delay: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Canceled', 'AbortError'));
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Canceled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, delay);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

function readRecords(storage: Storage): StoredBookRecord[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(BOOK_RECORDS_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.flatMap(item => {
      if (typeof item !== 'object' || item === null || !('id' in item) || !('values' in item) || typeof item.id !== 'string') return [];
      const parsed = bookFormSchema.safeParse(item.values);
      return parsed.success && (isLocalBookId(item.id) || isWorkId(item.id)) ? [{ id: item.id, values: parsed.data }] : [];
    });
  } catch { return []; }
}

function toDetail(record: StoredBookRecord): BookDetail {
  const { values } = record;
  return {
    id: record.id, title: values.title, author: values.author, year: Number(values.publishedYear),
    genre: genres[values.genre], available: true, rating: null, cover: null, description: values.description,
  };
}

function generatedId(): string {
  const random = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `BN-${random.toUpperCase()}`;
}

export async function getBookDetails(id: string, options: BookRecordOptions = {}): Promise<BookDetail> {
  const storage = options.storage ?? localStorage;
  await wait(options.delay ?? 120, options.signal);
  const local = readRecords(storage).find(record => record.id === id);
  if (local) return toDetail(local);
  return getBook(id, options);
}

export async function getEditableBook(id: string, options: BookRecordOptions = {}): Promise<BookFormValues> {
  const storage = options.storage ?? localStorage;
  await wait(options.delay ?? 120, options.signal);
  const local = readRecords(storage).find(record => record.id === id);
  if (local) return local.values;
  const book = await getBook(id, options);
  const workDigits = book.id.replace(/\D/g, '').padStart(10, '0').slice(-10);
  const currentYear = new Date().getFullYear();
  const publishedYear = book.year !== null && book.year >= 1000 && book.year <= currentYear ? book.year : currentYear;
  return {
    ...newBookDefaults(), title: book.title.slice(0, 120), author: book.author.slice(0, 100),
    genre: 'novel', isbn: `978${workDigits}`, publishedYear: String(publishedYear), description: book.description.slice(0, 1000),
  };
}

export async function saveBookRecord(mode: 'create' | 'edit', id: string | null, values: BookFormValues, options: BookRecordOptions = {}): Promise<BookRecordResult> {
  await wait(options.delay ?? 450, options.signal);
  const parsed = bookFormSchema.safeParse(values);
  if (!parsed.success) throw new BookRecordApiError('Validation failed', 422);
  if (parsed.data.title === MOCK_422_TITLE) throw new BookRecordApiError('Mock server validation failed', 422, { title: 'Учебный API отклонил это название.' });
  if (parsed.data.title === MOCK_500_TITLE) throw new BookRecordApiError('Mock service unavailable', 500);
  const storage = options.storage ?? localStorage;
  const records = readRecords(storage);
  if (parsed.data.isbn.replace(/\D/g, '') === MOCK_409_ISBN || records.some(record => record.id !== id && record.values.isbn === parsed.data.isbn)) {
    throw new BookRecordApiError('ISBN conflict', 409, { isbn: 'Запись с таким ISBN уже существует.' });
  }
  const recordId = mode === 'edit' && id ? id : generatedId();
  const next = [...records.filter(record => record.id !== recordId), { id: recordId, values: parsed.data }];
  try { storage.setItem(BOOK_RECORDS_KEY, JSON.stringify(next)); }
  catch { throw new BookRecordApiError('Local mock storage is unavailable', 500); }
  return { id: recordId, values: parsed.data };
}

export function bookRecordErrorMessage(error: unknown): string {
  if (error instanceof BookRecordApiError) {
    if (error.status >= 500) return 'Учебный сервис временно недоступен. Повторите позже.';
    return error.message;
  }
  if (error instanceof ApiError) return error.message;
  return 'Не удалось сохранить запись. Повторите попытку.';
}
