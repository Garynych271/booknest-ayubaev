# Практика 5. Публичный REST API и четыре состояния интерфейса

## Тема и цель

Работа с настоящим Open Library API, отмена устаревших запросов и явное отображение loading/success/empty/error. Проверяемый снимок: ветка `lab-4/api`, итоговый коммит `9af96ee`; API и browser-аудиты добавлены коммитами `587af0b`, `8bc37a6`, `b523ec9`.

## Обязательные требования

| Требование методички | Статус | Проверяемое доказательство |
| --- | --- | --- |
| Выполнить search/work/missing в Thunder Client или Postman, сохранить коллекцию и коды | Частично | [`lab4/api-collection.json`](../lab4/api-collection.json) содержит три импортируемых запроса. Реальный `curl.exe` получил 200, 200 и 404: [`curl-summary.json`](../lab4/network/curl-summary.json). Thunder Client/Postman локально не установлены, поэтому GUI-запуск не заявлен. |
| `api/client.js`: единый base URL, `URLSearchParams`, `response.ok`, `ApiError.status` | Подтверждено | `git show lab-4/api:api/client.js`; unit-тест `API client: encoded parameters, response.ok, HTTP and JSON failures`. |
| Заменить локальные данные результатами настоящего API | Подтверждено | `git show lab-4/api:api/books.js`; реальный поиск Solaris вернул HTTP 200 и отобразил 19 нормализованных книг из 20 документов. |
| Ровно одно из loading/success/empty/error | Подтверждено | `ui/render.js` скрывает все панели, кроме `state.status`; real и mock browser scenarios проверяют success, empty, 429, 503, malformed, timeout и Offline. |
| Debounce 350 мс и сокращение запросов | Подтверждено | `main.js` использует `setTimeout(search, 350)`; mock-сценарий rapid input зафиксировал единственный итоговый URL. |
| AbortController и `canceled` в Network | Подтверждено реальным API | [`browser-real.json`](../lab4/network/browser-real.json): запрос Lem завершился `net::ERR_ABORTED`, `canceled: true`, после ввода Tolkien. |
| Slow 4G и Offline; различить сеть и HTTP-сервер | Подтверждено | [`browser-results.json`](../lab4/browser-results.json): latency 2000 ms; Offline-сообщение и восстановление Retry. Mock 429/503 отдельно проверяют HTTP 4xx/5xx и не выдаются за реальный сервер. |
| Кнопка «Повторить» | Подтверждено | Реальный Offline восстановился после Retry; mock-сценарии empty/429/503/malformed/timeout также завершились без зависшего loading. |
| Спиннер снимается при любом исходе | Подтверждено | `lib/api-state.js` снимает `state.loading` в `finally`; unit-тест `loading always clears`, timeout 20 385 ms и все error-сценарии завершились. |
| Коллекция запросов в репозитории | Подтверждено | `docs/lab4/api-collection.json`, формат Postman Collection v2.1. |

## Самостоятельная часть

Подтверждена: `PAGE_SIZE = 20`, prev/next блокируются на границах. Реальный Open Library запрос перешёл на страницу 2 из 86. В ЛР4 номер страницы сохранялся при повторе неизменённого поиска; изменение фильтров осознанно возвращает страницу 1.

## Реальный API и моки

- Реальные: curl search 200, work 200, missing 404; браузерные Solaris/Tolkien/Dune, отмена Lem, Offline и Retry, детали `OL109524W`.
- Моки: гарантированные empty, 429, 503, malformed JSON, timeout, граничная пагинация и матрица viewport/theme.
- Моки проверяют детерминированные ветви ошибок и не считаются доказательством доступности Open Library.

## Дополнительные изменения

Приложение не изменялось. Добавлен только отчёт практики; сохранённые HTTP-ответы и браузерные отчёты не перезапускались, потому что снимок `lab-4/api` неизменяем.

## Результаты проверок

- Реальные сценарии: 6/6.
- Mock browser scenarios: 11/11.
- Unit tests исторического снимка: 17/17; ESLint exit 0.
- API-коллекция: три GET-запроса; фактические curl-статусы 200/200/404.

## Что осталось сделать вручную

Импортировать `api-collection.json` в Thunder Client или Postman, выполнить три запроса и показать историю/коды преподавателю. До этого первый шаг практики имеет статус «частично», хотя сами URL и реальные ответы проверены через curl и Edge.

## Краткие ответы для защиты

- `response.ok` нужен, потому что `fetch` не отклоняет Promise только из-за HTTP 404/500.
- Debounce не запускает запрос, пока пользователь продолжает ввод; AbortController отменяет уже начавшийся устаревший запрос.
- `finally` снимает loading и при успехе, и при исключении, поэтому спиннер не зависает.
- Offline имеет status 0 и сетевой тип ошибки; HTTP 4xx/5xx содержит фактический `status` ответа.
- Моки нужны для воспроизводимых редких ошибок, но не доказывают работу внешнего сервиса.

Challenge task с автоматическим retry 5xx не выполнялся: он необязателен.
