import { books } from './data/books.js';
import { defaultFilters, normalizeFilters, toggleWishlist } from './lib/books.js';
import { render } from './ui/render.js';
import { loadPreferences, savePreferences } from './storage.js';

const state = loadPreferences(books);
const view = {
  main: document.querySelector('main'),
  form: document.querySelector('.filters form'),
  list: document.querySelector('[data-book-list]'),
  template: document.querySelector('#book-card-template'),
  count: document.querySelector('[data-result-count]'),
  empty: document.querySelector('[data-empty]'),
  wishlist: document.querySelector('[data-wishlist-list]'),
  wishlistCount: document.querySelector('[data-wishlist-count]'),
  wishlistEmpty: document.querySelector('[data-wishlist-empty]'),
  wishlistTitle: document.querySelector('#wishlist-title'),
  storageNotice: document.querySelector('[data-storage-notice]'),
};

function update() {
  state.storageAvailable = savePreferences(state);
  render(state, books, view);
}

view.form.addEventListener('input', () => {
  const fields = view.form.elements;
  state.filters = normalizeFilters({
    query: fields.q.value, genre: fields.genre.value,
    sort: fields.sort.value, available: fields.available.checked,
  });
  update();
});
view.form.addEventListener('submit', event => event.preventDefault());
view.form.addEventListener('reset', event => {
  event.preventDefault();
  state.filters = defaultFilters();
  update();
});

view.main.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button[data-action]');
  if (!button || !view.main.contains(button) || !books.some(book => book.id === button.dataset.id)) return;
  const id = button.dataset.id;
  if (button.dataset.action === 'toggle') state.wishlist = toggleWishlist(state.wishlist, id);
  else if (button.dataset.action === 'remove') state.wishlist = state.wishlist.filter(item => item !== id);
  else return;
  update();
});

update();
