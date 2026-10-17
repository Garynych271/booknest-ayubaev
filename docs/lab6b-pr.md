# ЛР6B: маршрутизация и формы с валидацией BookNest

BookNest получил полноценные маршруты React Router, URL-состояние каталога, защищённый wishlist и единую типизированную create/edit форму на React Hook Form + Zod. Функциональность ЛР5 и хуки/Context ЛР6A сохранены.

## Что сделано

- Добавлены nested routes, общий layout с `Outlet`, активные `NavLink`, динамические параметры, login stub, `RequireAuth` и 404.
- Поиск, жанр, доступность, сортировка и страница синхронизированы с query string и работают с прямыми URL и историей браузера.
- Одна форма обслуживает create/edit, предзаполняется и валидирует 8 полей, включая правило дат.
- Ошибки локального mock adapter 422/409 привязаны к полям, 500 показана на уровне формы; submit блокируется, success перенаправляет на детали.
- Сохранены изолированный Open Library API, hooks, AbortController, Retry, wishlist, темы, адаптивность и доступность.
- Код организован по слоям `app/pages/features/shared/api`; Context не используется для данных страниц.

## Как проверить

```powershell
cd booknest-web
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Полные сценарии и воспроизводимые команды: `docs/lab6b/README.md`.

| Проверка | Результат |
| --- | --- |
| TypeScript | exit 0 |
| ESLint + React Hooks | exit 0, 0 предупреждений |
| Vitest | 24/24 |
| Vite build | exit 0 |
| Статические архитектурные проверки | 11/11 |
| Edge browser scenarios | 8/8, 0 page/console errors |
| Темы и ширины | 4/4, overflow 0 |
| Lighthouse Accessibility | 100/100 mobile light и desktop dark |

Сохранены 10 скриншотов, полный JSON браузерного аудита и два HTML/JSON Lighthouse-отчёта. Ответы настоящего Open Library и локальные mock 422/409/500 в документации разделены.

## Самопроверка

- [x] Все обязательные маршруты, nested layout и активная навигация.
- [x] URL хранит фильтры, поиск, сортировку и страницу.
- [x] Одна create/edit форма, `z.infer`, 8 полей и cross-field правило.
- [x] Field/general server errors, disabled submit и redirect после create.
- [x] `/wishlist` защищён локальной заглушкой пользователя.
- [x] В компонентах нет `fetch`; хуки и Context ЛР6A сохранены.
- [x] Реальные тесты, браузерные доказательства и accessibility-отчёты сохранены.
- [ ] Устная защита и приёмка преподавателем.

## Зависимость PR

Head: `lab-6b/router-forms`; base: `lab-6a/hooks` (`63053b8`). ЛР1–5 уже опубликованы отдельными зависимыми PR. Push, создание/объединение PR и rebase для этой ветки не выполнялись.
