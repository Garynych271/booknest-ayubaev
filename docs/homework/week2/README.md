# Домашнее задание недели 2. Профиль читателя

Проверено 17 октября 2026 года в ветке `feature/profile-markup`. Страница `profile.html` продолжает HTML-каркас ЛР1 без CSS, JavaScript и React.

## Требования и доказательства

| Требование | Статус | Доказательство |
| --- | --- | --- |
| Данные читателя | Выполнено | `profile.html`: семантический список `dl`, ссылка на почту и дата регистрации |
| История выдач | Выполнено | Таблица с `caption`, `thead`, `tbody`, четырьмя `th scope="col"` и тремя `th scope="row"` |
| Форма смены пароля | Выполнено | Три поля `password` с уникальными `id`, `name`, связанными `label`, `required`, `minlength`, `maxlength` и `autocomplete` |
| Один `h1` и корректные заголовки | Выполнено | Browser smoke-check: 1 `h1`, уровни `1, 2, 2, 2` |
| Клавиатурная доступность | Выполнено | Tab последовательно достиг всех 13 ссылок, полей и кнопки; порядок сохранён в `smoke-results.json` |
| Нативная валидация | Выполнено | Пустая форма: `checkValidity() === false`; ограничения задаются HTML-атрибутами |
| Навигация между четырьмя экранами | Выполнено | Ссылка на профиль добавлена в `index.html`, `book.html`, `loan.html`; профиль содержит ссылки обратно |
| W3C без ошибок | Выполнено | Nu Validator: 0 сообщений; JSON, HTML и снимок сохранены |
| Lighthouse Accessibility ≥ 90 | Выполнено | 96/100; JSON, HTML и снимок сохранены |
| Без CSS, JavaScript и React | Выполнено | В прикладных HTML-файлах не добавлены стили или скрипты |

## Реальные результаты

- W3C Nu Validator API `https://validator.w3.org/nu/`: 0 ошибок и 0 предупреждений.
- Lighthouse `12.8.2`, headless Microsoft Edge: Accessibility 96/100.
- Единственный неуспешный аудит Lighthouse — `target-size`. Увеличение зон нажатия требует CSS, который намеренно не добавляется в HTML5-задании.
- Smoke-check через Playwright и Edge: 1 `h1`, последовательная иерархия заголовков, 3 поля и 3 подписи, 13 из 13 интерактивных элементов доступны клавишей Tab.
- Пустая форма блокируется нативной валидацией. Совпадение нового пароля и подтверждения невозможно проверить только декларативным HTML; серверная проверка и JavaScript не входят в это задание.

## Артефакты

- `validator/profile.json` и `validator/profile.html` — ответы официального Nu Validator.
- `lighthouse/profile.report.json` и `lighthouse/profile.report.html` — исходные отчёты Lighthouse.
- `screenshots/profile.png` — страница без стилей.
- `screenshots/validator.png` — результат Nu Validator.
- `screenshots/lighthouse.png` — результат Lighthouse.
- `smoke-results.json` — структура страницы, нативная валидность и фактический порядок фокуса.

## Воспроизведение

```powershell
python -m http.server 8080 --bind 127.0.0.1
curl.exe -H "Content-Type: text/html; charset=utf-8" --data-binary "@profile.html" "https://validator.w3.org/nu/?out=json"
```

После запуска сервера открыть `http://127.0.0.1:8080/profile.html`. Для ручной проверки пройти страницу клавишей Tab и отправить пустую форму; фокус должен перейти к первому обязательному полю.
