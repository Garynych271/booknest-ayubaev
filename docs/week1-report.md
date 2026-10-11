# Практика 1. Жизненный цикл HTTP-запроса и рабочее окружение

Ветка: `feature/week1-report`

## 1. Проверка окружения

Команды выполнены локально 2026-10-11.

| Команда | Фактический результат | Статус |
| --- | --- | --- |
| `git --version` | `git version 2.43.0.windows.1` | OK |
| `node -v` | `v22.14.0` | OK |
| `python --version` | `Python 3.11.1` | Требуется Python 3.12 по syllabus |
| `curl.exe --version` | `curl 8.21.0 (Windows) libcurl/8.21.0 Schannel zlib/1.3.2 ...` | OK |
| `git config user.name` | `Garynych271` | OK |
| `git config user.email` | `garynych271@example.com` | OK |

Примечание для Windows PowerShell: команда `curl` без `.exe` является алиасом `Invoke-WebRequest`; для настоящего curl в отчете используется `curl.exe`.

SSH-ключи найдены в `$HOME\.ssh`: `id_ed25519`, `id_ed25519.pub`, `known_hosts`. Подключение к GitHub SSH в этом сеансе не проверялось, чтобы не делать сетевые действия без подтверждения.

Удаленный репозиторий:

```text
origin  https://github.com/Garynych271/booknest-ayubaev.git (fetch)
origin  https://github.com/Garynych271/booknest-ayubaev.git (push)
```

## 2. DevTools Network: учебная страница

Эти данные нужно снять вручную в Chrome/Edge DevTools. Не заполнять на глаз.

URL учебной страницы: `______________________________`

### Сводка Network

| Метрика | Значение из DevTools |
| --- | --- |
| Число запросов | TODO |
| Передано по сети / transferred | TODO |
| Общий размер ресурсов / resources | TODO |
| Время загрузки / finish | TODO |
| DOMContentLoaded | TODO |
| Load | TODO |

### Типы ресурсов

| Тип ресурса | Количество | Пример пути |
| --- | ---: | --- |
| document | TODO | TODO |
| stylesheet | TODO | TODO |
| script | TODO | TODO |
| image | TODO | TODO |
| font | TODO | TODO |
| fetch/xhr | TODO | TODO |
| other | TODO | TODO |

## 3. Запрос документа

Документный запрос: `______________________________`

### Request headers

| Header | Значение | Назначение |
| --- | --- | --- |
| TODO | TODO | TODO |
| TODO | TODO | TODO |
| TODO | TODO | TODO |
| TODO | TODO | TODO |
| TODO | TODO | TODO |

### Response headers

| Header | Значение | Назначение |
| --- | --- | --- |
| TODO | TODO | TODO |
| TODO | TODO | TODO |
| TODO | TODO | TODO |
| TODO | TODO | TODO |
| TODO | TODO | TODO |

## 4. Сравнение с `curl.exe -i`

Команда:

```powershell
curl.exe -i "<URL документного запроса>"
```

Краткий фрагмент ответа:

```text
TODO: вставить настоящий статус и первые заголовки ответа
```

Сравнение с браузером:

| Наблюдение | Browser DevTools | curl.exe |
| --- | --- | --- |
| HTTP status | TODO | TODO |
| Content-Type | TODO | TODO |
| Redirects | TODO | TODO |
| Cookies | TODO | TODO |
| Cache behavior | TODO | TODO |

Вывод: TODO.

## 5. Slow 4G и Offline

### Slow 4G

| Что измерить | Наблюдение |
| --- | --- |
| Какие запросы стали самыми долгими | TODO |
| Изменилось ли время `DOMContentLoaded`/`Load` | TODO |
| Есть ли блокирующие ресурсы | TODO |
| Что видно в waterfall | TODO |

### Offline

| Что измерить | Наблюдение |
| --- | --- |
| Статус документного запроса | TODO |
| Сообщение браузера или приложения | TODO |
| Какие ресурсы взяты из cache, если есть | TODO |
| Что отличается от Slow 4G | TODO |

## 6. Самостоятельная часть: 10 запросов любого сайта

Выбранный сайт: `______________________________`

| # | Метод | Путь | Код | Тип | Размер |
| ---: | --- | --- | ---: | --- | --- |
| 1 | TODO | TODO | TODO | TODO | TODO |
| 2 | TODO | TODO | TODO | TODO | TODO |
| 3 | TODO | TODO | TODO | TODO | TODO |
| 4 | TODO | TODO | TODO | TODO | TODO |
| 5 | TODO | TODO | TODO | TODO | TODO |
| 6 | TODO | TODO | TODO | TODO | TODO |
| 7 | TODO | TODO | TODO | TODO | TODO |
| 8 | TODO | TODO | TODO | TODO | TODO |
| 9 | TODO | TODO | TODO | TODO | TODO |
| 10 | TODO | TODO | TODO | TODO | TODO |

Архитектура сайта: `статика / SPA / SSR`

Три наблюдаемых признака:

1. TODO.
2. TODO.
3. TODO.

## 7. Challenge task

Не выполнялось в этом сеансе.

Если выполнять: найти URL, где ответ меняется от `Accept` или `Accept-Language`, и приложить две команды:

```powershell
curl.exe -i -H "Accept-Language: ru" "<URL>"
curl.exe -i -H "Accept-Language: en" "<URL>"
```

## 8. Самопроверка

- [x] Отчет создан в ветке `feature/week1-report`.
- [x] Локальное окружение проверено реальными командами.
- [ ] Заполнены реальные DevTools Network данные.
- [ ] Выполнен настоящий `curl.exe -i` для выбранного документа.
- [ ] Таблица из 10 запросов заполнена реальными данными.
- [ ] Архитектура сайта обоснована тремя наблюдаемыми признаками.
- [ ] PR открыт из ветки, не из `main`.

