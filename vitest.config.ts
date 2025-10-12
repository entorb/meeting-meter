import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        reporter: ['text', 'lcov']
      },
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**', 'node_modules/'],
      root: fileURLToPath(new URL('./', import.meta.url))
    }
  })
)
