# План реализации BookNest по syllabus WEB 3210

Источник требований: `../web-technologies-syllabus.html`, разделы 09-15 и связанные фрагменты разделов 01, 04, 07, 11, 17-19.

## Границы проекта

- BookNest — единый накопительный учебный проект для лабораторных работ 1-12.
- Итоговый Full-Stack проект из раздела 13 выполняется на другой предметной области; его нельзя подменять BookNest.
- В этом сеансе реализуются только практика 1 и лабораторная 1.
- Лабораторные 2-6 ниже описаны как план и требования, но не реализуются в этом сеансе.
- Дополнительные задания отмечены отдельно и не входят в обязательный минимум.
- Отчеты о замерах, скриншоты Lighthouse/DevTools/валидаторов и сетевые измерения должны быть настоящими; если действие требует ручного браузера, создается шаблон и инструкция, а не выдуманные результаты.

## Общие правила сдачи и Git

- Формат сдачи лабораторных: Pull Request из ветки `lab-N/<тема>` в `main`.
- Описание PR: что сделано, как проверить, скриншоты, самопроверка по критериям.
- Каждая лабораторная требует работу в отдельной ветке; универсальная рубрика ожидает 5+ атомарных коммитов с осмысленными сообщениями.
- Практические занятия завершаются артефактом, который коммитится в репозиторий.
- СРС и weekly homework сдаются PR до начала следующей лекции.
- Использование AI разрешено только с декларированием в `AI_USAGE.md`; студент обязан объяснить любую строку кода.
- Запрещено генерировать отчеты о собственных измерениях: логи, планы запросов и скриншоты должны быть настоящими.

## СРС, связанная с работами 1-8 и лабораторными 1-6

Общий объем: 75 часов, 5 часов в неделю.

| Вид СРС | Объем | Контроль |
| --- | ---: | --- |
| Чтение официальной документации | 0,7 ч/нед., 10 ч всего | Входной вопрос на практике, вопросы квиза |
| Weekly homework | 1,2 ч/нед., 18 ч всего | PR до следующей лекции, зачёт/незачёт |
| Coding exercises | 0,6 ч/нед., 9 ч всего | Зеленые CI-тесты в отдельных drills-репозиториях |
| Доработка лабораторных | 1,8 ч/нед., 27 ч всего | Приемка лабораторной |
| Подготовка к лабораторной | 0,3 ч/нед., 4 ч всего | Готовность окружения на входе |
| Итоговый проект | около 7 ч, недели 9-15 | Не BookNest, отдельная предметная область |

Связанные задания:

- W1-2 reading: MDN HTTP overview, Structuring content.
- W3 reading: MDN CSS layout, Flexbox, Grid, Responsive design.
- W4-5 reading: MDN Asynchronous JavaScript, Fetch API.
- W6-8 reading: react.dev Describing the UI, Adding Interactivity, You Might Not Need an Effect.
- W5 mini-project: "API-исследователь", отдельное одностраничное JS-приложение к публичному API, вне BookNest, 3 часа.
- W8 mini-project: "Компонентная библиотека", 6 переиспользуемых типизированных компонентов, вне BookNest, 4 часа.

## Практические занятия 1-8: требования

### Практика 1. W1 HTTP lifecycle и рабочее окружение

Обязательно:

- Проверить окружение: `git --version`, `node -v`, `python --version`.
- Настроить `user.name`, `user.email`, SSH-ключ для GitHub.
- Принять GitHub Classroom, клонировать личный `booknest-<фамилия>`.
- Открыть учебную страницу с DevTools -> Network.
- Записать число запросов, объем, время загрузки, тип каждого ресурса.
- Найти запрос документа, выписать 5 request headers и 5 response headers с объяснением назначения.
- Повторить запрос через `curl -i`, сравнить с браузером.
- Проверить Slow 4G и Offline, зафиксировать разницу в поведении и waterfall.
- Создать ветку `feature/week1-report`, добавить `docs/week1-report.md`.
- Коммит по шаблону `docs: add HTTP lifecycle report`, PR из ветки.
- Самостоятельная часть: выбрать любой сайт вне списка преподавателя, таблица из 10 запросов (метод, путь, код, тип, размер), определить архитектуру (статика/SPA/SSR) по трем наблюдаемым признакам.

Дополнительно:

- Найти сайт, который отвечает по-разному на одинаковый URL в зависимости от `Accept` или `Accept-Language`, подтвердить двумя `curl`.

