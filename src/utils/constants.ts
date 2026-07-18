// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'mma-config',
  MEETING: 'mma-meeting'
} as const

// name to be used in web-stats-json.php
export const STATS_DB_COL = 'meeting-meter'

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

// Legacy exports for backward compatibility
export const TIME_CONSTANTS = {
  SECONDS_IN_MINUTE: 60,
  SECONDS_IN_HOUR: 3600,
  MILLISECONDS_IN_SECOND: 1000,
  MILLISECONDS_IN_MINUTE: 60_000,
  MILLISECONDS_IN_HOUR: 3_600_000
} as const
