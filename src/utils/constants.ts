// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'mcc-config',
  MEETING: 'mcc-meeting',
} as const

// UI Colors
export const COLORS = {
  PRIMARY: '#0091e3', // blue of icon
  // SECONDARY: '#2E5984', // muted steel blue
  // for efficiency card and play button
  SUCCESS: '#2e7d32', // deep green
  WARNING: '#ff9800', // warm amber
  ERROR: '#d32f2f', // strong red
} as const

// Validation limits
export const LIMITS = {
  MIN_PARTICIPANTS: 0,
  MAX_HOURLY_RATE: 999,
  MIN_HOURLY_RATE: 0,
  MAX_WORKING_HOURS: 12,
  MIN_WORKING_HOURS: 4,
} as const

// Meeting efficiency thresholds
export const EFFICIENCY_THRESHOLDS = {
  OPTIMAL_DURATION_MINUTES: 30,
  ACCEPTABLE_DURATION_MINUTES: 60,
  OPTIMAL_PARTICIPANT_COUNT: 6,
  ACCEPTABLE_PARTICIPANT_COUNT: 8,
} as const

// Default values
export const DEFAULTS = {
  WORKING_HOURS_PER_DAY: 8,
  GROUP1_HOURLY_RATE: 0,
  GROUP2_HOURLY_RATE: 0,
} as const
