import js from '@eslint/js';
import globals from 'globals';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  js.configs.recommended,

  // Global overrides for all JS files
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Enforce strict equality
      eqeqeq: ['error', 'always', { null: 'never' }],

      // No unused variables (unless prefixed with _)
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // No console.log in production code
      'no-console': 'warn',

      // Consistent return
      'consistent-return': 'error',

      // Prefer const over let when variable is never reassigned
      'prefer-const': 'error',

      // Require radix parameter in parseInt
      radix: 'error',

      // No shadowed variables
      'no-shadow': 'warn',
    },
  },

  // Browser environment (js/ folder)
  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Node.js environment (server.mjs, config files)
  {
    files: ['server.mjs', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
