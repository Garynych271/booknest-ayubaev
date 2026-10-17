import { genres } from '../data/books.js';
import { selectBooks } from '../lib/books.js';

export function render(state, books, view) {
  const activeAction = document.activeElement?.closest('[data-action]');
  const focusKey = activeAction ? { action: activeAction.dataset.action, id: activeAction.dataset.id } : null;
  const oldIndex = activeAction ? [...view.wishlist.querySelectorAll('button')].indexOf(activeAction) : -1;
  const selected = selectBooks(books, state.filters);
  view.form.elements.q.value = state.filters.query;
  view.form.elements.genre.value = state.filters.genre;
  view.form.elements.sort.value = state.filters.sort;
  view.form.elements.available.checked = state.filters.available;
  view.count.textContent = `Найдено книг: ${selected.length} из ${books.length}`;
  view.empty.hidden = selected.length !== 0;
  view.storageNotice.hidden = state.storageAvailable;
  view.storageNotice.textContent = state.storageAvailable ? '' : 'Сохранение недоступно. Изменения действуют до закрытия страницы.';
  view.list.replaceChildren(...selected.map(book => {
    const card = view.template.content.firstElementChild.cloneNode(true);
    card.dataset.bookId = book.id;
    card.querySelector('[data-title]').textContent = book.title;
    card.querySelector('[data-author]').textContent = book.author;
    card.querySelector('[data-year]').textContent = book.year < 0 ? `${Math.abs(book.year)} до н. э.` : String(book.year);
    card.querySelector('[data-genre]').textContent = genres[book.genre];
    card.querySelector('[data-availability]').textContent = book.available ? 'Доступна' : 'Нет свободных экземпляров';
    card.querySelector('[data-rating]').textContent = `${book.rating.toFixed(1)} из 5`;
    const image = card.querySelector('[data-cover]');
    image.src = `assets/covers/${book.id}.png`;
    image.alt = `Учебная обложка: ${book.title}`;
    const button = card.querySelector('button');
    button.dataset.id = book.id;
    const saved = state.wishlist.includes(book.id);
    button.setAttribute('aria-pressed', String(saved));
    button.textContent = saved ? 'В моём списке' : 'Хочу прочитать';
    button.setAttribute('aria-label', `${button.textContent}: ${book.title}`);
    card.querySelector('[data-detail-link]').hidden = book.id !== 'b01';
    return card;
  }));
  view.wishlistCount.textContent = String(state.wishlist.length);
  view.wishlistEmpty.hidden = state.wishlist.length !== 0;
  view.wishlist.replaceChildren(...state.wishlist.map(id => {
    const book = books.find(item => item.id === id);
    const item = document.createElement('li');
    const title = document.createElement('span');
    title.textContent = `${book.title} · ${book.author}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = 'remove';
    button.dataset.id = id;
    button.textContent = 'Удалить';
    button.setAttribute('aria-label', `Удалить из списка: ${book.title}`);
    item.append(title, button);
    return item;
  }));
  // Replacing cards must not drop keyboard focus to the document body.
  if (focusKey) {
    const replacement = [...view.main.querySelectorAll('[data-action]')].find(button =>
      button.dataset.action === focusKey.action && button.dataset.id === focusKey.id);
    const next = view.wishlist.querySelectorAll('button')[Math.max(0, oldIndex - 1)];
    (replacement || next || view.wishlistTitle).focus({ preventScroll: true });
  }
}
