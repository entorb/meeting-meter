// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'mma-config',
  MEETING: 'mma-meeting'
} as const

// name to be used in web-stats-json.php
export const STATS_DB_COL = 'meeting-meter'

// UI Colors - Using Quasar default theme colors
export const COLORS = {
  PRIMARY: '#1976d2', // Quasar default primary (blue)
  SUCCESS: '#21ba45', // Quasar default positive (green)
  WARNING: '#f2c037', // Quasar default warning (yellow)
  ERROR: '#c10015' // Quasar default negative (red)
} as const

// Validation limits
export const LIMITS = {
  MAX_WORKING_HOURS: 12,
  MIN_WORKING_HOURS: 4,
  MAX_PARTICIPANTS: 1000,
  MIN_PARTICIPANTS: 0
} as const

// Meeting efficiency thresholds
export const EFFICIENCY_THRESHOLDS = {
  OPTIMAL_DURATION_MINUTES: 30,
  ACCEPTABLE_DURATION_MINUTES: 60,
  OPTIMAL_PARTICIPANT_COUNT: 6,
  ACCEPTABLE_PARTICIPANT_COUNT: 8
} as const

// Default values
export const DEFAULTS = {
  WORKING_HOURS_PER_DAY: 8,
  GROUP1_HOURLY_RATE: 0,
  GROUP2_HOURLY_RATE: 0
} as const

// Timer settings
export const TIMER_SETTINGS = {
  UPDATE_INTERVAL_MS: 1000,
  SESSION_EXPIRY_HOURS: 24
} as const

// Time conversion constants (using numeric separators for readability)
export const MS_PER_SECOND = 1_000
export const MS_PER_HOUR = 3_600_000
export const SECONDS_PER_MINUTE = 60
export const SECONDS_PER_HOUR = 3_600

// Legacy exports for backward compatibility
export const TIME_CONSTANTS = {
  MILLISECONDS_IN_HOUR: MS_PER_HOUR,
  MILLISECONDS_IN_SECOND: MS_PER_SECOND,
  SECONDS_IN_HOUR: SECONDS_PER_HOUR,
  SECONDS_IN_MINUTE: SECONDS_PER_MINUTE
} as const
