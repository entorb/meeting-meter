// Vitest setup file

import { vi } from 'vitest'

// Suppress Vue warnings about unresolved Quasar components
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Failed to resolve component')) return
  originalWarn(...args)
}

// Mock localStorage (Node 25 exposes a broken localStorage in jsdom)
// Uses Storage.prototype so vi.spyOn(Storage.prototype, ...) works in tests
const _store = new Map<string, string>()
Storage.prototype.getItem = (key: string) => _store.get(key) ?? null
Storage.prototype.setItem = (key: string, value: string) => {
  _store.set(key, String(value))
}
Storage.prototype.removeItem = (key: string) => {
  _store.delete(key)
}
Storage.prototype.clear = () => {
  _store.clear()
}
Storage.prototype.key = (index: number) => [..._store.keys()][index] ?? null
Object.defineProperty(Storage.prototype, 'length', {
  get: () => _store.size,
  configurable: true
})
Object.defineProperty(globalThis, 'localStorage', {
  value: Object.create(Storage.prototype),
  writable: true,
  configurable: true
})

// Mock matchMedia
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
