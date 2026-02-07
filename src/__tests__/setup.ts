import { config } from '@vue/test-utils'
import { vi, beforeAll, afterAll } from 'vitest'

// Mock CSS imports globally - must be before any component imports
vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))
vi.mock('*.sass', () => ({}))
vi.mock('vuetify/styles', () => ({}))

// Stub components that might cause issues in tests
config.global.stubs = {
  teleport: true,
  transition: false,
  'transition-group': false
}

// Mock window.matchMedia - needed for responsive Vuetify components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock ResizeObserver - needed for Vuetify components that observe size changes
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver - needed for lazy loading and visibility detection
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: readonly number[] = []

  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn(cb => {
  cb(0)
  return 0
})
global.cancelAnimationFrame = vi.fn()

// Mock scrollTo - often used by UI components
window.scrollTo = vi.fn()

// Mock localStorage if not available
if (typeof window.localStorage === 'undefined') {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })
}

// Mock sessionStorage if not available
if (typeof window.sessionStorage === 'undefined') {
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true
  })
}

// Suppress console warnings during tests (optional - comment out if you want to see warnings)
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  console.warn = vi.fn(message => {
    // Filter out known Vuetify/Vue warnings that are expected in tests
    if (
      typeof message === 'string' &&
      (message.includes('[Vuetify]') ||
        message.includes('Vue warn') ||
        message.includes('Extraneous non-props'))
    ) {
      return
    }
    originalWarn(message)
  })

  console.error = vi.fn(message => {
    // Filter out known errors that are expected in tests
    if (
      typeof message === 'string' &&
      (message.includes('[Vuetify]') ||
        message.includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return
    }
    originalError(message)
  })
})

afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})
