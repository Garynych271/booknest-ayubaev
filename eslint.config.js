import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', '.audit-tools/**', 'docs/**'] },
  js.configs.recommended,
  {
    files: ['main.js', 'storage.js', 'ui/**/*.js', 'lib/**/*.js', 'data/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    rules: {
      'no-var': 'error', 'prefer-const': 'error', eqeqeq: 'error', 'no-console': 'error',
      'no-restricted-syntax': ['error', { selector: 'AssignmentExpression[left.property.name="innerHTML"]', message: 'Use textContent or DOM nodes.' }],
    },
  },
  { files: ['lib/**/*.js'], rules: { 'no-restricted-globals': ['error', 'document', 'window', 'localStorage', 'fetch'] } },
  { files: ['tests/**/*.js', 'tools/**/*.mjs'], languageOptions: { globals: globals.node } },
];
