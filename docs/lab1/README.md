# Лабораторная 1. Доказательства проверки

## Проверяемые артефакты

- `index.html`
- `book.html`
- `loan.html`
- `README.md`
- `AI_USAGE.md`

## Ручные проверки

Эти пункты требуют браузера или внешних инструментов. Результаты нельзя заполнять без настоящего запуска.

| Проверка | `index.html` | `book.html` | `loan.html` |
| --- | --- | --- | --- |
| W3C Markup Validator URL/скриншот | TODO | TODO | TODO |
| Lighthouse Accessibility score | TODO | TODO | TODO |
| Keyboard Tab path checked | TODO | TODO | TODO |
| Native validation checked | TODO | TODO | TODO |

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
- [ ] W3C Markup Validator пройден вручную.
- [ ] Lighthouse Accessibility пройден вручную.
