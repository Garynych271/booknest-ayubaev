# ЛР6A: архитектура хуков и Context

План составлен до реализации 17.10.2026. Ветка `lab-6a/hooks` создана от `lab-5/react` (`282b962`). Часть B, маршрутизация и формы не входят в эту ветку.

## Что уже было в ЛР5

- `api/client.ts` и `api/books.ts` изолируют настоящий Open Library API, типизированные ошибки, `response.ok`, тайм-аут и объединение внешнего `AbortSignal`.
- Каталог и детали поддерживают loading, success, empty, error, Retry и отмену устаревших запросов.
- Wishlist, фильтры, пагинация, адаптивность и системные темы работают.
- ESLint уже включает `react-hooks` и запрещает `fetch` в компонентах.

## Что требуется добавить

- Типизированные `useFetch<T>`, `useBooks`, `useDebounce<T>`; для деталей — `useBook` поверх `useFetch`.
- Перенос сетевого lifecycle из `CatalogPage` и `BookDetails` в хуки.
- Cleanup с `AbortController` в общем хуке и корректные зависимости эффектов.
- `ThemeContext` с переключением и сохранением light/dark.
- `AuthContext` с локальной заглушкой текущего читателя без реальной авторизации.
- Модульные тесты хуков и повторная браузерная проверка изменённых сценариев.

## Направление зависимостей

```text
components -> hooks -> api
components -> contexts
hooks -> types, api
contexts -> types/browser storage
api -> types, lib validation
```

Компоненты получают `data`, `isLoading`, `error` и `retry`, но не знают о `fetch`, `AbortController` или формате HTTP. Context содержит только тему и текущего пользователя. Фильтры, wishlist, ответы API и состояния страниц остаются локальными для `App` и страниц.

## Владельцы состояния

| Владелец | Состояние |
| --- | --- |
| `App` | filters, page, wishlist, доступность preference storage |
| `useFetch<T>` | результат, loading, error, номер повторной попытки |
| `useBooks` | debounced query и состояние запроса каталога |
| `useBook` | состояние отдельного запроса деталей |
| `ThemeProvider` | `light | dark`, сохранение выбора |
| `AuthProvider` | неизменяемая локальная заглушка пользователя |

## Границы части A

Не добавляются React Router, URL-маршруты ЛР6B, Zod, react-hook-form, login page, `RequireAuth`, формы создания/редактирования и дополнительные задания.
