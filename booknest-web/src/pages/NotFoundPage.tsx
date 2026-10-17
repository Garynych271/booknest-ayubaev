import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="main not-found" data-route="not-found">
    <p className="badge">Ошибка 404</p>
    <h1>Страница не найдена</h1>
    <p>Такого адреса нет в BookNest.</p>
    <p><Link to="/books">Вернуться в каталог</Link></p>
  </main>;
}
