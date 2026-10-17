import { z } from 'zod';

export const editableGenres = ['science-fiction', 'novel', 'non-fiction', 'history', 'programming'] as const;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const bookFormSchema = z.object({
  title: z.string().trim().min(2, 'Введите не менее 2 символов.').max(120, 'Не более 120 символов.'),
  author: z.string().trim().min(2, 'Введите не менее 2 символов.').max(100, 'Не более 100 символов.'),
  genre: z.enum(editableGenres, { message: 'Выберите жанр.' }),
  isbn: z.string().trim().regex(/^(?:\d[ -]?){9,16}[\dX]$/i, 'Введите ISBN из 10–17 цифр.'),
  publishedYear: z.string().regex(/^\d{4}$/, 'Введите год из четырёх цифр.').refine(value => {
    const year = Number(value);
    return year >= 1000 && year <= new Date().getFullYear();
  }, 'Год не может быть в будущем.'),
  issuedDate: z.string().regex(isoDate, 'Укажите дату выдачи.'),
  dueDate: z.string().regex(isoDate, 'Укажите срок возврата.'),
  description: z.string().trim().min(10, 'Введите не менее 10 символов.').max(1000, 'Не более 1000 символов.'),
}).superRefine((value, context) => {
  if (isoDate.test(value.issuedDate) && isoDate.test(value.dueDate) && value.dueDate <= value.issuedDate) {
    context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Срок возврата должен быть позже даты выдачи.' });
  }
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

function isoDatePart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function newBookDefaults(now = new Date()): BookFormValues {
  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + 14);
  return {
    title: '', author: '', genre: 'novel', isbn: '', publishedYear: String(now.getUTCFullYear()),
    issuedDate: isoDatePart(now), dueDate: isoDatePart(due), description: '',
  };
}
