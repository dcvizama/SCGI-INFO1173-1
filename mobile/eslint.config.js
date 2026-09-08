const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    files: ['**/__tests__/**/*.js', '**/*-test.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  { ignores: ['dist/*', 'node_modules/*', '.expo/*'] },
]);
