import js from '@eslint/js';
import next from 'eslint-config-next';
import airbnbBase from 'eslint-config-airbnb-base';
import prettier from 'eslint-config-prettier';

import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  js.configs.recommended,
  next,
  airbnbBase,
  prettier,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      react,
      reactHooks,
      jsxA11y,
      import: importPlugin,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      prettier,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      reactHooks,
      jsxA11y,
      import: importPlugin,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      prettier,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
      'import/extensions': 'off',
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      'import/prefer-default-export': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'import/no-cycle': 'off',
      'no-plusplus': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
