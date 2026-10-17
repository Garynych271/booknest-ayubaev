import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = 'booknest-web/src';
const text = file => readFile(file, 'utf8');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? walk(path.join(directory, entry.name))
    : [path.join(directory, entry.name)]));
  return nested.flat();
}

const files = await walk(root);
const componentFiles = files.filter(file => file.endsWith('.tsx'));
const componentSources = await Promise.all(componentFiles.map(text));
const app = await text(`${root}/app/App.tsx`);
const form = await text(`${root}/features/book-form/BookForm.tsx`);
const fields = await text(`${root}/features/book-form/BookFormFields.tsx`);
const schema = await text(`${root}/shared/validation/bookFormSchema.ts`);
const contexts = (await Promise.all(files.filter(file => file.includes(`${path.sep}contexts${path.sep}`)).map(text))).join('\n');
const packageJson = JSON.parse(await text('booknest-web/package.json'));
const maxComponent = componentFiles.map((file, index) => ({
  file: file.replaceAll('\\', '/'), lines: componentSources[index].split(/\r?\n/).length,
})).sort((a, b) => b.lines - a.lines)[0];
const routes = ['/books', 'books/:bookId', 'books/new', 'books/:bookId/edit', 'wishlist', 'login', '*'];
const checks = [
  { name: 'required nested routes', passed: routes.every(route => app.includes(`path="${route}"`) || (route === '/books' && app.includes('to="/books"'))) && app.includes('AppLayout') },
  { name: 'protected wishlist route', passed: app.includes('<RequireAuth><WishlistPage') },
  { name: 'no fetch in React components', passed: componentSources.every(source => !/\bfetch\s*\(/.test(source)) },
  { name: 'internal navigation uses Router primitives', passed: componentSources.every(source => !/<a\s[^>]*href=["']\//.test(source)) },
  { name: 'one create and edit form', passed: form.includes("mode: 'create' | 'edit'") && app.includes('BookFormPage mode="create"') && app.includes('BookFormPage mode="edit"') },
  { name: 'react-hook-form with Zod resolver', passed: form.includes('useForm<BookFormValues>') && form.includes('zodResolver(bookFormSchema)') },
  { name: 'schema type inferred with eight fields', passed: schema.includes('z.infer<typeof bookFormSchema>') && (fields.match(/register\('/g) ?? []).length === 8 },
  { name: 'cross-field validation', passed: schema.includes('.superRefine(') && schema.includes("path: ['dueDate']") },
  { name: 'Context excludes page state', passed: !/wishlist|filters|catalog|searchResult/i.test(contexts) },
  { name: 'component files at most 150 lines', passed: maxComponent.lines <= 150, evidence: maxComponent },
  { name: 'required runtime dependencies', passed: ['react-router-dom', 'react-hook-form', 'zod', '@hookform/resolvers'].every(name => packageJson.dependencies[name]) },
];
const result = { measuredAt: new Date().toISOString(), checks, passed: checks.filter(check => check.passed).length, total: checks.length };
await writeFile('docs/lab6b/static-checks.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (result.passed !== result.total) process.exitCode = 1;
