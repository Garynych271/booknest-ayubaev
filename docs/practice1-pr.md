# СРС и практика недели 1: HTTP lifecycle report

Отчёт недели 1 дополнен полным комплектом СРС по лекции 1 для публичного сайта `python.org`. Существующие реальные измерения практики сохранены без повторного тяжёлого аудита.

## Что подтверждено

- Подписанный waterfall первого Document request построен по настоящему Edge CDP timing.
- Таблица содержит 10 записей реального Network-прогона из 24 запросов.
- Сохранён настоящий `curl.exe -sIL https://python.org`: `301` на `https://www.python.org/`, затем `200`.
- Добавлена редактируемая схема наблюдаемой цепочки Browser → Varnish → nginx → resources.
- Вывод SSR/традиционный MPA обоснован наблюдаемыми признаками и содержит явное ограничение: способ генерации HTML внутри origin не установлен.

## Артефакты

- `docs/week1-report.md` — компактный основной отчёт и приложение с материалами практики.
- `docs/practice1/python-evidence/network-timing.json` — исходные CDP timing.
- `docs/practice1/python-evidence/network-waterfall.png` — подписанный waterfall.
- `docs/practice1/python-evidence/curl-python-redirects.txt` — полный вывод `curl -sIL`.
- `docs/practice1/python-evidence/architecture.png` — схема архитектуры.
- `docs/practice1/python-evidence/normal.json` — 24 настоящих запроса.

## Самопроверка

- [x] Все пять требований домашнего задания лекции 1 имеют доказательства.
- [x] Реальные данные отделены от архитектурных выводов.
- [x] Внутреннее устройство чужого сайта не представлено как установленный факт.
- [x] Работа выполнена в `feature/week1-report`.

Head: `feature/week1-report`; base открытого PR №1 не изменялся. Push, создание нового PR и merge при дополнении не выполнялись.