Критерии:

- Открытый PR с отчетом.
- Окружение работает по трем командам.
- PR открыт из ветки, не из `main`.
- В отчете объяснены не менее 8 заголовков.
- Вывод об архитектуре основан на наблюдениях.

### Практика 2. W2 семантическая разметка и аудит доступности

Обязательно:

- Получить PNG-макет "Карточка книги", нарисовать дерево документа до кода.
- Разметить `header`, `nav`, `main`, `article`, `aside`, `footer`, определить единственный `h1`.
- Добавить обложку с корректным `alt`, описание, `dl` характеристик, отзывы как `article` внутри списка.
- Добавить форму "Оставить отзыв": radio в `fieldset`/`legend`, `textarea` с ограничением, submit.
- Проверить W3C Validator и устранить ошибки/предупреждения.
- Пройти страницу клавишей Tab и исправить недостижимые элементы.
- Lighthouse Accessibility >= 90 со скриншотом.
- Самостоятельная часть: "Похожие книги" как список статей, хлебные крошки с `aria-current`.

Дополнительно:

- Найти на публичном сайте 3 нарушения доступности, приложить скриншоты и предложить исправления кодом.

Критерии:

- `book.html` в репозитории.
- 0 ошибок валидатора.
- Ровно один `h1`, корректная иерархия.
- Все поля формы с `label` и `name`.
- Все controls доступны с клавиатуры.
- Lighthouse Accessibility >= 90.
- Нет `div`, где применим семантический элемент.

### Практика 3. W3 адаптивная сетка и отладка

Обязательно:

- Создать `styles/tokens.css` с 12+ переменными.
- Шапка на Flexbox: логотип слева, навигация справа, центрирование, перенос.
- Сетка карточек на Grid `repeat(auto-fit, minmax(260px, 1fr))`.
- Макет: сайдбар фильтров + основная область; мобильная одна колонка, от 900 px две колонки одной media query.
- Прижать футер к низу при коротком содержимом.
- Темная тема через `@media (prefers-color-scheme: dark)`.
- Исправить 5 дефектов из `broken.css`, объяснив причины: специфичность, порядок, `box-sizing`, схлопывание `margin`, отсутствующий viewport.
- Самостоятельная часть: карточка книги с одинаковой высотой в ряду и кнопкой внизу при любой длине названия.

Дополнительно:

- Реализовать адаптивный каталог без media query через `auto-fit`, `minmax`, `clamp()`, `flex-wrap`; сравнить подходы.

Критерии:

- Стилизованная страница и `docs/css-debug.md`.
- Нет горизонтальной прокрутки на 375 px.
- Работают две темы.
- Нет `!important` и ID-селекторов.
- Все цвета и отступы из токенов.
- Все 5 дефектов объяснены верно.

### Практика 4. W4 DOM, события, состояние

Обязательно:

- `lib/books.js` с чистой `selectBooks(books, criteria)`, 3 проверки в консоли.
- `ui/render.js` с `renderBooks(container, books)`, без знания о фильтрах.
- Объект `state` и единственная `render()`.
- Поиск, жанр и сортировка через одно событие формы.
- "Хочу прочитать" через делегирование на контейнере.
- Счетчик найденного и пустое состояние.
- `localStorage` для wishlist с восстановлением.
- Точка останова в обработчике, объяснение `event.target`.
- Самостоятельная часть: фильтр "только доступные" и полный сброс фильтров.

Дополнительно:

- Подсветка совпадений без `innerHTML` для пользовательского ввода; объяснить предотвращаемую уязвимость.

Критерии:

- Работающее приложение в 3+ модулях.
- Функции не мутируют входные данные.
- Ровно одна `render()`.
- Делегирование для кнопок.
- Консоль без ошибок.
- ESLint без замечаний.
- `localStorage` читается с обработкой некорректного содержимого.

### Практика 5. W5 публичный REST API и четыре состояния

Обязательно:

- В Thunder Client выполнить 3 запроса к Open Library: поиск, книга по ключу, несуществующий путь; сохранить коллекцию, записать коды.
- `api/client.js`: base URL, `URLSearchParams`, проверка `response.ok`, `ApiError.status`.
- Заменить локальные данные каталога на ответ API.
- Четыре взаимоисключающих состояния: `loading`, `success`, `empty`, `error`.
- Debounce 350 мс и подтверждение сокращения запросов по Network.
- `AbortController`, отмена предыдущего запроса, подтверждение `canceled` в Network.
- Проверить Slow 4G и Offline; различить "нет сети" и "сервер вернул ошибку".
- Кнопка "Повторить".
- Самостоятельная часть: пагинация по 20 с блокировкой границ и сохранением номера страницы при повторном поиске.

