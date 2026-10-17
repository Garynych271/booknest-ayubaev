import type { Filters } from '../../types';
import { genres, sorts, isGenre, isSort } from '../../shared/lib/preferences';
import { Button } from '../../shared/components/Button';
export interface FiltersPanelProps { filters: Filters; onChange: (filters: Filters) => void; onReset: () => void; storageAvailable: boolean }
export function FiltersPanel({ filters, onChange, onReset, storageAvailable }: FiltersPanelProps) {
  return <section className="filters" aria-labelledby="filters-title">
    <h2 id="filters-title">Фильтры каталога</h2>
    <form onSubmit={event => event.preventDefault()} onReset={event => { event.preventDefault(); onReset(); }}>
      {!storageAvailable && <p className="storage-notice" role="status" data-storage-notice>Сохранение недоступно. Изменения действуют до закрытия страницы.</p>}
      <p><label htmlFor="search">Поиск по названию или автору</label><input type="search" id="search" name="q" maxLength={80} placeholder="Например, Solaris" value={filters.query} onChange={event => onChange({ ...filters, query: event.target.value })} /></p>
      <p><label htmlFor="genre">Жанр</label><select id="genre" name="genre" value={filters.genre} onChange={event => { const genre = event.target.value; if (isGenre(genre)) onChange({ ...filters, genre }); }}>{Object.entries(genres).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></p>
      <p><label htmlFor="sort">Сортировка</label><select id="sort" name="sort" value={filters.sort} onChange={event => { const sort = event.target.value; if (isSort(sort)) onChange({ ...filters, sort }); }}>{Object.entries(sorts).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></p>
      <p><input type="checkbox" id="available" name="available" checked={filters.available} onChange={event => onChange({ ...filters, available: event.target.checked })} /><label htmlFor="available">Только открытый электронный доступ</label></p>
      <Button type="reset">Сбросить фильтры</Button>
    </form>
  </section>;
}
