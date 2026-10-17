# Лабораторная 1. Доказательства проверки

## Проверяемые артефакты

- `index.html`
- `book.html`
- `loan.html`
- `README.md`
- `AI_USAGE.md`

## Реальные проверки браузером и внешними инструментами

Выполнено 2026-10-11 в ветке `lab-1/markup`.

Локальный сервер:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Инструменты:

- W3C Nu Validator API: `https://validator.w3.org/nu/?out=json`.
- Google Lighthouse `12.8.2`.
- Chrome: `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`.
- Microsoft Edge headless + CDP для smoke-check и скриншотов.

| Проверка | `index.html` | `book.html` | `loan.html` |
| --- | --- | --- | --- |
| W3C Nu Validator | 0 сообщений, `docs/lab1/validator/index.json` | 0 сообщений, `docs/lab1/validator/book.json` | 0 сообщений, `docs/lab1/validator/loan.json` |
| Lighthouse Accessibility | 96/100, `docs/lab1/lighthouse/index.json`, `docs/lab1/lighthouse/index.html` | 96/100, `docs/lab1/lighthouse/book.json`, `docs/lab1/lighthouse/book.html` | 96/100, `docs/lab1/lighthouse/loan.json`, `docs/lab1/lighthouse/loan.html` |
| Keyboard Tab path | Проверено CDP, `docs/lab1/screenshots/smoke-results.json` | Проверено CDP, `docs/lab1/screenshots/smoke-results.json` | Проверено CDP, `docs/lab1/screenshots/smoke-results.json` |
| Native validation | Форма фильтров валидна без обязательных полей | Пустая форма отзыва невалидна: `checkValidity=false` | Пустая форма выдачи невалидна: `checkValidity=false` |
| Screenshot | `docs/lab1/screenshots/index.png` | `docs/lab1/screenshots/book.png` | `docs/lab1/screenshots/loan.png` |

Единственное замечание Lighthouse во всех трех отчетах: `target-size` ("Touch targets do not have sufficient size or spacing"). Итоговая оценка остается 96/100. Исправление требует CSS-отступов/размеров, но CSS по заданию лабораторной 1 намеренно не добавляется; стилизация относится к лабораторной 2.

## Локальные статические проверки

Выполнено 2026-10-11 в ветке `lab-1/markup`.

### Один `h1` на страницу

Команда:

```powershell
rg -n "<h1\b|<script\b|<style\b|stylesheet|react|React|style=" index.html book.html loan.html
```

Фактический результат:

```text
book.html:29:        <h1>Solaris</h1>
index.html:21:      <h1>Каталог книг BookNest</h1>
loan.html:29:      <h1>Форма выдачи книги</h1>
```

Вывод: найдено по одному `h1` на каждой странице; совпадений по `script`, `style`, `stylesheet`, `React` и `style=` нет.

### Обязательные семантические элементы

Команда:

```powershell
rg -n "<(header|nav|main|article|section|aside|footer|figure|time|dl)\b" index.html book.html loan.html
```

Фактический результат: обязательные элементы найдены в HTML-страницах:

- `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`;
- `figure` и `time` для карточек и обложек;
- `dl` для характеристик книги и экземпляра.

### Формы, подписи и нативная валидация

Команда:

```powershell
rg -n "<label\b|<input\b|<select\b|<textarea\b| name=| required| maxlength| pattern| min=" index.html book.html loan.html
```

Фактический результат: поля форм, `label`, `name` и HTML-ограничения найдены на страницах:

- `index.html`: поиск, жанр, сортировка, чекбокс доступности;
- `book.html`: radio-оценка, имя читателя, текст отзыва;
- `loan.html`: ФИО, e-mail, номер билета, экземпляр, дата, срок, комментарий, подтверждение правил.

## Самопроверка требований

- [x] Ровно один `h1` на страницу.
- [x] Нет CSS, inline styles и атрибутов оформления по локальному поиску.
- [x] Нет React и JavaScript по локальному поиску.
- [x] Есть `lang="ru"`, charset, viewport и `title`.
- [x] Навигация связывает все три страницы.
- [x] Использованы обязательные элементы: `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, `figure`, `time`, `dl`.
- [x] Все поля форм имеют `label` и `name`.
- [x] Используется нативная валидация.
- [x] Все изображения имеют `alt`, `width`, `height`.
- [x] W3C Nu Validator: 0 ошибок HTML на всех трех страницах.
- [x] Lighthouse Accessibility: 96/100 на всех трех страницах.
- [x] Скриншоты и JSON/HTML-отчеты сохранены в `docs/lab1/`.
