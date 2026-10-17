export const bookPath = (id: string): string => `/books/${encodeURIComponent(id)}`;
export const editBookPath = (id: string): string => `${bookPath(id)}/edit`;
