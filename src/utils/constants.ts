// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'mma-config',
  MEETING: 'mma-meeting'
} as const

// name to be used in web-stats-json.php
export const STATS_DB_COL = 'meeting-meter'

// UI Colors
export const COLORS = {
  PRIMARY: '#0091e3', // blue of icon
  SUCCESS: '#2e7d32', // deep green
  WARNING: '#ff9800', // warm amber
  ERROR: '#d32f2f' // strong red
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

// Time conversion constants
export const TIME_CONSTANTS = {
  MILLISECONDS_IN_SECOND: 1000,
  SECONDS_IN_MINUTE: 60,
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  PAD_THRESHOLD: 10
} as const
