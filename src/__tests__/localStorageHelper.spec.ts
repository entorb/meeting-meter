import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isLocalStorageAvailable,
  safeGetItem,
  safeSetItem,
  safeRemoveItem
} from '@/utils/localStorageHelper'

describe('localStorageHelper', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true)
    })

    it('returns false when localStorage.setItem throws', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(isLocalStorageAvailable()).toBe(false)

      setItemSpy.mockRestore()
    })

    it('returns false when localStorage.removeItem throws', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
      removeItemSpy.mockImplementation(() => {
        throw new Error('Error')
      })

      expect(isLocalStorageAvailable()).toBe(false)

      removeItemSpy.mockRestore()
    })
  })

  describe('safeGetItem', () => {
    it('returns stored value when it exists', () => {
      localStorage.setItem('test-key', 'test-value')

      expect(safeGetItem('test-key')).toBe('test-value')
    })

    it('returns null when key does not exist', () => {
      expect(safeGetItem('non-existent-key')).toBeNull()
    })

    it('returns null when localStorage is not available', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(safeGetItem('test-key')).toBeNull()

      setItemSpy.mockRestore()
    })

    it('returns null when getItem throws', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
      getItemSpy.mockImplementation(() => {
        throw new Error('Error reading from localStorage')
      })

      expect(safeGetItem('test-key')).toBeNull()

      getItemSpy.mockRestore()
    })
  })

  describe('safeSetItem', () => {
    it('stores value and returns true when successful', () => {
      const result = safeSetItem('test-key', 'test-value')

      expect(result).toBe(true)
      expect(localStorage.getItem('test-key')).toBe('test-value')
    })

    it('returns false when localStorage is not available', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      // Make isLocalStorageAvailable fail
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const result = safeSetItem('test-key', 'test-value')

      expect(result).toBe(false)

      setItemSpy.mockRestore()
    })

    it('returns false when setItem throws', () => {
      // Mock only setItem to fail on the actual call (not the availability check)
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation((key: string) => {
        // Let the test call in isLocalStorageAvailable succeed
        if (key === '__storage_test__') {
          return
        }
        // But fail on our actual call
        throw new Error('QuotaExceededError')
      })

      const result = safeSetItem('test-key', 'test-value')

      expect(result).toBe(false)

      setItemSpy.mockRestore()
    })

    it('handles empty string values', () => {
      const result = safeSetItem('empty-key', '')

      expect(result).toBe(true)
      expect(localStorage.getItem('empty-key')).toBe('')
    })

    it('overwrites existing values', () => {
      safeSetItem('test-key', 'old-value')
      const result = safeSetItem('test-key', 'new-value')

      expect(result).toBe(true)
      expect(localStorage.getItem('test-key')).toBe('new-value')
    })
  })

  describe('safeRemoveItem', () => {
    it('removes item and returns true when successful', () => {
      localStorage.setItem('test-key', 'test-value')

      const result = safeRemoveItem('test-key')

      expect(result).toBe(true)
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('returns true even when key does not exist', () => {
      const result = safeRemoveItem('non-existent-key')

      expect(result).toBe(true)
    })

    it('returns false when localStorage is not available', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const result = safeRemoveItem('test-key')

      expect(result).toBe(false)

      setItemSpy.mockRestore()
    })

    it('returns false when removeItem throws', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
      removeItemSpy.mockImplementation((key: string) => {
        // Let the test call in isLocalStorageAvailable succeed
        if (key === '__storage_test__') {
          return
        }
        // But fail on our actual call
        throw new Error('Error removing from localStorage')
      })

      const result = safeRemoveItem('test-key')

      expect(result).toBe(false)

      removeItemSpy.mockRestore()
    })
  })
})
