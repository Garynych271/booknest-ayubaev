import { defaultFilters, normalizeFilters } from './lib/books.js';
import { searchBooks, PAGE_SIZE, MIN_QUERY } from './api/books.js';
import { createLoader } from './lib/api-state.js';
import { render } from './ui/render.js';
import { loadApiPreferences, saveApiPreferences } from './api-storage.js';

const state = { ...loadApiPreferences(), books: [], total: 0, status: 'empty', loading: false, error: '' };
const view = {
  main: document.querySelector('main'), form: document.querySelector('.filters form'),
  list: document.querySelector('[data-book-list]'), template: document.querySelector('#book-card-template'),
  count: document.querySelector('[data-result-count]'), empty: document.querySelector('[data-empty]'),
  wishlist: document.querySelector('[data-wishlist-list]'), wishlistCount: document.querySelector('[data-wishlist-count]'),
  wishlistEmpty: document.querySelector('[data-wishlist-empty]'), wishlistTitle: document.querySelector('#wishlist-title'),
  storageNotice: document.querySelector('[data-storage-notice]'),
};
function update() {
  state.storageAvailable = saveApiPreferences(state);
  render(state, view);
}
const loader = createLoader(state, update, () => navigator.onLine);
let timer;
async function search() {
  clearTimeout(timer);
  if (state.filters.query.trim().length < MIN_QUERY) {
    loader.cancel();
    state.status = 'empty';
    state.books = [];
    state.total = 0;
    update();
    return;
  }
  let correctedPage = false;
  await loader.run(signal => searchBooks(state.filters, state.page, { signal }), result => {
    state.books = result.books;
    state.total = result.total;
    state.skipped = result.skipped;
    const last = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
    if (state.page > last) { state.page = last; correctedPage = result.total > 0; }
    state.status = result.books.length ? 'success' : 'empty';
  });
  if (correctedPage) await search();
}
view.form.addEventListener('input', event => {
  const fields = view.form.elements;
  state.filters = normalizeFilters({ query: fields.q.value, genre: fields.genre.value, sort: fields.sort.value, available: fields.available.checked });
  state.page = 1;
  clearTimeout(timer);
  loader.cancel();
  if (event.target === fields.q && state.filters.query.trim().length >= MIN_QUERY) {
    state.status = 'loading';
    state.loading = true;
    update();
    timer = setTimeout(search, 350);
  } else search();
});
view.form.addEventListener('submit', event => { event.preventDefault(); search(); });
view.form.addEventListener('reset', event => {
  event.preventDefault();
  state.filters = defaultFilters();
  state.page = 1;
  search();
});
view.main.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button[data-action]');
  if (!button || !view.main.contains(button)) return;
  const { action, id } = button.dataset;
  if (action === 'retry') { search(); return; }
  if (action === 'previous' || action === 'next') {
    const page = state.page + (action === 'next' ? 1 : -1);
    if (state.loading || page < 1 || page > Math.ceil(state.total / PAGE_SIZE)) return;
    state.page = page;
    search();
    return;
  }
  if (action === 'remove') state.wishlist = state.wishlist.filter(book => book.id !== id);
  else if (action === 'toggle') {
    const book = state.books.find(item => item.id === id);
    if (!book) return;
    state.wishlist = state.wishlist.some(item => item.id === id)
      ? state.wishlist.filter(item => item.id !== id) : [...state.wishlist, book];
  } else return;
  update();
});
window.addEventListener('pagehide', () => { clearTimeout(timer); loader.cancel(); });
search();