Дополнительно:

- Один retry при 5xx с задержкой 1 с и максимумом в одну попытку; демонстрация на сбойном endpoint.

Критерии:

- Каталог на реальных данных.
- Есть `response.ok`.
- Spinner всегда снимается.
- Ошибки сети и HTTP-коды различаются.
- В Network видна отмена устаревших запросов.
- Коллекция запросов в репозитории.

### Практика 6. W6 декомпозиция React

Обязательно:

- Создать `npm create vite@latest booknest-web -- --template react-ts`, разобрать структуру.
- На бумаге разбить макет каталога на компоненты и владельцев состояния.
- `types.ts`: `Book`, `Author`, `Genre`, где жанр — union-type.
- `<BookCard>` с typed props, без собственного состояния.
- `<BookList>` через `map` и стабильный `key`.
- `<FiltersPanel>`, состояние фильтров в `App`.
- Wishlist с иммутабельным обновлением массива.
- React DevTools: найти компонент, изменить props, посмотреть подсветку rerender.
- Самостоятельная часть: `<Badge variant="ok" | "busy" | "warn">` минимум в двух местах.

Дополнительно:

- `<Modal>` с `children`, закрытием по Escape и клику вне области, возвратом фокуса.

Критерии:

- React-проект с 5+ компонентами.
- Все props типизированы.
- Нет мутации состояния.
- `key` — не индекс.
- Нет обращений к `document` из компонентов.
- TypeScript build без ошибок.
- Обосновано место хранения состояния.

### Практика 7. W7 refactoring: hook и API layer

Обязательно:

- Перенести `api/client.ts` из практики 5, добавить typed `api/books.ts`.
- Сделать намеренный `useEffect` без dependency array, увидеть бесконечные запросы, объяснить причину.
- Исправить dependencies, включить `exhaustive-deps`.
- Вынести загрузку в `useFetch<T>` с `data`, `isLoading`, `error`.
- Построить `useBooks(query, genre)` поверх `useFetch`.
- Добавить abort в cleanup и проверить устранение гонки.
- `ThemeContext` с provider и `useTheme`, переключатель в header.
- React Profiler: записать взаимодействие и найти лишние rerenders.
- Самостоятельная часть: `useDebounce<T>(value, delay)` и подтверждение сокращения запросов по Network.

Дополнительно:

- `usePaginatedBooks` с "Показать еще", накоплением страниц, концом списка и сбросом при смене фильтра.

Критерии:

- Ни один компонент не вызывает `fetch`.
- `react-hooks` lint без предупреждений.
- Все эффекты с подписками/запросами имеют cleanup.
- В PR два скриншота Network до/после debounce.
- Context только для темы.

### Практика 8. W8 форма с Zod и серверными ошибками

Обязательно:

- Маршруты `/books`, `/books/:bookId`, `/books/new`, `*` с layout через `Outlet`.
- Zod schema для формы выдачи: required, lengths, e-mail, positive number, two dates.
- `refine`: due date strictly later than issued date, ошибка на `dueDate`.
- Type values через `z.infer`, не вручную.
- `useForm` с `zodResolver`, `mode: "onBlur"`.
- Error messages связаны с полями через `aria-describedby` и `role="alert"`.
- Submit button disabled while sending, text "Сохраняем...".
- 422 от mock endpoint раскладывается по `detail`; 409 показывается на поле выбора книги.
- После успеха переход на созданную запись через `useNavigate`.
- Filters moved to `useSearchParams`; filtered URL opens same state in new tab.
- Самостоятельная часть: один компонент формы для create/edit по наличию `:bookId`, prefill и корректный heading.

Дополнительно:

- Защита от потери данных через `isDirty` и блокировку навигации; `window.confirm` не единственное средство.

Критерии:

- Невалидные данные не отправляются.
- 422 отображается на конкретных полях.
- Button protected from double submit.
- Каждое error message связано с полем и доступно screen reader.
- Filters persist in URL.
- 404 route works.
- Direct `/books/42` opens needed page.

