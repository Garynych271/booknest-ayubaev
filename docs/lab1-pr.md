# PR: Лабораторная 1 — семантический интерфейс BookNest

## Что сделано

- Добавлены три HTML-страницы BookNest без CSS и JavaScript.
- Добавлены README, AI_USAGE и чек-лист доказательств.
- Страницы связаны навигацией.
- Формы используют нативную HTML-валидацию.
- Выполнены реальные проверки W3C Nu Validator, Lighthouse Accessibility и browser smoke-check.

## Как проверить

1. Открыть `index.html`.
2. Перейти по ссылкам на `book.html` и `loan.html`.
3. Проверить отправку форм с пустыми обязательными полями.
4. Пройти страницы клавишей Tab.
5. Проверить сохраненные отчеты W3C Nu Validator в `docs/lab1/validator/`.
6. Проверить Lighthouse Accessibility отчеты в `docs/lab1/lighthouse/`.
7. Проверить скриншоты и smoke-check в `docs/lab1/screenshots/`.

## Результаты проверок

| Страница | W3C Nu Validator | Lighthouse Accessibility |
| --- | --- | ---: |
| `index.html` | 0 сообщений | 96/100 |
| `book.html` | 0 сообщений | 96/100 |
| `loan.html` | 0 сообщений | 96/100 |

Единственное замечание Lighthouse: `target-size` на всех страницах. CSS не добавлялся, так как лабораторная 1 требует HTML без стилей; оценка выше порога 90 и целевого уровня 95.

## Самопроверка

- [x] Один `h1` на страницу.
- [x] Иерархия заголовков без пропусков.
- [x] Все поля форм имеют `label` и `name`.
- [x] Нет inline styles/CSS/JS/React.
- [x] Использованы обязательные семантические элементы.
- [x] Изображения имеют `alt`, `width`, `height`.
- [x] Реальные результаты W3C/Lighthouse внесены в `docs/lab1/README.md`.

