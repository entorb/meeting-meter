import pluginVue from 'eslint-plugin-vue'
import pluginCypress from 'eslint-plugin-cypress'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import pluginPrettier from 'eslint-plugin-prettier'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  // Global ignores
  {
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  // TypeScript files
  {
    files: ['**/*.{ts,mts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },

  // Vue files with essential config and TypeScript support
  ...pluginVue.configs['flat/essential'].map((config) => ({
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        parser: tsParser,
      },
    },
    plugins: {
      ...config.plugins,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...config.rules,
      // Add TypeScript rules for Vue files
      '@typescript-eslint/no-unused-vars': 'error',
    },
  })),

  // Generated TypeScript files - relax rules (must come after main TS config)
  {
    files: ['**/components.d.ts', '**/typed-router.d.ts', '**/env.d.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Cypress files
  {
    files: ['cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}', 'cypress/support/**/*.{js,ts,jsx,tsx}'],
    plugins: {
      cypress: pluginCypress,
    },
    rules: {
      ...pluginCypress.configs.recommended.rules,
    },
  },

  // Prettier enforcement
  {
    files: ['**/*.{ts,tsx,js,jsx,vue}'],
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Apply skip formatting last
  skipFormatting,
]
