const { defineConfig } = require('eslint/config');
// @ts-ignore
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
]);
