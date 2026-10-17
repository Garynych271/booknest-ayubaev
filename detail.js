import { getBook } from './api/books.js';
import { BASE_URL } from './api/client.js';
import { createLoader } from './lib/api-state.js';
import { loadApiPreferences, saveApiPreferences } from './api-storage.js';
import { coverImage } from './ui/render.js';

const id = new URLSearchParams(location.search).get('id');
const state = { ...loadApiPreferences(), status: 'empty', loading: false, error: '', book: null };
const main = document.querySelector('main');
const element = name => main.querySelector('[data-' + name + ']');
function render() {
  main.setAttribute('aria-busy', String(state.loading));
  for (const panel of main.querySelectorAll('[data-state]')) panel.hidden = panel.dataset.state !== state.status;
  element('error-message').textContent = state.error;
  const book = state.book;
  if (state.status !== 'success' || !book) return;
  document.title = 'BookNest — ' + book.title;
  element('heading').textContent = book.title;
  element('breadcrumb').textContent = book.title;
  element('author').textContent = book.author;
  element('author-name').textContent = book.author;
  element('year').textContent = book.year ?? 'Не указан';
  element('genre').textContent = book.genre;
  element('rating').textContent = book.rating === null ? 'Нет оценок' : book.rating.toFixed(1) + ' из 5';
  element('availability').textContent = book.available ? 'Открытый доступ' : 'Открытый доступ не подтверждён';
  element('description').textContent = book.description;
  element('source').href = BASE_URL + '/works/' + book.id;
  coverImage(element('cover'), book);
  const saved = state.wishlist.some(item => item.id === book.id);
  const button = main.querySelector('[data-action="toggle"]');
  button.setAttribute('aria-pressed', String(saved));
  button.textContent = saved ? 'В моём списке' : 'Хочу прочитать';
  element('storage-notice').hidden = state.storageAvailable;
  element('storage-notice').textContent = state.storageAvailable ? '' : 'Сохранение недоступно. Изменения действуют до закрытия страницы.';
}
const loader = createLoader(state, render, () => navigator.onLine);
async function load() {
  if (!id) { render(); return; }
  await loader.run(signal => getBook(id, { signal }), book => { state.book = book; state.status = 'success'; });
}
main.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'retry') load();
  if (action === 'toggle' && state.book) {
    state.wishlist = state.wishlist.some(book => book.id === state.book.id)
      ? state.wishlist.filter(book => book.id !== state.book.id) : [...state.wishlist, state.book];
    state.storageAvailable = saveApiPreferences(state);
    render();
  }
});
window.addEventListener('pagehide', loader.cancel);
load();
