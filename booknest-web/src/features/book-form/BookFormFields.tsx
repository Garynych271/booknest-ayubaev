import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { genres } from '../../shared/lib/preferences';
import { editableGenres } from '../../shared/validation/bookFormSchema';
import type { BookFormValues } from '../../shared/validation/bookFormSchema';
import { FieldErrorText } from './FieldErrorText';

export interface BookFormFieldsProps { register: UseFormRegister<BookFormValues>; errors: FieldErrors<BookFormValues> }

export function BookFormFields({ register, errors }: BookFormFieldsProps) {
  return <>
    <fieldset><legend>Книга</legend>
      <p><label htmlFor="record-title">Название</label><input id="record-title" autoComplete="off" {...register('title')} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'record-title-error' : undefined} /><FieldErrorText id="record-title-error" message={errors.title?.message} /></p>
      <p><label htmlFor="record-author">Автор</label><input id="record-author" autoComplete="off" {...register('author')} aria-invalid={Boolean(errors.author)} aria-describedby={errors.author ? 'record-author-error' : undefined} /><FieldErrorText id="record-author-error" message={errors.author?.message} /></p>
      <p><label htmlFor="record-genre">Жанр</label><select id="record-genre" {...register('genre')} aria-invalid={Boolean(errors.genre)} aria-describedby={errors.genre ? 'record-genre-error' : undefined}>{editableGenres.map(value => <option key={value} value={value}>{genres[value]}</option>)}</select><FieldErrorText id="record-genre-error" message={errors.genre?.message} /></p>
      <p><label htmlFor="record-isbn">ISBN</label><input id="record-isbn" inputMode="numeric" autoComplete="off" {...register('isbn')} aria-invalid={Boolean(errors.isbn)} aria-describedby={errors.isbn ? 'record-isbn-error' : undefined} /><FieldErrorText id="record-isbn-error" message={errors.isbn?.message} /></p>
      <p><label htmlFor="record-year">Год публикации</label><input type="number" id="record-year" inputMode="numeric" {...register('publishedYear')} aria-invalid={Boolean(errors.publishedYear)} aria-describedby={errors.publishedYear ? 'record-year-error' : undefined} /><FieldErrorText id="record-year-error" message={errors.publishedYear?.message} /></p>
      <p><label htmlFor="record-description">Описание</label><textarea id="record-description" rows={6} {...register('description')} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'record-description-error' : undefined} /><FieldErrorText id="record-description-error" message={errors.description?.message} /></p>
    </fieldset>
    <fieldset><legend>Учебная запись выдачи</legend>
      <p><label htmlFor="record-issued">Дата выдачи</label><input type="date" id="record-issued" {...register('issuedDate')} aria-invalid={Boolean(errors.issuedDate)} aria-describedby={errors.issuedDate ? 'record-issued-error' : undefined} /><FieldErrorText id="record-issued-error" message={errors.issuedDate?.message} /></p>
      <p><label htmlFor="record-due">Срок возврата</label><input type="date" id="record-due" {...register('dueDate')} aria-invalid={Boolean(errors.dueDate)} aria-describedby={errors.dueDate ? 'record-due-error' : undefined} /><FieldErrorText id="record-due-error" message={errors.dueDate?.message} /></p>
    </fieldset>
  </>;
}
