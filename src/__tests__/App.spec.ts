import { describe, it, expect } from 'vitest'
import { formatCurrency, toNumber, parseTimeInput, isTimeBeforeNow } from '@/utils/helpers'

describe('Helper Functions', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(123.45)).toBe('123 €')
      expect(formatCurrency(1000)).toBe('1000 €')
    })

    it('rounds to nearest integer', () => {
      expect(formatCurrency(123.7)).toBe('124 €')
      expect(formatCurrency(123.2)).toBe('123 €')
    })
  })

  describe('toNumber', () => {
    it('converts valid strings to numbers', () => {
      expect(toNumber('123', 0)).toBe(123)
      expect(toNumber('123.45', 0)).toBe(123.45)
    })

    it('returns default for invalid inputs', () => {
      expect(toNumber('', 10)).toBe(10)
      expect(toNumber('abc', 5)).toBe(5)
      expect(toNumber(null, 15)).toBe(15)
      expect(toNumber(undefined, 20)).toBe(20)
    })

    it('passes through valid numbers', () => {
      expect(toNumber(42, 0)).toBe(42)
    })
  })

  describe('parseTimeInput', () => {
    it('parses HH:MM format correctly', () => {
      expect(parseTimeInput('14:30')).toEqual({ hours: 14, minutes: 30 })
      expect(parseTimeInput('09:05')).toEqual({ hours: 9, minutes: 5 })
    })

    it('parses HHMM format correctly', () => {
      expect(parseTimeInput('1430')).toEqual({ hours: 14, minutes: 30 })
      expect(parseTimeInput('0905')).toEqual({ hours: 9, minutes: 5 })
    })

    it('returns null for invalid formats', () => {
      expect(parseTimeInput('25:30')).toBeNull() // Invalid hour
      expect(parseTimeInput('14:65')).toBeNull() // Invalid minute
      expect(parseTimeInput('abc')).toBeNull() // Invalid format
      expect(parseTimeInput('14')).toBeNull() // Incomplete
    })
  })

  describe('isTimeBeforeNow', () => {
    it('correctly identifies past times', () => {
      const now = new Date()
      const pastHour = now.getHours() - 1
      const pastMinute = now.getMinutes()

      if (pastHour >= 0) {
        expect(isTimeBeforeNow(pastHour, pastMinute)).toBe(true)
      }
    })
  })
})
