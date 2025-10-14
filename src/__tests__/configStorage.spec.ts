import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadConfig, saveConfig } from '@/services/configStorage'
import * as localStorageHelper from '@/utils/localStorageHelper'
import { STORAGE_KEYS } from '@/utils/constants'
import type { Config } from '@/types'

// Mock dependencies
vi.mock('@/utils/localStorageHelper', () => ({
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn()
}))

describe('configStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadConfig', () => {
    it('returns null when no config is stored', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(null)

      const result = loadConfig()

      expect(result).toBeNull()
      expect(localStorageHelper.safeGetItem).toHaveBeenCalledWith(STORAGE_KEYS.CONFIG)
    })

    it('loads valid config from storage', () => {
      const validConfig: Config = {
        group1HourlyRate: 75,
        group2HourlyRate: 45,
        workingHoursPerDay: 8
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(validConfig))

      const result = loadConfig()

      expect(result).toEqual(validConfig)
    })

    it('returns null when stored data is invalid JSON', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue('invalid json {')

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when stored data is not an object', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify('not an object'))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when group1HourlyRate is missing', () => {
      const invalidConfig = {
        group2HourlyRate: 45,
        workingHoursPerDay: 8
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(invalidConfig))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when group2HourlyRate is missing', () => {
      const invalidConfig = {
        group1HourlyRate: 75,
        workingHoursPerDay: 8
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(invalidConfig))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when workingHoursPerDay is missing', () => {
      const invalidConfig = {
        group1HourlyRate: 75,
        group2HourlyRate: 45
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(invalidConfig))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when group1HourlyRate is not a number', () => {
      const invalidConfig = {
        group1HourlyRate: '75',
        group2HourlyRate: 45,
        workingHoursPerDay: 8
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(invalidConfig))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when group2HourlyRate is not a number', () => {
      const invalidConfig = {
        group1HourlyRate: 75,
        group2HourlyRate: '45',
        workingHoursPerDay: 8
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(invalidConfig))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when workingHoursPerDay is not a number', () => {
      const invalidConfig = {
        group1HourlyRate: 75,
        group2HourlyRate: 45,
        workingHoursPerDay: '8'
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(invalidConfig))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('returns null when any field is NaN', () => {
      const invalidConfig = {
        group1HourlyRate: NaN,
        group2HourlyRate: 45,
        workingHoursPerDay: 8
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(invalidConfig))

      const result = loadConfig()

      expect(result).toBeNull()
    })

    it('accepts config with zero values', () => {
      const validConfig: Config = {
        group1HourlyRate: 0,
        group2HourlyRate: 0,
        workingHoursPerDay: 8
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(validConfig))

      const result = loadConfig()

      expect(result).toEqual(validConfig)
    })

    it('accepts config with decimal values', () => {
      const validConfig: Config = {
        group1HourlyRate: 75.5,
        group2HourlyRate: 45.25,
        workingHoursPerDay: 7.5
      }
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(JSON.stringify(validConfig))

      const result = loadConfig()

      expect(result).toEqual(validConfig)
    })

    it('returns null when safeGetItem throws', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = loadConfig()

      expect(result).toBeNull()
    })
  })

  describe('saveConfig', () => {
    it('saves config to storage', () => {
      const config: Config = {
        group1HourlyRate: 75,
        group2HourlyRate: 45,
        workingHoursPerDay: 8
      }

      saveConfig(config)

      expect(localStorageHelper.safeSetItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CONFIG,
        JSON.stringify(config)
      )
    })

    it('saves config with zero values', () => {
      const config: Config = {
        group1HourlyRate: 0,
        group2HourlyRate: 0,
        workingHoursPerDay: 8
      }

      saveConfig(config)

      expect(localStorageHelper.safeSetItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CONFIG,
        JSON.stringify(config)
      )
    })

    it('saves config with decimal values', () => {
      const config: Config = {
        group1HourlyRate: 75.5,
        group2HourlyRate: 45.25,
        workingHoursPerDay: 7.5
      }

      saveConfig(config)

      expect(localStorageHelper.safeSetItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CONFIG,
        JSON.stringify(config)
      )
    })

    it('handles safeSetItem failure gracefully', () => {
      vi.mocked(localStorageHelper.safeSetItem).mockImplementation(() => {
        throw new Error('Storage full')
      })

      const config: Config = {
        group1HourlyRate: 75,
        group2HourlyRate: 45,
        workingHoursPerDay: 8
      }

      // Should not throw
      expect(() => saveConfig(config)).not.toThrow()
    })
  })
})