## Лабораторные 1-6: требования и план реализации

### Лабораторная 1. W2 Семантический интерфейс BookNest, 5 баллов

Обязательно:

- Три HTML-страницы без CSS: `index.html`, `book.html`, `loan.html`.
- `index.html`: шапка с навигацией, heading, форма фильтров (поиск, жанр, сортировка, checkbox "только доступные"), 6 карточек-статей, footer.
- `book.html`: обложка с содержательным `alt`, `dl` характеристик, описание, блок отзывов, форма нового отзыва, "Похожие книги", breadcrumbs.
- `loan.html`: форма выдачи с минимум 6 полями разных типов, сгруппированных в `fieldset`/`legend`, включая `date`, `number`, `email`, `select`, `textarea`.
- Все три страницы связаны навигацией; ссылки работают.
- Ровно один `h1` на страницу, no skipped heading levels.
- Обязательные elements: `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, `figure`, `time`, `dl`.
- Все form fields имеют `label` через `for`/`id` и `name`.
- Native validation: `required`, `min`, `maxlength`, `pattern`.
- `lang="ru"`, charset, viewport, `title` для каждой страницы.
- Images have `width`/`height`.
- 0 W3C Markup Validator errors.
- Lighthouse Accessibility >= 90.
- No inline styles and no presentational attributes.
- No `div` where a semantic element applies.
- Git: branch `lab-1/markup`, 5+ meaningful commits, PR.
- Docs evidence: `docs/lab1/` with validation/Lighthouse proof when collected manually.

Дополнительно:

- schema.org/Book microdata in book card, checked by structured data validator.
- Fourth screen "Профиль читателя" with loan history table.
- `<picture>` with `srcset` for cover at three screen densities.

Критерии:

- 5: all requirements, clean validator, Accessibility >= 95, justified element choices.
- 4: 1-2 minor semantic deviations, Accessibility >= 90.
- 3: pages valid, but semantics formal; `div` wrappers instead of semantic elements.
- 0-2: validator errors, fields without labels, no PR, or work in `main`.

Implementation tasks:

- Branch: `lab-1/markup` from current `main`.
- Files: `index.html`, `book.html`, `loan.html`, `README.md`, `AI_USAGE.md`, `docs/lab1/README.md`, `docs/pr/lab1.md`.
- Commits:
  - `chore: add project documentation baseline`
  - `feat: add catalog semantic markup`
  - `feat: add book detail semantic markup`
  - `feat: add loan form semantic markup`
  - `docs: add lab 1 evidence checklist`
- Checks:
  - Static inspection for required elements.
  - Browser manual check of links and native form blocking.
  - W3C and Lighthouse require manual browser/web tooling; record real results in `docs/lab1/README.md`.

### Лабораторная 2. W3 CSS adaptive layout and tokens, 6 баллов

Обновление 17.10.2026: реализация и реальные аудиты находятся в `lab-2/styles`, созданной от `lab-1/markup` (`c56b695`). Результаты, ограничения сети и незакрытые пункты описаны в [docs/lab2/README.md](lab2/README.md). Исходные ограничения «этого сеанса» в начале плана относятся к первому сеансу ЛР1. Приёмка и объединение PR ЛР1 остаются внешней зависимостью; `main` не изменялся.

Обязательно:

- Style the three Lab 1 pages mobile-first without changing HTML structure except adding classes.
- Control widths: 375 px, 768 px, 1440 px.
- Header Flexbox, catalog Grid, equal card heights, button at bottom.
- Sticky footer for short content.
- Dark theme via `prefers-color-scheme`.
- Visible focus for all interactive elements and `prefers-reduced-motion`.
- `styles/tokens.css` with 14+ variables: palette, spacing, radii, typography, shadows.
- Style structure: `tokens.css`, `base.css`, `layout.css`, `components.css`.
- BEM-like names, selector nesting <= 2.
- Forbidden: `!important`, ID selectors, fixed container width, sibling spacing via margin instead of `gap`.
- Max 3 media queries in project.
- No horizontal scroll at 320 px.
- Screenshots: 3 widths * 2 themes in `docs/lab2/`.
- Lighthouse Performance and Accessibility report.

Дополнительно:

- Manual theme switch persisted by minimal JS.
- CSS-only skeleton loaders.
- Print version via `@media print`.
- No-media-query catalog and comparison report.

Artifacts/files:

- `styles/tokens.css`, `styles/base.css`, `styles/layout.css`, `styles/components.css`, HTML classes, `docs/lab2/`.
- Branch `lab-2/styles`, PR.
- Depends on accepted Lab 1.

### Лабораторная 3. W4 JavaScript catalog app, 8 баллов

Обязательно:

- Local data: 40 books, 5 genres, fields `id`, `title`, `author`, `year`, `genre`, `rating`, `available`.
- Search title/author, case-insensitive, instant.
- Genre filter and "only available" checkbox.
- Sort by title A-Z, year newest first, rating.
- Count found records and empty state.
- Wishlist button with visual state and `aria-pressed`.
- "My list" counter in header and remove option.
- Reset all filters.
- Persist wishlist and active filters to `localStorage`.
- ESM modules at least `data/books.js`, `lib/books.js`, `ui/render.js`, `main.js`.
- One `state`, one `render()`.
- `lib/` must not mutate args or touch DOM.
- Card clicks only via delegation.
- User input rendered through `textContent`; `innerHTML` with user data forbidden.
- `localStorage` read protected by `try/catch`.
- ESLint clean, console clean.

Дополнительно:

- Highlight matches without `innerHTML`.
- Export/import wishlist JSON.
- Sync filters with `location.hash`.
- Virtualization for 5000 books with performance measurement.

Artifacts/files:

- `data/books.js`, `lib/books.js`, `ui/render.js`, `main.js`, updated pages, `docs/lab3/`.
- Branch `lab-3/js-app`, PR.
- Depends on accepted Lab 2.

### Лабораторная 4. W5 external REST API, 8 баллов

Обязательно:

- Replace local catalog data with Open Library API.
- Search with debounce 300-400 ms and minimum query length.
- Four mutually exclusive states: `loading`, `success`, `empty`, `error`.
- Different messages for network failure, 4xx, 5xx; retry button.
- Pagination 20 records, disabled boundary buttons.
- Abort stale requests, confirmed as `canceled` in Network.
- Book detail page via separate request by ID and 404 handling.
- Wishlist stays local in `localStorage`.
- `api/client.js`: single base URL, `URLSearchParams`, `response.ok`, `ApiError.status`.
- Only `async/await` with `try/catch/finally`; loading cleared in `finally`.
- `AbortController`; `AbortError` is not UI error.
- Independent requests via `Promise.all`.
- No direct `fetch` outside API layer.
- Request collection in `docs/lab4/api-collection.json`.
- Screenshots for normal, Slow 4G, Offline, wrong URL.

Дополнительно:

- Single retry for 5xx.
- 60-second `Map` cache.
- "Load more" instead of pages.
- Enrich data with parallel request via `Promise.allSettled`.

Artifacts/files:

- `api/client.js`, `api/books.js`, UI state changes, `docs/lab4/`.
- Branch `lab-4/api`, PR.
- Depends on accepted Lab 3.

### Лабораторная 5. W6 React + Vite + TypeScript, 8 баллов

Обязательно:

- Move Lab 3-4 catalog to React + Vite + TypeScript preserving all functionality and styles.
- Functional parity: search, filters, sort, pagination, wishlist, loading states.
- 8+ components, at least 5 presentational.
- Reusable `Button`, `Badge`, `Spinner`, `EmptyState`, `ErrorBox`; each used twice.
- Wishlist persists in `localStorage`.
- Vite `react-ts`; `npm run build` passes.
- Props typed via `interface`; enumerable values as union types.
- Forbidden: unexplained `any`, state mutation, `key={index}`, `document` access from components.
- Derived data computed during render, not stored in state.
- Structure: `components/`, `lib/`, `api/`, `types.ts`.
- Component file <= 150 lines.
- ESLint with `react-hooks` and `@typescript-eslint` clean.
- `docs/lab5/components.md` component tree with state ownership before coding.
- PR screenshot of React DevTools tree.

Дополнительно:

- `<Modal>` with `children`, Escape close, focus return.
- Typed generic `<DataTable<T>>`.
- Theme switch in React with persisted choice.
- Strict `tsconfig` including `noUncheckedIndexedAccess`.

Artifacts/files:

- `booknest-web/` or equivalent frontend app, `docs/lab5/`.
- Branch `lab-5/react`, PR.
- Depends on accepted Lab 4.

### Лабораторная 6. W7-W8 Router, hooks, forms, 9 баллов

Обязательно:

- Part A W7: own hooks and API layer, Context for theme/current user.
- Part B W8: routing, detail/form pages, schema validation, server error display.
- Routes: `/books`, `/books/:bookId`, `/books/new`, `/books/:bookId/edit`, `/wishlist`, `/login`, `*`.
- Common layout via nested routes; active nav indication.
- Filters/search/page stored in URL.
- One create/edit form component, prefilled in edit mode.
- Validate 6+ fields including one cross-field rule.
- Server errors: 422 to fields, 409 to relevant field, others as general form error.
- Submit disabled while sending; success navigates to created record.
- Protected route stub: `/wishlist` only for "logged-in" placeholder.
- No component calls `fetch`; only `api/` and hooks.
- At least two hooks, e.g. `useFetch`/`useBooks`, `useDebounce`.
- Request/subscription effects have cleanup; `exhaustive-deps` clean.
- Context only for theme and current user; no page data through Context.
- Forms use `react-hook-form` + `zod`; `z.infer`; single source of validation rules.
- Errors connected through `aria-describedby`, `aria-invalid`, `role="alert"`.
- Layered structure `app/pages/features/shared/api`.

Дополнительно:

- Unsaved changes protection.
- Optimistic wishlist update with rollback.
- Lazy form route with `lazy` + `Suspense` and bundle-size comparison.
- `usePaginatedBooks` with accumulated loading.

Artifacts/files:

- React routing/hooks/forms code, `docs/lab6/`.
- Branches `lab-6a/hooks`, `lab-6b/router-forms`, PR for each part.
- Depends on accepted Lab 5.

## Pull Request templates

### Practice 1 PR description

```md
## Что сделано
- [ ] Проверено окружение
- [ ] Подготовлен отчет `docs/week1-report.md`
- [ ] Заполнены реальные DevTools/curl данные

