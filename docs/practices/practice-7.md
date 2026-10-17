# Практика 7. Собственные хуки и слой API

## Тема и цель

Вынос сетевого lifecycle из React-компонентов, корректные зависимости и cleanup эффектов, диагностика запросов и перерисовок. Основной снимок: `lab-6a/hooks` (`63053b8`); хуки и refactor — `8631aaa`, `a364af4`, Context — `9d2e26f`, проверки — `25bfa7f`.

## Обязательные требования

| Требование методички | Статус | Проверяемое доказательство |
| --- | --- | --- |
| Типизированные `api/client.ts` и `api/books.ts` | Подтверждено | [`booknest-web/src/api/`](../../booknest-web/src/api/); прямой `fetch` находится только в `client.ts`. API tests покрывают HTTP, JSON, timeout и abort. |
| Намеренно воспроизвести effect без dependencies и бесконечный поток | Не подтверждено | Антипаттерн не вносился в рабочую историю, отдельного Network-доказательства нет. Причина описана ниже; живую демонстрацию следует выполнить на временной копии. |
| Исправить dependencies и включить `exhaustive-deps` | Подтверждено | `booknest-web/eslint.config.js`; [`lab6a/checks/eslint.txt`](../lab6a/checks/eslint.txt): exit 0, предупреждений нет. |
| Универсальный `useFetch<T>` с data/loading/error | Подтверждено | [`useFetch.ts`](../../booknest-web/src/shared/hooks/useFetch.ts); tests проверяют success, Retry, смену key и unmount. |
| Прикладной `useBooks` поверх `useFetch`; сократить компонент | Частично | [`useBooks.ts`](../../booknest-web/src/features/books/useBooks.ts) инкапсулирует запрос. В ЛР6A `CatalogPage` уменьшился с 64 до 46 строк, то есть не вдвое; после последующей декомпозиции ЛР6B страница содержит 16 строк, но это более поздний refactor. |
| AbortController в cleanup и устранение race | Подтверждено | `useFetch` abort-ит controller в cleanup; hook tests проверяют смену key/unmount. [`lab6a/network-real.json`](../lab6a/network-real.json) содержит реальные `net::ERR_ABORTED`, `canceled: true`. |
| ThemeContext с provider и `useTheme`, переключатель в header | Подтверждено | [`ThemeProvider.tsx`](../../booknest-web/src/shared/contexts/ThemeProvider.tsx), `theme.ts`, `Header.tsx`; context tests и browser matrix light/dark. |
| React Profiler: записать взаимодействие и найти лишний render | Не подтверждено | Standalone React DevTools подключился и показал `Start recording`, но завершённая запись не получена. В [`practice-7-evidence.json`](evidence/practice-7-evidence.json) `recorded: false`. Требуется ручная демонстрация. |
| Нет `fetch` в компонентах; effects очищаются; hooks lint чистый | Подтверждено | Static grep и ESLint: `fetch` только в API client; subscriptions/requests/timers имеют cleanup; `react-hooks` без предупреждений. |
| Context применяется только для темы | Требует согласования с преподавателем | Практика 7 требует только ThemeContext, но ЛР6A одновременно требует AuthContext. AuthContext хранит только локального пользователя; каталог, filters, wishlist и request state через Context не передаются. Удаление AuthContext сломало бы требование ЛР6A, поэтому архитектура сохранена. |

## Самостоятельная часть: `useDebounce<T>`

Хук реализован в [`useDebounce.ts`](../../booknest-web/src/shared/hooks/useDebounce.ts), задержка поиска — 350 мс. 17.10.2026 выполнено отдельное реальное измерение в Edge 155 через CDP:

1. Контролируемый baseline вызывал Open Library для `So`, `Sol`, `Sola`, `Solar`, `Solari`, `Solaris` с интервалом 70 мс — зафиксировано 6 запросов.
2. Та же последовательность вводилась в поле BookNest с действующим `useDebounce(350)` — зафиксирован 1 запрос с итоговым `Solaris`.
3. Полные URL и CDP timestamps сохранены в [`practice-7-evidence.json`](evidence/practice-7-evidence.json).

Основную панель Edge Network корректно снять автоматически не удалось: команда открыла другой инструмент DevTools. Неудачные PNG удалены и не используются как доказательство. Требуемые методичкой два Network-скриншота остаются ручным действием.

## Дополнительные изменения

Приложение в рамках практики 7 не менялось. Добавлен воспроизводимый [`practice7-evidence.mjs`](../../tools/practice7-evidence.mjs) и отчёт о фактически полученных результатах. Challenge `usePaginatedBooks` не выполнялся.

## Реальные результаты проверок

- ЛР6A: TypeScript exit 0; ESLint/exhaustive-deps exit 0; 13/13 tests; Vite build exit 0.
- Реальный API: быстрый ввод дал один итоговый запрос; Slow 4G отменил устаревший; Offline + Retry восстановили каталог.
- Новое сравнение: baseline 6 запросов, debounced UI 1 запрос.
- После изменений практики 6 весь текущий React-проект прошёл TypeScript, ESLint, Vitest 24/24 и build; после этого код приложения не менялся.

## Что показать вручную

1. Network «до»: на временной копии отключить debounce, быстро ввести `Solaris`, сохранить панель с несколькими запросами.
2. Network «после»: вернуть текущий код, повторить ввод, сохранить панель с одним итоговым запросом.
3. Profiler: Start recording → поиск `Dune` → переключить тему → Stop recording; назвать компонент с лишним render и причину.
4. На временной копии убрать dependencies у request effect, показать цикл, затем сразу отменить изменение.
5. Согласовать трактовку AuthContext с преподавателем.

## Краткие ответы для защиты

- Effect без dependency array выполняется после каждого render; если он обновляет state, возникает цикл render → effect → setState.
- Dependency array должен содержать все внешние значения эффекта; `exhaustive-deps` обнаруживает пропуски статически.
- Cleanup вызывается перед следующим effect и при unmount, поэтому старый controller можно безопасно abort-ить.
- Debounce сокращает число стартовавших запросов, а abort защищает от уже стартовавших устаревших ответов.
- Context уместен для сквозных theme/auth данных, но не для локального состояния каталога и отдельной страницы.
