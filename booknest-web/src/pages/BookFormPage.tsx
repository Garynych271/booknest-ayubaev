import { useParams } from 'react-router-dom';

export interface BookFormPageProps { mode: 'create' | 'edit' }

export function BookFormPage({ mode }: BookFormPageProps) {
  const { bookId } = useParams();
  return <main className="main">
    <h1>{mode === 'create' ? 'Новая запись BookNest' : 'Редактирование записи'}</h1>
    <p data-form-placeholder>{mode === 'edit' ? `Загрузка данных ${bookId ?? ''}.` : 'Форма будет подключена к учебному mock API.'}</p>
  </main>;
}
