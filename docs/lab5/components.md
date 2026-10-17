# ЛР5: дерево компонентов и владельцы состояния

План составлен до реализации React-кода, 17.10.2026. База: `lab-4/api`, `9af96ee`; рабочая ветка: `lab-5/react`. Vite `react-ts` создаётся в `booknest-web/`. Старые HTML/JS и доказательства ЛР1–4 не удаляются.

## Дерево

```text
StrictMode
└── App (preferences: filters, page, wishlist; storageAvailable)
    ├── Header (текущая страница, счётчик wishlist)
    ├── CatalogPage (ответ API с ключом запроса; номер попытки Retry)
    │   ├── FiltersPanel (управляемая форма; props от App)
    │   │   └── Button
    │   ├── Spinner / EmptyState / ErrorBox → Button
    │   ├── BookList → BookCard
    │   │   ├── BookCover (состояние загрузки изображения)
    │   │   ├── Badge
    │   │   └── Button
    │   ├── Pagination → Button
    │   └── Wishlist → Badge / EmptyState / Button
    ├── BookDetails (ответ API и номер попытки Retry)
    │   ├── Spinner / EmptyState / ErrorBox → Button
    │   └── BookCover / Badge / Button
    ├── LoanPage (прежняя учебная форма; состояние подтверждения без отправки)
    │   └── Button
    └── Footer
```

Каталог, детали и форма выбираются URL-параметрами через обычные ссылки и полную загрузку страницы. React Router, Context, Zod, react-hook-form и собственные хуки ЛР6 не добавляются. Прямой вход в детали и история браузера работают средствами URL/браузера.

## Состояние и данные

| Владелец | Исходное состояние | Почему здесь |
| --- | --- | --- |
| App | filters, page, wishlist; доступность storage | Фильтры управляют каталогом, wishlist нужен шапке, карточкам и деталям; единая точка изменения и сохранения |
| CatalogPage | Серверный ответ и ключ запроса; retry attempt | Загрузка относится к каталогу; effect отменяется при изменении фильтров/страницы или размонтировании |
| BookDetails | Серверный ответ; retry attempt | Отдельные запросы по work ID, независимые от каталога |
| BookCover | Успех/ошибка конкретного изображения | Сбой обложки не меняет состояние API или карточки |
| LoanPage | Факт завершения учебной формы | Реальная выдача не реализуется; нативные ограничения HTML сохраняются |

Статус loading выводится из несовпадения текущего ключа запроса с завершённым; ответ устанавливается в finally только неотменённого effect. Debounce 350 мс, AbortController и проверка signal.aborted защищают от устаревших результатов, включая StrictMode. Сетевые данные проходят проверку unknown на границе API.

Производные данные не дублируются в useState: число wishlist, признак «сохранено», количество карточек, totalPages, границы пагинации и состояние текущего запроса вычисляются при рендере. Обновления preferences/wishlist иммутабельны, ключи карточек — стабильные OL…W.

## Декомпозиция

План: 17 компонентов, 12 без собственного состояния: Header, Footer, FiltersPanel, BookList, BookCard, Pagination, Wishlist, Button, Badge, Spinner, EmptyState, ErrorBox. App, CatalogPage, BookDetails, BookCover, LoanPage — владельцы состояния. Каждый TSX-файл компонента не более 150 строк.

Переиспользование: Button — фильтры/карточка/пагинация/повтор/форма; Badge — карточка/детали/wishlist; Spinner — каталог/детали; EmptyState — каталог/детали/wishlist; ErrorBox — каталог/детали. Props объявляются interface; перечисления — union-типы в types.ts; any не нужен.

Слои: `src/components/`, `src/lib/`, `src/api/`, `src/types.ts`. CSS ЛР2–4 импортируется без переписывания палитры и раскладки. API, wishlist v2 и миграция старых b-ID сохраняют семантику ЛР4. Прежние unit-тесты продолжают выполняться; новые проверяют именно TypeScript-модули.

## Защита и доказательства

Показать App и его filters в настоящем React DevTools, типизированные props FiltersPanel, Badge в карточке и деталях, успешный build. Проверить изменение поиска/сортировки/страницы без перестановки состояния карточек: индекс массива в key связал бы состояние BookCover с позицией, а не с книгой. Снимок DevTools должен быть настоящим; при невозможности автоматизации отдельно указать ручной шаг.
