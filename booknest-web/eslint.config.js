import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  { files: ['**/*.{ts,tsx}'], extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: { ...reactHooks.configs.recommended.rules, 'react-refresh/only-export-components': ['error', { allowConstantExport: true }], '@typescript-eslint/no-explicit-any': 'error' } },
  { files: ['src/components/**/*.tsx', 'src/App.tsx'], rules: {
    'no-restricted-globals': ['error', 'document', 'fetch'],
    'no-restricted-syntax': ['error', { selector: 'MemberExpression[property.name="document"]', message: 'Use React refs, not document.' }, { selector: 'JSXAttribute[name.name="key"][value.expression.name="index"]', message: 'Use a stable domain ID.' }],
  } },
);
