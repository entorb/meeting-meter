import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        ...configDefaults.exclude,
        'e2e/**',
        'src/__tests__/**',
        '**/*.spec.ts',
        '**/*.test.ts'
      ]
    },
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**', 'node_modules/'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    setupFiles: ['./src/__tests__/setup.ts'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    },
    server: {
      deps: {
        inline: ['vuetify']
      }
    }
  }
})
