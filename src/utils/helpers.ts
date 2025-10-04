/**
 * Utility functions for formatting and common operations
 */

import type { Config } from '@/types'

/**
 * Sanitize input to keep only integer digits (for participant fields)
 * @param input - The input string to sanitize
 * @returns Sanitized string containing only digits ("0" if empty)
 */
export function sanitizeIntegerInput(input: string): string {
  // Strip any non-digit characters
  const digits = input.replace(/\D+/g, '')
  // Remove leading zeros, but keep single "0"
  const normalized = digits.replace(/^0+(?=\d)/, '')
  return normalized === '' ? '0' : normalized
}

/**
 * Validate and parse integer input with bounds checking
 * @param input - The input string to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param defaultValue - Default value if input is invalid
 * @returns Validated integer within bounds
 */
export function validateIntegerInput(
  input: string,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  defaultValue: number = 0,
): number {
  const sanitized = sanitizeIntegerInput(input)
  const numValue = parseInt(sanitized, 10)

  if (isNaN(numValue)) {
    return defaultValue
  }

  return Math.min(max, Math.max(min, numValue))
}

/**
 * Format currency amount to display with Euro symbol
 * @param amount - The numeric amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return Math.round(amount) + ' €'
}

/**
 * Format a Date object to HH:MM time string
 * @param startTime - The Date object to format
 * @returns Time string in HH:MM format
 */
export function formatStartTime(startTime: Date): string {
  const hours = startTime.getHours().toString().padStart(2, '0')
  const minutes = startTime.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Parse time input in HH:MM or HHMM format
 * @param value - Input string to parse
 * @returns Object with hours and minutes, or null if invalid
 */
export function parseTimeInput(value: string): { hours: number; minutes: number } | null {
  const trimmedValue = value.trim()
  let hours: number, minutes: number

  // Support both HH:MM and HHMM formats
  if (trimmedValue.includes(':')) {
    // HH:MM format
    const parts = trimmedValue.split(':')
    if (parts.length !== 2) return null
    hours = parseInt(parts[0] || '0', 10)
    minutes = parseInt(parts[1] || '0', 10)
  } else if (trimmedValue.length === 4 && /^\d{4}$/.test(trimmedValue)) {
    // HHMM format (e.g., 1234 -> 12:34)
    hours = parseInt(trimmedValue.substring(0, 2), 10)
    minutes = parseInt(trimmedValue.substring(2, 4), 10)
  } else {
    return null
  }

  // Validate time format
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return { hours, minutes }
}

/**
 * Check if a proposed time is before the current time (for validation)
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @returns True if the time is before current time
 */
export function isTimeBeforeNow(hours: number, minutes: number): boolean {
  const now = new Date()
  const proposedTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0,
  )
  return proposedTime < now
}

/**
 * Convert string to number with fallback
 * @param value - The value to convert (string or number)
 * @param defaultValue - The default value to use if conversion fails
 * @returns The numeric value or default value
 */
export function toNumber(value: string | number | null | undefined, defaultValue: number): number {
  if (typeof value === 'number') return value
  if (value === '' || value === null || value === undefined) return defaultValue
  const num = parseFloat(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * Convert form data to config object
 * @param formData - The form data object with string values
 * @returns Config object with numeric values
 */
export function getConfigFromForm(formData: Record<string, string | undefined>): Config {
  return {
    group1HourlyRate: toNumber(formData.group1HourlyRate, 0),
    group2HourlyRate: toNumber(formData.group2HourlyRate, 0),
    workingHoursPerDay: toNumber(formData.workingHoursPerDay, 8),
  }
}
