import type { PageInfo } from '../../types';
export function readPage(search: string): PageInfo {
  const params = new URLSearchParams(search);
  return { view: params.get('view') === 'loan' ? 'loan' : params.get('view') === 'book' || params.has('id') ? 'book' : 'catalog', id: params.get('id') };
}
export const bookHref = (id: string): string => '?view=book&id=' + encodeURIComponent(id);
