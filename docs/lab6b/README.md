# ЛР6B: маршрутизация и формы с валидацией

Проверено 17.10.2026 в ветке `lab-6b/router-forms`, созданной от `lab-6a/hooks` (`63053b8`). Реализована только часть B ЛР6; backend и ЛР7 не начинались.

## Реализация

- `BrowserRouter`, nested routes, общий `AppLayout` с `Outlet`, `NavLink` с активным состоянием и полноценная 404-страница.
- Маршруты `/books`, `/books/:bookId`, `/books/new`, `/books/:bookId/edit`, `/wishlist`, `/login` и `*`; `/loan` сохранён для функционального паритета.
- `q`, `genre`, `available`, `sort` и `page` читаются из `URLSearchParams`; прямой URL, Back/Forward и перезагрузка восстанавливают состояние.
- `/wishlist` обёрнут в `RequireAuth`. Локальная заглушка входа возвращает пользователя на исходный маршрут; реальной авторизации нет.
- Одна форма `BookForm` работает в create/edit режимах. Восемь полей описаны одной Zod-схемой, тип получен через `z.infer`.
- Межполевая проверка требует, чтобы срок возврата был позже даты выдачи. Ошибки связаны с полями через `aria-invalid` и `aria-describedby`.
- Учебный `api/bookRecords.ts` отображает mock 422 на `title`, 409 на `isbn`, 500 как общую ошибку, блокирует submit и поддерживает AbortSignal.
- После create выполняется переход на `/books/BN-*`; edit предзаполняется и сохраняет стабильный ID. Поиск и чтение внешних книг продолжают использовать настоящий Open Library.

Архитектура и границы слоёв описаны в [architecture.md](architecture.md). Контексты по-прежнему содержат только тему и локального пользователя; каталог, wishlist и состояния страниц через Context не передаются.

## Проверки

Среда: Node.js 22.14.0, Edge 155.0.4283.45, Vite 8.3.4, TypeScript 6.0.2, Lighthouse 12.8.2.

| Проверка | Фактический результат |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, предупреждений нет |
| `npm test` | 6 файлов, 24/24 теста |
| `npm run build` | exit 0, 168 модулей; JS 418.80 kB / gzip 131.96 kB |
| `node tools/lab6b-checks.mjs` | 11/11 архитектурных проверок |
| Edge browser scenarios | 8/8 |
| Light/dark × 375/1440 px | 4/4, горизонтальный overflow 0 |
| Lighthouse Accessibility | mobile light 100/100, desktop dark 100/100 |

Модульные тесты проверяют схему и cross-field правило, доступную маркировку ошибок, create/read/edit, 422/409/500, AbortSignal, нормализацию prefill Open Library, auth guard и двустороннее преобразование URL-параметров.

## Браузерные доказательства

`tools/lab6b-browser.mjs` выполнен в настоящем Edge:

- прямой URL со всеми фильтрами и страницей, активный `NavLink` и Back/Forward;
- реальный поиск Open Library: 19 карточек для измеренного ответа; детали `OL109524W` загрузили `Solaris`;
- все зафиксированные ответы Open Library имели HTTP 200; URL и статусы находятся в [browser-results.json](browser-results.json);
- внешний edit-маршрут получил prefill; некорректный ID показал HTTP 404;
- wishlist сохранился после перехода и reload;
- клиентские и cross-field ошибки, mock 422/409/500, disabled submit, create redirect и edit одной локальной записи;
- guest redirect `/wishlist → /login`, возврат после входа и неизвестный маршрут 404;
- Offline показал сетевую ошибку, после восстановления сети Retry вернул success;
- 0 `pageerror` и 0 неожиданных console errors.

Сохранены 10 настоящих PNG в `screenshots/`. Mock-статусы относятся только к локальному учебному CRUD adapter и не выдаются за ответы Open Library.

Lighthouse JSON/HTML и [summary.json](accessibility/summary.json) находятся в `accessibility/`. На форме распознаны восемь controls, обе проверки дали 100/100 и overflow 0. Снимки были дополнительно просмотрены визуально: наложений и обрезанного текста не обнаружено.

## Воспроизведение

```powershell
cd booknest-web
npm ci
npm run typecheck
npm run lint
npm test
npm run build
cd ..
node tools/lab6b-checks.mjs
node tools/lab6b-browser.mjs
node tools/lab6b-accessibility.mjs
```

Playwright, Puppeteer и Lighthouse находятся только в игнорируемой `.audit-tools` и не добавлены в runtime-зависимости приложения.

## Ограничения

- Open Library и обложки зависят от сети и текущих данных внешнего сервиса.
- `api/bookRecords.ts` — локальный mock CRUD, не настоящий сервер. Записи доступны только в `localStorage` текущего origin.
- AuthContext — локальная заглушка без пароля, JWT и backend; реальная авторизация относится к ЛР9.
- Проверка преподавателем и устная защита не выполнены. Push, PR, merge и rebase не выполнялись.
