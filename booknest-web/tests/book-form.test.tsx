// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BOOK_RECORDS_KEY,
  BookRecordApiError,
  MOCK_409_ISBN,
  MOCK_422_TITLE,
  MOCK_500_TITLE,
  getBookDetails,
  getEditableBook,
  saveBookRecord,
} from '../src/api/bookRecords';
import { BookForm } from '../src/features/book-form/BookForm';
import { bookFormSchema } from '../src/shared/validation/bookFormSchema';
import type { BookFormValues } from '../src/shared/validation/bookFormSchema';

const validValues: BookFormValues = {
  title: 'Solaris',
  author: 'Stanislaw Lem',
  genre: 'science-fiction',
  isbn: '9780571311571',
  publishedYear: '1961',
  issuedDate: '2026-10-17',
  dueDate: '2026-10-31',
  description: 'A study of contact with an unknowable intelligence.',
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('book form schema and UI', () => {
  it('accepts all eight fields and rejects an invalid date interval', () => {
    expect(bookFormSchema.safeParse(validValues).success).toBe(true);
    const parsed = bookFormSchema.safeParse({ ...validValues, dueDate: validValues.issuedDate });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.flatten().fieldErrors.dueDate?.[0]).toBeDefined();
  });

  it('connects client errors to invalid fields', async () => {
    const { container } = render(<MemoryRouter><BookForm mode="create" id={null} /></MemoryRouter>);
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    await waitFor(() => expect(container.querySelector('#record-title')?.getAttribute('aria-invalid')).toBe('true'));
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(4);
  });
});

describe('local CRUD adapter', () => {
  it('creates, reads and edits a record with a stable identifier', async () => {
    const created = await saveBookRecord('create', null, validValues, { storage: localStorage, delay: 0 });
    expect(created.id).toMatch(/^BN-/);
    await expect(getBookDetails(created.id, { storage: localStorage, delay: 0 })).resolves.toMatchObject({ title: 'Solaris' });
    const edited = await saveBookRecord('edit', created.id, { ...validValues, title: 'Solaris: edit' }, { storage: localStorage, delay: 0 });
    expect(edited.id).toBe(created.id);
    expect(JSON.parse(localStorage.getItem(BOOK_RECORDS_KEY) ?? '[]')).toHaveLength(1);
  });

  it.each([
    [422, { ...validValues, title: MOCK_422_TITLE }, 'title'],
    [409, { ...validValues, isbn: MOCK_409_ISBN }, 'isbn'],
    [500, { ...validValues, title: MOCK_500_TITLE }, null],
  ])('maps mock status %i without persisting invalid data', async (status, values, field) => {
    const pending = saveBookRecord('create', null, values, { storage: localStorage, delay: 0 });
    await expect(pending).rejects.toMatchObject({ status });
    try { await pending; } catch (error) {
      expect(error).toBeInstanceOf(BookRecordApiError);
      if (field) expect((error as BookRecordApiError).fieldErrors).toHaveProperty(field);
    }
    expect(localStorage.getItem(BOOK_RECORDS_KEY)).toBeNull();
  });

  it('honors AbortSignal during submission', async () => {
    const controller = new AbortController();
    const pending = saveBookRecord('create', null, validValues, { storage: localStorage, delay: 50, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('normalizes Open Library data to the form schema during prefill', async () => {
    vi.stubGlobal('fetch', async (value: URL | RequestInfo) => String(value).includes('/works/')
      ? new Response(JSON.stringify({ title: 'T'.repeat(130), description: 'D'.repeat(1100) }))
      : new Response(JSON.stringify({ docs: [{ key: '/works/OL109524W', title: 'Solaris', author_name: ['A'.repeat(110)], first_publish_year: 2500 }] })));
    const values = await getEditableBook('OL109524W', { storage: localStorage, delay: 0 });
    expect(values.title).toHaveLength(120);
    expect(values.author).toHaveLength(100);
    expect(values.description).toHaveLength(1000);
    expect(values.publishedYear).toBe(String(new Date().getFullYear()));
    expect(bookFormSchema.safeParse(values).success).toBe(true);
  });
});
