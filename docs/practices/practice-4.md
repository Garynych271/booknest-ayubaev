# Практика 4. JavaScript, DOM, события и состояние

## Тема и цель

Отделение преобразования данных от DOM-отрисовки, единое состояние интерфейса и делегирование событий. Исторический снимок ЛР3: `lab-3/js-app` (`51b8886`); локальные данные и основная логика добавлены коммитами `169a459`, `97fe2d1`, `375bbf0`.

## Обязательные требования

| Требование методички | Статус | Проверяемое доказательство |
| --- | --- | --- |
| `data/books.js`: 40 книг, пять жанров | Подтверждено | `git show lab-3/js-app:data/books.js`; тест `dataset has 40 unique books in five genres` в [`lab3/unit-tests.txt`](../lab3/unit-tests.txt). |
| Чистая `selectBooks(books, criteria)` и три проверки | Подтверждено | `git show lab-3/js-app:lib/books.js`; три браузерных примера и unit-тесты поиска/комбинаций/иммутабельности в [`lab3/browser-results.json`](../lab3/browser-results.json) и `unit-tests.txt`. |
| Независимая `renderBooks`, которая не знает о фильтрах | Подтверждено после исправления в текущей ветке | В историческом снимке карточки были частью общей `render()`. В [`ui/render.js`](../../ui/render.js) выделена экспортируемая `renderBooks(container, books, template, wishlist)`; CDP-аудит подтвердил экспорт и рендер одной карточки Solaris. |
| Один объект `state` и ровно одна функция `render()` | Подтверждено | `git show lab-3/js-app:main.js` и `ui/render.js`; изменения вызывают `update()`, который вызывает единственную `render()`. |
| Поиск по названию/автору, жанр и сортировка через одно событие формы | Подтверждено | Исторический `main.js`; сценарии `case-insensitive title and author`, `all five genres`, `all sort modes` в `browser-results.json`. |
| Wishlist через делегирование событий | Подтверждено | Исторический обработчик `view.main.addEventListener('click', ...)`; реальная остановка CDP и вложенная цель — [`practice-4-debugger.json`](evidence/practice-4-debugger.json), результат — [`practice-4-delegation.png`](evidence/practice-4-delegation.png). |
| Счётчик и пустое состояние | Подтверждено | Сценарии initial 40 и safe empty state в `browser-results.json`; снимок [`lab3/screenshots/empty.png`](../lab3/screenshots/empty.png). |
| Wishlist в `localStorage`, восстановление и некорректные данные | Подтверждено | `git show lab-3/js-app:storage.js`; unit-тесты round trip, invalid JSON, blocked/quota storage — 9/9 исторических тестов. |
| Breakpoint, Scope и объяснение `event.target` | Подтверждено реальным CDP-аудитом | Edge 155 остановился на `main.js:44`; в JSON сохранены local/module/global scopes и вычисленные значения `event.target`, `event.currentTarget` и найденной кнопки. |
| 3+ модуля, отсутствие мутаций, чистая консоль и ESLint | Подтверждено | `data`, `lib`, `ui`, `storage.js`, `main.js`; frozen-input tests; `lab3/check-results.json` — ESLint exit 0; browser audit — 0 ошибок консоли. После текущего рефакторинга повторно: ESLint exit 0, 17/17 тестов. |

## Самостоятельная часть

Подтверждена: чекбокс «только доступные» участвует в пересечении фильтров, reset возвращает `defaultFilters()` и UI к начальному состоянию, не удаляя wishlist. Сценарии находятся в `lab3/browser-results.json`.

## Дополнительные изменения

- Выделена отсутствовавшая функция `renderBooks`; фильтры в неё не передаются и не импортируются.
- Добавлен воспроизводимый [`tools/practice4-debugger.mjs`](../../tools/practice4-debugger.mjs). Он проверяет именно экспортированный снимок `lab-3/js-app`, а затем текущий `renderBooks`.
- Временный snapshot создаётся в игнорируемой `.audit-tools/`; прошлые ветки и коммиты не изменяются.

## Реальные результаты

- Исторические тесты: 9/9; ESLint exit 0; browser scenarios — без page/console errors.
- Текущая ветка после refactor: 17/17 Node tests, ESLint 0 замечаний.
- CDP: `paused: true`; target `SPAN`; currentTarget `MAIN`; action `toggle`; id `b01`; `aria-pressed: true`; wishlist count 1.

## Что показать вручную

Открыть `Sources`, поставить breakpoint на строке после `closest()`, нажать на текст внутри кнопки и показать Local Scope. Автоматизированное доказательство уже сохранено, но преподаватель может потребовать живую демонстрацию.

## Краткие ответы для защиты

- `event.target` — самый глубокий узел, на котором возникло событие; `currentTarget` — контейнер, чей обработчик сейчас выполняется.
- Делегирование использует bubbling и один обработчик контейнера, поэтому работает для карточек, созданных позднее.
- `closest('[data-action]')` нормализует клик по вложенному тексту или значку до управляющей кнопки.
- `selectBooks` чистая: не меняет исходный массив, а `filter` и `sort` применяются к новому массиву.
- Повреждённый JSON перехватывается, проверяется схема и возвращается безопасное начальное состояние.

Challenge task с подсветкой совпадений не выполнялся: он необязателен.
