/**
 * Fetch stats data from remote server
 */
/**
 * Fetch meetings metered stats from remote server
 * @returns number of meetings metered, or 0 on error
 */

import { STATS_DB_COL, TIME_CONSTANTS } from './constants'

export const helperStatsDataRead = async (): Promise<number> => {
  try {
    const url = `https://entorb.net/web-stats-json.php?origin=${STATS_DB_COL}&action=read`
    const response = await fetch(url)

    if (!response.ok) {
      return 0
    }

    const respData = await response.json()
    if (typeof respData.accesscounts === 'number' && respData.accesscounts >= 0) {
      return respData.accesscounts
    }

    return 0
  } catch {
    // Silently fail - stats are not critical for app functionality
    return 0
  }
}

export const helperStatsDataWrite = async (): Promise<void> => {
  try {
    const url = `https://entorb.net/web-stats-json.php?origin=${STATS_DB_COL}&action=write`
    await fetch(url)
    // Silently ignore errors - stats are not critical for app functionality
  } catch {
    // Silently ignore errors - stats are not critical for app functionality
  }
}

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
  defaultValue: number = 0
): number {
  const sanitized = sanitizeIntegerInput(input)
  const numValue = Number.parseInt(sanitized, 10)

  if (Number.isNaN(numValue)) {
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
  return `${Math.round(amount)} €`
}

// Time formatting constants
const TIME_FORMAT = {
  PAD_LENGTH: 2,
  PAD_CHAR: '0'
} as const

/**
 * Format a Date object to HH:MM time string
 * @param startTime - The Date object to format
 * @returns Time string in HH:MM format
 */
export function formatStartTime(startTime: Date): string {
  const hours = startTime
    .getHours()
    .toString()
    .padStart(TIME_FORMAT.PAD_LENGTH, TIME_FORMAT.PAD_CHAR)
  const minutes = startTime
    .getMinutes()
    .toString()
    .padStart(TIME_FORMAT.PAD_LENGTH, TIME_FORMAT.PAD_CHAR)
  return `${hours}:${minutes}`
}

// Time validation constants
const TIME_VALIDATION = {
  MAX_HOURS: 23,
  MIN_HOURS: 0,
  MAX_MINUTES: 59,
  MIN_MINUTES: 0,
  HHMM_FORMAT_LENGTH: 4,
  TIME_PARTS_COUNT: 2,
  HOURS_START_INDEX: 0,
  HOURS_END_INDEX: 2,
  MINUTES_START_INDEX: 2,
  MINUTES_END_INDEX: 4
} as const

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
    if (parts.length !== TIME_VALIDATION.TIME_PARTS_COUNT) return null
    hours = Number.parseInt(parts[0] || '0', 10)
    minutes = Number.parseInt(parts[1] || '0', 10)
  } else if (
    trimmedValue.length === TIME_VALIDATION.HHMM_FORMAT_LENGTH &&
    /^\d{4}$/.test(trimmedValue)
  ) {
    // HHMM format (e.g., 1234 -> 12:34)
    hours = Number.parseInt(
      trimmedValue.substring(TIME_VALIDATION.HOURS_START_INDEX, TIME_VALIDATION.HOURS_END_INDEX),
      10
    )
    minutes = Number.parseInt(
      trimmedValue.substring(
        TIME_VALIDATION.MINUTES_START_INDEX,
        TIME_VALIDATION.MINUTES_END_INDEX
      ),
      10
    )
  } else {
    return null
  }

  // Validate time format
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < TIME_VALIDATION.MIN_HOURS ||
    hours > TIME_VALIDATION.MAX_HOURS ||
    minutes < TIME_VALIDATION.MIN_MINUTES ||
    minutes > TIME_VALIDATION.MAX_MINUTES
  ) {
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
    0
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
  const num = Number.parseFloat(value)
  return Number.isNaN(num) ? defaultValue : num
}

// Default configuration values
const CONFIG_DEFAULTS = {
  HOURLY_RATE: 0,
  WORKING_HOURS: 8
} as const

/**
 * Convert form data to config object
 * @param formData - The form data object with string values
 * @returns Config object with numeric values
 */
export function getConfigFromForm(formData: Record<string, string | undefined>): Config {
  return {
    group1HourlyRate: toNumber(formData.group1HourlyRate, CONFIG_DEFAULTS.HOURLY_RATE),
    group2HourlyRate: toNumber(formData.group2HourlyRate, CONFIG_DEFAULTS.HOURLY_RATE),
    workingHoursPerDay: toNumber(formData.workingHoursPerDay, CONFIG_DEFAULTS.WORKING_HOURS)
  }
}

function padNumber(num: number): string {
  return (num < 10 ? '0' : '') + num
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / TIME_CONSTANTS.MILLISECONDS_IN_SECOND)
  const hours = Math.floor(totalSeconds / TIME_CONSTANTS.SECONDS_IN_HOUR)
  const minutes = Math.floor(
    (totalSeconds % TIME_CONSTANTS.SECONDS_IN_HOUR) / TIME_CONSTANTS.SECONDS_IN_MINUTE
  )
  const seconds = totalSeconds % TIME_CONSTANTS.SECONDS_IN_MINUTE

  return `${hours}:${padNumber(minutes)}:${padNumber(seconds)}`
}
