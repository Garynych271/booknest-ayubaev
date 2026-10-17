# ЛР6A: хуки и слой данных

Проверено 17.10.2026 в ветке `lab-6a/hooks`, основанной на `lab-5/react` (`282b962`). Выполнена только часть A W7; часть B и ЛР7 не начинались.

## Архитектура

- `useFetch<T>(key, fetcher, enabled)` управляет `data`, `isLoading`, `error`, Retry и создаёт отдельный `AbortController` на эффект. Cleanup отменяет запрос при смене ключа, выключении или размонтировании.
- `useDebounce<T>(value, delay)` откладывает публикацию последнего значения и очищает таймер.
- `useBooks(filters, page)` применяет debounce 350 мс, немедленно отменяет прежний запрос во время нового ввода и вызывает типизированный `searchBooks`.
- `useBook(id)` загружает детали через тот же `useFetch`; компоненты не импортируют API-запросы и не создают AbortController.
- `ThemeContext` хранит `light | dark`, переключает и сохраняет тему в `localStorage`.
- `AuthContext` содержит только локального пользователя `{ id, displayName, role }`. Реальной авторизации нет.
- Фильтры, wishlist, ответы API и состояния страниц не передаются через Context.

Подробная схема зависимостей и владельцев состояния: [architecture.md](architecture.md).

## Соответствие части A

| Требование | Результат |
| --- | --- |
| Изолированный типизированный API-слой | Сохранены `api/client.ts` и `api/books.ts`; прямой `fetch` только в client |
| `useFetch<T>`, `useBooks`, `useDebounce<T>` | Реализованы; дополнительно введён `useBook` для деталей |
| Загрузка и сетевые состояния вне компонентов | Выполнено для каталога и деталей |
| AbortController и cleanup | Выполнено в `useFetch`; проверено unit и CDP |
| `react-hooks/exhaustive-deps` | ESLint: 0 ошибок и предупреждений |
| ThemeContext и AuthContext | Выполнено; Auth — локальная заглушка |
| Context без данных страниц | Подтверждено статической проверкой |
| Функциональность ЛР5 | Поиск, фильтры, сортировка, пагинация, детали, wishlist, ошибки и Retry сохранены |
| Часть B отсутствует | Нет React Router, Zod, react-hook-form, login и защищённых маршрутов |

## Автоматические проверки

Среда: Node.js 22.14.0, Edge 155.0.4283.45, Vite 8.3.4, TypeScript 6.0.2, Lighthouse 12.8.2.

| Команда | Результат |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, предупреждений нет |
| `npm test` | 4 файла, 13/13 тестов |
| `npm run build` | exit 0, 48 модулей; JS 250.02 kB / gzip 78.17 kB |

Тесты хуков проверяют generic debounce, success/Retry, abort при смене ключа и unmount, запрет короткого поиска и отмену активного поиска. Context-тесты проверяют сохранение темы и точный контракт локального пользователя. Полный stdout находится в `checks/`.

## Браузерные проверки

`tools/lab6a-browser.mjs` выполнен в настоящем Edge:

- 4/4 сценария с реальным Open Library: быстрый ввод создал один итоговый запрос; wishlist и тема сохранились после reload; Slow 4G дал подтверждённый CDP `canceled`; Offline показал сетевую ошибку и Retry восстановил каталог; детали `OL109524W` загрузили Solaris.
- 0 `pageerror` и 0 неожиданных ошибок консоли. Ошибки Offline сохранены отдельно как ожидаемые.
- 6/6 комбинаций light/dark × 375/768/1440 px без горизонтального overflow. Для этой детерминированной матрицы ответ Open Library заменён тестовой фикстурой и не считается реальным API.
- Сохранены 10 скриншотов и CDP-журнал `network-real.json`.

Lighthouse Accessibility каталога с реальным поиском: 100/100 в светлой и 100/100 в тёмной теме, overflow 0. JSON/HTML находятся в `accessibility/`.

## Воспроизведение

```powershell
cd booknest-web
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Браузерные зависимости находятся только в игнорируемой `.audit-tools`:

```powershell
node tools/lab6a-browser.mjs
node tools/lab6a-accessibility.mjs
node tools/lab6a-checks.mjs
```

## Ограничения

- Результаты настоящего API зависят от сети и текущих данных Open Library.
- AuthContext — учебная локальная заглушка; вход и реальная авторизация не реализованы.
- Существующая форма выдачи остаётся учебной и не отправляет данные на backend.
- Первый тёмный Lighthouse-запуск получил timeout из-за сохранённого поискового состояния. Скрипт исправлен очисткой storage; повторена только тёмная тема, итоговый аудит 100/100.
- Router, Zod, формы create/edit, login, `RequireAuth`, URL-фильтры и структура части B сознательно не добавлены.
- Push, PR, merge и устная защита не выполнялись.
