import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { BookRecordApiError, bookRecordErrorMessage, saveBookRecord } from '../../api/bookRecords';
import { isAbort } from '../../api/client';
import { useEditableBook } from '../books/useBooks';
import { bookPath } from '../../shared/lib/navigation';
import { bookFormSchema, newBookDefaults } from '../../shared/validation/bookFormSchema';
import type { BookFormValues } from '../../shared/validation/bookFormSchema';
import { Button } from '../../shared/components/Button';
import { ErrorBox } from '../../shared/components/ErrorBox';
import { Spinner } from '../../shared/components/Spinner';
import { BookFormFields } from './BookFormFields';

export interface BookFormProps { mode: 'create' | 'edit'; id: string | null }

export function BookForm({ mode, id }: BookFormProps) {
  const navigate = useNavigate();
  const editId = mode === 'edit' ? id : null;
  const source = useEditableBook(editId);
  const submitting = useRef<AbortController | null>(null);
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema), defaultValues: newBookDefaults(),
  });

  useEffect(() => { if (source.data) reset(source.data); }, [reset, source.data]);
  useEffect(() => () => submitting.current?.abort(), []);

  const submit: SubmitHandler<BookFormValues> = async values => {
    clearErrors();
    const controller = new AbortController();
    submitting.current?.abort();
    submitting.current = controller;
    try {
      const saved = await saveBookRecord(mode, id, values, { signal: controller.signal });
      navigate(bookPath(saved.id), { replace: true });
    } catch (error) {
      if (isAbort(error)) return;
      if (error instanceof BookRecordApiError && (error.status === 422 || error.status === 409)) {
        const fields = Object.entries(error.fieldErrors) as Array<[keyof BookFormValues, string]>;
        if (fields.length) { fields.forEach(([field, message]) => setError(field, { type: 'server', message })); return; }
      }
      setError('root.server', { type: 'server', message: bookRecordErrorMessage(error) });
    } finally {
      if (submitting.current === controller) submitting.current = null;
    }
  };

  if (mode === 'edit' && source.isLoading) return <main className="main"><h1>Редактирование записи</h1><Spinner label="Загружаем запись…" /></main>;
  if (mode === 'edit' && source.error) return <main className="main"><h1>Редактирование записи</h1><ErrorBox message={source.error} onRetry={source.retry} /></main>;
  return <main className="main form-page">
    <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><Link to="/books">Каталог</Link></li><li><span aria-current="page">{mode === 'create' ? 'Новая запись' : 'Редактирование'}</span></li></ol></nav>
    <h1>{mode === 'create' ? 'Новая запись BookNest' : 'Редактирование записи'}</h1>
    <p className="form-note">Сохранение выполняет локальный учебный mock API. Open Library остаётся источником поиска и чтения.</p>
    <form className="book-record-form" noValidate onSubmit={event => { void handleSubmit(submit)(event); }}>
      <BookFormFields register={register} errors={errors} />
      {errors.root?.server?.message && <p className="form-error" role="alert">{errors.root.server.message}</p>}
      <div className="form-actions">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохраняем…' : mode === 'create' ? 'Создать запись' : 'Сохранить изменения'}</Button>
        <Link className="book-card__button form-cancel" to={id ? bookPath(id) : '/books'}>Отмена</Link>
      </div>
    </form>
  </main>;
}
