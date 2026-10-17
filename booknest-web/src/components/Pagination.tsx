import { Button } from './Button';
export interface PaginationProps { page: number; totalPages: number; onChange: (page: number) => void }
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return <nav className="pagination" aria-label="Страницы каталога">
    <Button data-action="previous" disabled={page <= 1} onClick={() => onChange(page - 1)}>Назад</Button>
    <span data-page>Страница {page} из {totalPages}</span>
    <Button data-action="next" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Вперёд</Button>
  </nav>;
}
