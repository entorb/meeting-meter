import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatCurrency,
  toNumber,
  parseTimeInput,
  isTimeBeforeNow,
  validateIntegerInput,
  sanitizeIntegerInput,
  formatStartTime,
  getConfigFromForm,
  formatDuration,
  helperStatsDataRead,
  helperStatsDataWrite
} from '@/utils/helpers'

describe('Helper Functions', () => {
  describe('helperStatsDataRead', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('returns accesscounts on successful fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accesscounts: 42 })
      })

      const result = await helperStatsDataRead()
      expect(result).toBe(42)
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('action=read'))
    })

    it('returns 0 when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      })

      const result = await helperStatsDataRead()
      expect(result).toBe(0)
    })

    it('returns 0 when accesscounts is not a number', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accesscounts: 'invalid' })
      })

      const result = await helperStatsDataRead()
      expect(result).toBe(0)
    })

    it('returns 0 when accesscounts is negative', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accesscounts: -5 })
      })

      const result = await helperStatsDataRead()
      expect(result).toBe(0)
    })

    it('returns 0 when accesscounts is missing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
      })

      const result = await helperStatsDataRead()
      expect(result).toBe(0)
    })

    it('returns 0 on fetch error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await helperStatsDataRead()
      expect(result).toBe(0)
    })

    it('returns 0 when accesscounts is 0', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accesscounts: 0 })
      })

      const result = await helperStatsDataRead()
      expect(result).toBe(0)
    })
  })

  describe('helperStatsDataWrite', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('calls fetch with correct URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({})

      await helperStatsDataWrite()
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('action=write'))
    })

    it('silently handles fetch errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(helperStatsDataWrite()).resolves.toBeUndefined()
    })

    it('completes successfully on successful fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await expect(helperStatsDataWrite()).resolves.toBeUndefined()
    })
  })

  describe('formatDuration', () => {
    it('formats milliseconds into HH:MM:SS', () => {
      expect(formatDuration(0)).toBe('0:00:00')
      expect(formatDuration(1000)).toBe('0:00:01') // 1 second
      expect(formatDuration(60000)).toBe('0:01:00') // 1 minute
      expect(formatDuration(3600000)).toBe('1:00:00') // 1 hour
    })

    it('handles complex durations', () => {
      // 1 hour, 23 minutes, 45 seconds
      const ms = 1 * 3600000 + 23 * 60000 + 45 * 1000
      expect(formatDuration(ms)).toBe('1:23:45')
    })

    it('pads numbers correctly', () => {
      // 1 hour, 2 minutes, 3 seconds
      const ms = 1 * 3600000 + 2 * 60000 + 3 * 1000
      expect(formatDuration(ms)).toBe('1:02:03')
    })

    it('handles multi-hour durations', () => {
      // 10 hours, 5 minutes, 9 seconds
      const ms = 10 * 3600000 + 5 * 60000 + 9 * 1000
      expect(formatDuration(ms)).toBe('10:05:09')
    })
  })

  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(123.45)).toBe('123 €')
      expect(formatCurrency(1000)).toBe('1000 €')
    })

    it('rounds to nearest integer', () => {
      expect(formatCurrency(123.7)).toBe('124 €')
      expect(formatCurrency(123.2)).toBe('123 €')
      expect(formatCurrency(123.5)).toBe('124 €')
    })

    it('handles zero and negative numbers', () => {
      expect(formatCurrency(0)).toBe('0 €')
      expect(formatCurrency(-50.6)).toBe('-51 €')
      expect(formatCurrency(-50.4)).toBe('-50 €')
    })

    it('handles large numbers', () => {
      expect(formatCurrency(999999.99)).toBe('1000000 €')
    })
  })

  describe('toNumber', () => {
    it('converts valid strings to numbers', () => {
      expect(toNumber('123', 0)).toBe(123)
      expect(toNumber('123.45', 0)).toBe(123.45)
      expect(toNumber('0', 10)).toBe(0)
      expect(toNumber('-42.5', 0)).toBe(-42.5)
    })

    it('returns default for invalid inputs', () => {
      expect(toNumber('', 10)).toBe(10)
      expect(toNumber('abc', 5)).toBe(5)
      expect(toNumber(null, 15)).toBe(15)
      expect(toNumber(undefined, 20)).toBe(20)
    })

    it('passes through valid numbers', () => {
      expect(toNumber(42, 0)).toBe(42)
      expect(toNumber(0, 10)).toBe(0)
      expect(toNumber(-5.5, 0)).toBe(-5.5)
    })
  })

  describe('parseTimeInput', () => {
    it('parses HH:MM format correctly', () => {
      expect(parseTimeInput('14:30')).toEqual({ hours: 14, minutes: 30 })
      expect(parseTimeInput('09:05')).toEqual({ hours: 9, minutes: 5 })
      expect(parseTimeInput('00:00')).toEqual({ hours: 0, minutes: 0 })
      expect(parseTimeInput('23:59')).toEqual({ hours: 23, minutes: 59 })
    })

    it('parses HHMM format correctly', () => {
      expect(parseTimeInput('1430')).toEqual({ hours: 14, minutes: 30 })
      expect(parseTimeInput('0905')).toEqual({ hours: 9, minutes: 5 })
      expect(parseTimeInput('0000')).toEqual({ hours: 0, minutes: 0 })
      expect(parseTimeInput('2359')).toEqual({ hours: 23, minutes: 59 })
    })

    it('returns null for invalid hours', () => {
      expect(parseTimeInput('25:30')).toBeNull()
      expect(parseTimeInput('24:00')).toBeNull()
      expect(parseTimeInput('-1:30')).toBeNull()
      expect(parseTimeInput('2530')).toBeNull()
    })

    it('returns null for invalid minutes', () => {
      expect(parseTimeInput('14:65')).toBeNull()
      expect(parseTimeInput('14:60')).toBeNull()
      expect(parseTimeInput('14:-1')).toBeNull()
      expect(parseTimeInput('1465')).toBeNull()
    })

    it('returns null for invalid formats', () => {
      expect(parseTimeInput('abc')).toBeNull()
      expect(parseTimeInput('14')).toBeNull()
      expect(parseTimeInput('12345')).toBeNull() // too long
      expect(parseTimeInput('12:34:56')).toBeNull() // too many parts
      expect(parseTimeInput('123')).toBeNull() // too short
      expect(parseTimeInput('1a30')).toBeNull() // non-digit in HHMM format
    })

    it('handles edge cases and whitespace', () => {
      expect(parseTimeInput(' 14:30 ')).toEqual({ hours: 14, minutes: 30 })
      expect(parseTimeInput('  14:30  ')).toEqual({ hours: 14, minutes: 30 })
    })

    it('handles empty strings in HH:MM format', () => {
      expect(parseTimeInput(':')).toEqual({ hours: 0, minutes: 0 })
      expect(parseTimeInput(':30')).toEqual({ hours: 0, minutes: 30 })
      expect(parseTimeInput('14:')).toEqual({ hours: 14, minutes: 0 })
    })
  })

  describe('isTimeBeforeNow', () => {
    it('correctly identifies past times', () => {
      const now = new Date()
      const pastHour = now.getHours() - 1
      const currentMinute = now.getMinutes()

      if (pastHour >= 0) {
        expect(isTimeBeforeNow(pastHour, currentMinute)).toBe(true)
      }
    })

    it('correctly identifies future times', () => {
      const now = new Date()
      const futureHour = (now.getHours() + 1) % 24
      const currentMinute = now.getMinutes()

      // Only test if we're not crossing midnight
      if (futureHour > now.getHours()) {
        expect(isTimeBeforeNow(futureHour, currentMinute)).toBe(false)
      }
    })

    it('handles edge cases', () => {
      // Test with a time that's definitely in the past - early morning hours
      const now = new Date()
      const currentHour = now.getHours()

      // Test a time that's clearly before now (only if it's after 6 AM)
      if (currentHour > 6) {
        expect(isTimeBeforeNow(6, 0)).toBe(true) // 6 AM is before current time
      }

      // Test midnight - this should always be considered "yesterday" so before now
      expect(isTimeBeforeNow(0, 0)).toBe(true) // midnight is before current time
    })

    it('handles boundary times', () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      // Test same hour, future minute
      if (currentMinute < 59) {
        expect(isTimeBeforeNow(currentHour, currentMinute + 1)).toBe(false)
      }

      // Test same hour, past minute
      if (currentMinute > 0) {
        expect(isTimeBeforeNow(currentHour, currentMinute - 1)).toBe(true)
      }
    })
  })

  describe('validateIntegerInput', () => {
    it('validates and returns values within bounds', () => {
      expect(validateIntegerInput('5', 1, 10, 1)).toBe(5)
      expect(validateIntegerInput('1', 1, 10, 5)).toBe(1)
      expect(validateIntegerInput('10', 1, 10, 5)).toBe(10)
    })

    it('clamps values below minimum', () => {
      expect(validateIntegerInput('0', 1, 10, 1)).toBe(1)
      // '-5' gets sanitized to '5' (minus sign stripped), then clamped to min 1
      expect(validateIntegerInput('-5', 1, 10, 5)).toBe(5)
      expect(validateIntegerInput('0', 5, 10, 7)).toBe(5)
    })

    it('clamps values above maximum', () => {
      expect(validateIntegerInput('15', 1, 10, 1)).toBe(10)
      expect(validateIntegerInput('100', 1, 10, 5)).toBe(10)
      expect(validateIntegerInput('15', 5, 10, 7)).toBe(10)
    })

    it('handles invalid input', () => {
      // sanitizeIntegerInput('abc') returns '0', parseInt('0') = 0, so it's clamped to min bound 1
      expect(validateIntegerInput('abc', 1, 10, 5)).toBe(1) // 'abc' -> '0' -> 0 -> clamped to min 1
      expect(validateIntegerInput('', 1, 10, 3)).toBe(1) // '' -> '0' -> 0 -> clamped to min 1
    })

    it('strips non-digit characters and validates', () => {
      expect(validateIntegerInput('5.5', 1, 10, 1)).toBe(10) // '5.5' -> '55' -> 55 -> clamped to max 10
      expect(validateIntegerInput('1a2b3', 1, 100, 1)).toBe(100) // '1a2b3' -> '123' -> 123 -> clamped to max 100
      expect(validateIntegerInput('1a2b3', 1, 200, 1)).toBe(123) // '1a2b3' -> '123' -> 123 (within bounds)
    })

    it('uses default min and max when not provided', () => {
      expect(validateIntegerInput('5')).toBe(5)
      expect(validateIntegerInput('0')).toBe(0)
      // '-5' gets sanitized to '5' (non-digits stripped), which is valid and within default bounds
      expect(validateIntegerInput('-5')).toBe(5)
    })

    it('handles zero as a valid value', () => {
      expect(validateIntegerInput('0', 0, 10, 5)).toBe(0)
    })
  })

  describe('sanitizeIntegerInput', () => {
    it('strips non-digit characters', () => {
      expect(sanitizeIntegerInput('123')).toBe('123')
      expect(sanitizeIntegerInput('1a2b3c')).toBe('123')
      expect(sanitizeIntegerInput('12.34')).toBe('1234')
      expect(sanitizeIntegerInput('abc')).toBe('0')
      expect(sanitizeIntegerInput('!@#$%')).toBe('0')
      expect(sanitizeIntegerInput('12-34')).toBe('1234')
    })

    it('removes leading zeros but keeps single zero', () => {
      expect(sanitizeIntegerInput('007')).toBe('7')
      expect(sanitizeIntegerInput('0000')).toBe('0')
      expect(sanitizeIntegerInput('0')).toBe('0')
      expect(sanitizeIntegerInput('00123')).toBe('123')
    })

    it('handles empty input', () => {
      expect(sanitizeIntegerInput('')).toBe('0')
      expect(sanitizeIntegerInput('   ')).toBe('0')
    })

    it('handles mixed valid and invalid characters', () => {
      expect(sanitizeIntegerInput('1.2.3')).toBe('123')
      expect(sanitizeIntegerInput('a1b2c3d')).toBe('123')
    })
  })

  describe('formatStartTime', () => {
    it('formats time correctly with zero padding', () => {
      const date1 = new Date(2025, 0, 1, 9, 5, 0) // 09:05
      expect(formatStartTime(date1)).toBe('09:05')

      const date2 = new Date(2025, 0, 1, 14, 30, 0) // 14:30
      expect(formatStartTime(date2)).toBe('14:30')

      const date3 = new Date(2025, 0, 1, 0, 0, 0) // 00:00
      expect(formatStartTime(date3)).toBe('00:00')

      const date4 = new Date(2025, 0, 1, 1, 1, 0) // 01:01
      expect(formatStartTime(date4)).toBe('01:01')
    })

    it('handles edge cases', () => {
      const date1 = new Date(2025, 0, 1, 23, 59, 59) // 23:59
      expect(formatStartTime(date1)).toBe('23:59')

      const date2 = new Date(2025, 0, 1, 12, 0, 0) // 12:00
      expect(formatStartTime(date2)).toBe('12:00')
    })

    it('ignores seconds', () => {
      const date = new Date(2025, 0, 1, 10, 30, 45) // 10:30:45
      expect(formatStartTime(date)).toBe('10:30')
    })
  })

  describe('getConfigFromForm', () => {
    it('converts string values to numbers', () => {
      const formData = {
        group1HourlyRate: '50',
        group2HourlyRate: '30',
        workingHoursPerDay: '8'
      }

      const result = getConfigFromForm(formData)

      expect(result).toEqual({
        group1HourlyRate: 50,
        group2HourlyRate: 30,
        workingHoursPerDay: 8
      })
    })

    it('uses defaults for invalid or missing values', () => {
      const formData = {
        group1HourlyRate: 'invalid',
        group2HourlyRate: undefined,
        workingHoursPerDay: ''
      }

      const result = getConfigFromForm(formData)

      expect(result).toEqual({
        group1HourlyRate: 0,
        group2HourlyRate: 0,
        workingHoursPerDay: 8
      })
    })

    it('handles empty form data', () => {
      const result = getConfigFromForm({})

      expect(result).toEqual({
        group1HourlyRate: 0,
        group2HourlyRate: 0,
        workingHoursPerDay: 8
      })
    })

    it('handles decimal values', () => {
      const formData = {
        group1HourlyRate: '50.75',
        group2HourlyRate: '30.25',
        workingHoursPerDay: '7.5'
      }

      const result = getConfigFromForm(formData)

      expect(result).toEqual({
        group1HourlyRate: 50.75,
        group2HourlyRate: 30.25,
        workingHoursPerDay: 7.5
      })
    })

    it('handles zero values', () => {
      const formData = {
        group1HourlyRate: '0',
        group2HourlyRate: '0',
        workingHoursPerDay: '0'
      }

      const result = getConfigFromForm(formData)

      expect(result).toEqual({
        group1HourlyRate: 0,
        group2HourlyRate: 0,
        workingHoursPerDay: 0
      })
    })

    it('handles negative values', () => {
      const formData = {
        group1HourlyRate: '-10',
        group2HourlyRate: '-5.5',
        workingHoursPerDay: '-8'
      }

      const result = getConfigFromForm(formData)

      expect(result).toEqual({
        group1HourlyRate: -10,
        group2HourlyRate: -5.5,
        workingHoursPerDay: -8
      })
    })
  })
})