## Как проверить
1. Открыть `docs/week1-report.md`.
2. Проверить, что таблицы содержат реальные значения.
3. Выполнить команды из раздела "Окружение".

## Самопроверка
- [ ] PR из `feature/week1-report`, не из `main`
- [ ] Объяснены 8+ HTTP headers
- [ ] Есть 10 запросов выбранного сайта
- [ ] Архитектура обоснована наблюдениями
```

### Lab 1 PR description

```md
## Что сделано
- [ ] `index.html` catalog
- [ ] `book.html` book detail
- [ ] `loan.html` loan form
- [ ] README and AI_USAGE
- [ ] Evidence checklist in `docs/lab1/`

## Как проверить
1. Открыть `index.html`, перейти по навигации на `book.html` и `loan.html`.
2. Проверить нативную валидацию форм.
3. Прогнать W3C Validator и Lighthouse Accessibility, записать реальные результаты.

## Самопроверка
- [ ] Один `h1` на страницу
- [ ] Required semantic elements present
- [ ] All form controls have labels and names
- [ ] No inline styles/CSS
- [ ] Images have alt, width, height
- [ ] 5+ meaningful commits in branch
```

## Текущая стратегия веток и коммитов

Поскольку локальный репозиторий пустой и `main` еще не имеет коммитов:

1. `main`: базовый коммит с этим планом.
2. `feature/week1-report`: практика 1, отчет-шаблон и доступные проверки окружения.
3. `lab-1/markup`: лабораторная 1 от актуального `main`, минимум 5 атомарных коммитов.

Планируемые коммиты текущего сеанса:

- `docs: add course implementation plan`
- Practice 1:
  - `docs: add week 1 report template`
  - `docs: record local environment checks`
- Lab 1:
  - `docs: add project readme and ai usage`
  - `feat: add catalog markup`
  - `feat: add book detail markup`
  - `feat: add loan form markup`
  - `docs: add lab 1 verification notes`

## Проверки текущего сеанса

Доступно локально:

- `git status --short --branch`
- `git log --oneline --decorate`
- Проверка наличия обязательных HTML-элементов через поиск.
- Проверка ссылок между локальными HTML-файлами вручную по коду.
- Проверка отсутствия CSS/React/JS в Lab 1.

Требует ручного браузера или внешнего сервиса:

- DevTools Network числа/объем/время/waterfall для практики 1.
- W3C Markup Validator.
- Lighthouse Accessibility.
- Скриншоты DevTools/Lighthouse/Validator.
- GitHub push and PR creation.

