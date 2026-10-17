# BookNest

Накопительный учебный проект курса «Современные веб-технологии». Текущий этап — часть A ЛР6: типизированные React-хуки, изолированный слой данных и Context для темы и локального пользователя.

## Запуск

```powershell
cd booknest-web
npm ci
npm run dev
```

Vite выведет локальный URL. Для production-проверки: `npm run build`, затем `npm run preview`.

## Возможности

- Поиск по названию и автору с debounce 350 мс, фильтры по жанру и доступности, три сортировки и сброс.
- Пагинация Open Library по 20 записей, счётчик результатов и блокировка кнопок на границах.
- Взаимоисключающие состояния loading, success, empty и error; Retry и отдельные сообщения network, 4xx, 5xx и timeout.
- Отмена устаревших запросов через `AbortController` и cleanup общего `useFetch<T>`; отдельная загрузка страницы книги и обработка 404.
- Wishlist и параметры каталога в `localStorage`, включая миграцию данных ЛР3/ЛР4.
- Каталог, детали и учебная форма выдачи доступны обычными URL-параметрами без React Router.
- Адаптивность 375 / 768 / 1440 px, сохраняемый переключатель светлой/тёмной темы, клавиатурная навигация.

## Архитектура

- `booknest-web/src/App.tsx` владеет фильтрами, страницей и wishlist.
- `booknest-web/src/components/` содержит 16 компонентов; вместе с `App` — 17, из них 12 презентационных.
- `booknest-web/src/api/` изолирует `fetch`, нормализацию ответов и типизированные ошибки.
- `booknest-web/src/hooks/` содержит `useFetch<T>`, `useBooks`, `useBook` и `useDebounce<T>`; компоненты не знают про HTTP и AbortController.
- `booknest-web/src/contexts/` содержит только `ThemeContext` и `AuthContext` с локальной заглушкой читателя.
- `booknest-web/src/lib/` содержит работу с preferences, URL и проверку неизвестных данных.
- `booknest-web/src/types.ts` содержит предметные интерфейсы и union-типы.
- `booknest-web/src/styles/` сохраняет дизайн-токены, Grid/Flexbox и темы ЛР2–4.

React Router, Zod, `react-hook-form`, маршруты login/wishlist и защищённые страницы не добавлены: это часть B ЛР6.

## Проверки

```powershell
cd booknest-web
npm run typecheck
npm run lint
npm test
npm run build
```

Все четыре команды завершаются с кодом 0. Реальные браузерные проверки Edge, отчёты Lighthouse, скриншоты и ограничения описаны в [docs/lab6a/README.md](docs/lab6a/README.md). Архитектурная граница хуков и Context зафиксирована в [docs/lab6a/architecture.md](docs/lab6a/architecture.md).

## Ограничения

- Каталог и обложки зависят от доступности Open Library; аварийные ответы 429/503 и некорректный JSON воспроизводятся контролируемыми моками и явно помечены в отчёте.
- Доступность означает `ebook_access:public`, а не наличие физического экземпляра BookNest.
- Форма выдачи остаётся учебной и не отправляет данные на сервер.
- Локальный AuthContext не выполняет реальную авторизацию; она относится к ЛР9.
- ЛР1–5 опубликованы отдельными PR. Ветка `lab-6a/hooks` основана на `lab-5/react` (`282b962`); push и создание PR для ЛР6A не выполнялись.
