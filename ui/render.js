import { PAGE_SIZE, MIN_QUERY, isWorkId } from '../api/books.js';

export function coverImage(image, book) {
  image.alt = 'Обложка: ' + book.title;
  image.loading = 'eager';
  const url = book.cover ? 'https://covers.openlibrary.org/b/id/' + book.cover + '-M.jpg?default=false' : '';
  image.hidden = !url || image.src !== url || !image.complete || image.naturalWidth <= 1;
  if (url && image.src !== url) image.src = url;
}
export function bindCoverFallback(root) {
  root.addEventListener('load', event => {
    if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-cover')) event.target.hidden = event.target.naturalWidth <= 1;
  }, true);
  root.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }, true);
}
export function render(state, view) {
  const active = document.activeElement?.closest('[data-action]');
  const key = active ? { action: active.dataset.action, id: active.dataset.id } : null;
  const oldIndex = active ? [...view.wishlist.querySelectorAll('button')].indexOf(active) : -1;
  const fields = view.form.elements;
  if (fields.q.value !== state.filters.query) fields.q.value = state.filters.query;
  fields.genre.value = state.filters.genre;
  fields.sort.value = state.filters.sort;
  fields.available.checked = state.filters.available;
  view.main.querySelector('.catalog').setAttribute('aria-busy', String(state.loading));
  for (const panel of view.main.querySelectorAll('[data-state]')) panel.hidden = panel.dataset.state !== state.status;
  view.count.textContent = state.status === 'success' ? 'Найдено записей: ' + state.total + '. Книг на странице: ' + state.books.length + (state.skipped ? '. Некорректных записей пропущено: ' + state.skipped : '') : '';
  view.empty.textContent = state.filters.query.trim().length < MIN_QUERY
    ? 'Введите не менее двух символов названия или имени автора.'
    : 'Книги не найдены. Измените запрос или сбросьте фильтры.';
  view.main.querySelector('[data-error-message]').textContent = state.error;
  view.storageNotice.hidden = state.storageAvailable;
  view.storageNotice.textContent = state.storageAvailable ? '' : 'Сохранение недоступно. Изменения действуют до закрытия страницы.';
  const pageCount = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
  view.main.querySelector('[data-page]').textContent = 'Страница ' + state.page + ' из ' + pageCount;
  view.main.querySelector('[data-action="previous"]').disabled = state.loading || state.page <= 1;
  view.main.querySelector('[data-action="next"]').disabled = state.loading || state.page >= pageCount;
  view.list.replaceChildren(...(state.status === 'success' ? state.books : []).map(book => {
    const card = view.template.content.firstElementChild.cloneNode(true);
    card.dataset.bookId = book.id;
    card.querySelector('[data-title]').textContent = book.title;
    card.querySelector('[data-author]').textContent = book.author;
    card.querySelector('[data-year]').textContent = book.year ?? 'Не указан';
    card.querySelector('[data-genre]').textContent = book.genre;
    card.querySelector('[data-availability]').textContent = book.available ? 'Открытый электронный доступ' : 'Открытый доступ не подтверждён';
    card.querySelector('[data-rating]').textContent = book.rating === null ? 'Нет оценок' : book.rating.toFixed(1) + ' из 5';
    coverImage(card.querySelector('[data-cover]'), book);
    const button = card.querySelector('button');
    button.dataset.id = book.id;
    const saved = state.wishlist.some(item => item.id === book.id);
    button.setAttribute('aria-pressed', String(saved));
    button.textContent = saved ? 'В моём списке' : 'Хочу прочитать';
    button.setAttribute('aria-label', button.textContent + ': ' + book.title);
    const link = card.querySelector('[data-detail-link]');
    link.href = 'book.html?id=' + encodeURIComponent(book.id);
    link.textContent = 'Подробнее: ' + book.title;
    return card;
  }));
  view.wishlistCount.textContent = String(state.wishlist.length);
  view.wishlistEmpty.hidden = state.wishlist.length !== 0;
  view.wishlist.replaceChildren(...state.wishlist.map(book => {
    const item = document.createElement('li');
    const title = document.createElement(isWorkId(book.id) ? 'a' : 'span');
    title.textContent = book.title + ' · ' + book.author + (isWorkId(book.id) ? '' : ' (список ЛР3)');
    if (isWorkId(book.id)) title.href = 'book.html?id=' + encodeURIComponent(book.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = 'remove';
    button.dataset.id = book.id;
    button.textContent = 'Удалить';
    button.setAttribute('aria-label', 'Удалить из списка: ' + book.title);
    item.append(title, button);
    return item;
  }));
  if (key && (!active.isConnected || active.closest('[hidden]'))) {
    const replacement = [...view.main.querySelectorAll('[data-action]')].find(button => button.dataset.action === key.action && button.dataset.id === key.id && !button.closest('[hidden]'));
    const next = view.wishlist.querySelectorAll('button')[Math.max(0, oldIndex - 1)];
    (replacement || (key.action === 'remove' ? next || view.wishlistTitle : view.main.querySelector('#catalog-title'))).focus({ preventScroll: true });
  }
}
bindCoverFallback(document);
