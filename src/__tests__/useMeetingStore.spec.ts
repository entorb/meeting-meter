import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useMeetingStore } from '@/stores/meetingStore'
import * as configStorage from '@/services/configStorage'
import * as localStorageHelper from '@/utils/localStorageHelper'
import * as helpers from '@/utils/helpers'
import { STORAGE_KEYS } from '@/utils/constants'

// Mock dependencies
vi.mock('@/services/configStorage', () => ({
  loadConfig: vi.fn(),
  saveConfig: vi.fn()
}))

vi.mock('@/utils/localStorageHelper', () => ({
  safeGetItem: vi.fn(),
  safeSetItem: vi.fn()
}))

vi.mock('@/utils/helpers', () => ({
  formatDuration: vi.fn((ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }),
  parseTimeInput: vi.fn((timeString: string) => {
    const match = timeString.match(/^(\d{1,2}):?(\d{2})$/)
    if (!match) return null
    const hours = parseInt(match[1] || '0', 10)
    const minutes = parseInt(match[2] || '0', 10)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    return { hours, minutes }
  }),
  isTimeBeforeNow: vi.fn((hours: number, minutes: number) => {
    const now = new Date()
    const testTime = new Date()
    testTime.setHours(hours, minutes, 0, 0)
    return testTime.getTime() < now.getTime()
  })
}))

describe('useMeetingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())

    // Default mocks
    vi.mocked(configStorage.loadConfig).mockReturnValue(null)
    vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(null)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('initializes with default config when no saved config exists', () => {
      vi.mocked(configStorage.loadConfig).mockReturnValue(null)

      const store = useMeetingStore()

      expect(store.config.group1HourlyRate).toBe(0)
      expect(store.config.group2HourlyRate).toBe(0)
      expect(store.config.workingHoursPerDay).toBe(8)
    })

    it('loads saved config on initialization', () => {
      vi.mocked(configStorage.loadConfig).mockReturnValue({
        group1HourlyRate: 50,
        group2HourlyRate: 30,
        workingHoursPerDay: 7
      })

      const store = useMeetingStore()

      expect(store.config.group1HourlyRate).toBe(50)
      expect(store.config.group2HourlyRate).toBe(30)
      expect(store.config.workingHoursPerDay).toBe(7)
    })

    it('initializes with default meeting data when no saved data exists', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(null)

      const store = useMeetingStore()

      expect(store.meetingData.startTime).toBeNull()
      expect(store.meetingData.duration).toBe(0)
      expect(store.meetingData.isRunning).toBe(false)
      expect(store.meetingData.group1Participants).toBe(0)
      expect(store.meetingData.group2Participants).toBe(0)
    })

    it('loads saved meeting data on initialization', () => {
      // Set a known "current" time
      const now = new Date('2025-01-01T10:30:00Z')
      vi.setSystemTime(now)

      // Create a start time that's 30 minutes ago (well within the 24-hour expiry)
      const startTime = new Date('2025-01-01T10:00:00Z')
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(
        JSON.stringify({
          startTime: startTime.toISOString(),
          isRunning: false,
          group1Participants: 5,
          group2Participants: 3
        })
      )

      const store = useMeetingStore()

      expect(store.meetingData.startTime).not.toBeNull()
      expect(store.meetingData.startTime?.getTime()).toBe(startTime.getTime())
      expect(store.meetingData.group1Participants).toBe(5)
      expect(store.meetingData.group2Participants).toBe(3)
    })

    it('clears expired meeting data older than SESSION_EXPIRY_HOURS', () => {
      const oldStartTime = new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(
        JSON.stringify({
          startTime: oldStartTime.toISOString(),
          isRunning: true,
          group1Participants: 5,
          group2Participants: 3
        })
      )

      const store = useMeetingStore()

      expect(store.meetingData.startTime).toBeNull()
      expect(store.meetingData.isRunning).toBe(false)
      expect(store.meetingData.duration).toBe(0)
      expect(localStorageHelper.safeSetItem).toHaveBeenCalled()
    })

    it('restarts timer interval if meeting was running', () => {
      const startTime = new Date(Date.now() - 1000) // 1 second ago
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(
        JSON.stringify({
          startTime: startTime.toISOString(),
          isRunning: true,
          group1Participants: 5,
          group2Participants: 3
        })
      )

      const store = useMeetingStore()

      expect(store.meetingData.isRunning).toBe(true)
      expect(store.meetingData.duration).toBeGreaterThan(0)
    })

    it('handles invalid JSON in saved meeting data', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue('invalid json')

      const store = useMeetingStore()

      expect(store.meetingData.startTime).toBeNull()
      expect(store.meetingData.duration).toBe(0)
    })

    it('handles invalid date in saved meeting data', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(
        JSON.stringify({
          startTime: 'invalid-date',
          isRunning: false,
          group1Participants: 5,
          group2Participants: 3
        })
      )

      const store = useMeetingStore()

      expect(store.meetingData.startTime).toBeNull()
    })

    it('clamps negative participants to 0', () => {
      vi.mocked(localStorageHelper.safeGetItem).mockReturnValue(
        JSON.stringify({
          startTime: null,
          isRunning: false,
          group1Participants: -5,
          group2Participants: -3
        })
      )

      const store = useMeetingStore()

      expect(store.meetingData.group1Participants).toBe(0)
      expect(store.meetingData.group2Participants).toBe(0)
    })
  })

  describe('Timer Control', () => {
    it('starts timer from zero when not previously started', () => {
      const store = useMeetingStore()
      const now = new Date('2025-01-01T10:00:00Z')
      vi.setSystemTime(now)

      store.startTimer()

      expect(store.meetingData.startTime?.toISOString()).toBe(now.toISOString())
      expect(store.meetingData.duration).toBe(0)
      expect(store.meetingData.isRunning).toBe(true)
    })

    it('updates duration while timer is running', () => {
      const store = useMeetingStore()
      const startTime = new Date('2025-01-01T10:00:00Z')
      vi.setSystemTime(startTime)

      store.startTimer()

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000)

      expect(store.meetingData.duration).toBeGreaterThanOrEqual(5000)
    })

    it('resumes timer from current duration when paused', () => {
      const store = useMeetingStore()
      const startTime = new Date('2025-01-01T10:00:00Z')
      vi.setSystemTime(startTime)

      // Start, wait, pause
      store.startTimer()
      vi.advanceTimersByTime(5000)
      store.pauseTimer()

      const pausedDuration = store.meetingData.duration

      // Resume
      vi.advanceTimersByTime(1000)
      store.startTimer()
      vi.advanceTimersByTime(3000)

      expect(store.meetingData.duration).toBeGreaterThanOrEqual(pausedDuration + 3000)
    })

    it('pauses timer and preserves duration', () => {
      const store = useMeetingStore()
      const startTime = new Date('2025-01-01T10:00:00Z')
      vi.setSystemTime(startTime)

      store.startTimer()
      vi.advanceTimersByTime(5000)

      store.pauseTimer()

      expect(store.meetingData.isRunning).toBe(false)
      expect(store.meetingData.duration).toBeGreaterThanOrEqual(5000)
    })

    it('stops timer and resets all values', () => {
      const store = useMeetingStore()
      const startTime = new Date('2025-01-01T10:00:00Z')
      vi.setSystemTime(startTime)

      store.startTimer()
      vi.advanceTimersByTime(5000)

      store.stopTimer()

      expect(store.meetingData.isRunning).toBe(false)
      expect(store.meetingData.startTime).toBeNull()
      expect(store.meetingData.duration).toBe(0)
    })

    it('does nothing when pausing already paused timer', () => {
      const store = useMeetingStore()

      store.pauseTimer()

      expect(store.meetingData.isRunning).toBe(false)
    })

    it('clears interval on stop', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const store = useMeetingStore()

      store.startTimer()
      store.stopTimer()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    it('clears interval on pause', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      const store = useMeetingStore()

      store.startTimer()
      store.pauseTimer()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Manual Start Time', () => {
    it('sets manual start time with valid time string', () => {
      vi.mocked(helpers.parseTimeInput).mockReturnValue({ hours: 14, minutes: 30 })
      vi.mocked(helpers.isTimeBeforeNow).mockReturnValue(true)

      const store = useMeetingStore()
      const now = new Date('2025-01-01T15:00:00Z')
      vi.setSystemTime(now)

      store.setManualStartTime('14:30')

      expect(store.meetingData.startTime?.getHours()).toBe(14)
      expect(store.meetingData.startTime?.getMinutes()).toBe(30)
    })

    it('recalculates duration when timer is running', () => {
      vi.mocked(helpers.parseTimeInput).mockReturnValue({ hours: 14, minutes: 30 })
      vi.mocked(helpers.isTimeBeforeNow).mockReturnValue(true)

      const store = useMeetingStore()
      const now = new Date('2025-01-01T15:00:00Z')
      vi.setSystemTime(now)

      store.startTimer()
      store.setManualStartTime('14:30')

      expect(store.meetingData.duration).toBeGreaterThan(0)
    })

    it('ignores invalid time string', () => {
      vi.mocked(helpers.parseTimeInput).mockReturnValue(null)

      const store = useMeetingStore()
      const originalStartTime = store.meetingData.startTime

      store.setManualStartTime('invalid')

      expect(store.meetingData.startTime).toBe(originalStartTime)
    })

    it('ignores time in the future', () => {
      vi.mocked(helpers.parseTimeInput).mockReturnValue({ hours: 18, minutes: 0 })
      vi.mocked(helpers.isTimeBeforeNow).mockReturnValue(false)

      const store = useMeetingStore()
      const originalStartTime = store.meetingData.startTime

      store.setManualStartTime('18:00')

      expect(store.meetingData.startTime).toBe(originalStartTime)
    })

    it('handles time string without colon', () => {
      vi.mocked(helpers.parseTimeInput).mockReturnValue({ hours: 14, minutes: 30 })
      vi.mocked(helpers.isTimeBeforeNow).mockReturnValue(true)

      const store = useMeetingStore()
      const now = new Date('2025-01-01T15:00:00Z')
      vi.setSystemTime(now)

      store.setManualStartTime('1430')

      expect(store.meetingData.startTime?.getHours()).toBe(14)
      expect(store.meetingData.startTime?.getMinutes()).toBe(30)
    })
  })

  describe('Config Updates', () => {
    it('updates config with partial values', () => {
      const store = useMeetingStore()

      store.updateConfig({ group1HourlyRate: 75 })

      expect(store.config.group1HourlyRate).toBe(75)
      expect(store.config.group2HourlyRate).toBe(0)
      expect(store.config.workingHoursPerDay).toBe(8)
    })

    it('updates multiple config values', () => {
      const store = useMeetingStore()

      store.updateConfig({
        group1HourlyRate: 50,
        group2HourlyRate: 30
      })

      expect(store.config.group1HourlyRate).toBe(50)
      expect(store.config.group2HourlyRate).toBe(30)
    })

    it('saves config to storage when updated', async () => {
      const store = useMeetingStore()

      store.updateConfig({ group1HourlyRate: 75 })
      await nextTick()
      await nextTick()

      expect(configStorage.saveConfig).toHaveBeenCalled()
      const calls = vi.mocked(configStorage.saveConfig).mock.calls
      const lastCall = calls[calls.length - 1]!
      expect(lastCall[0]).toMatchObject({ group1HourlyRate: 75 })
    })
  })

  describe('Calculations', () => {
    it('calculates total participants', () => {
      const store = useMeetingStore()
      store.meetingData.group1Participants = 5
      store.meetingData.group2Participants = 3

      expect(store.calculations.totalParticipants).toBe(8)
    })

    it('calculates people hours correctly', () => {
      const store = useMeetingStore()
      store.meetingData.duration = 3600000 // 1 hour in ms
      store.meetingData.group1Participants = 5
      store.meetingData.group2Participants = 3

      expect(store.calculations.peopleHours).toBe(8)
    })

    it('calculates people days correctly', () => {
      const store = useMeetingStore()
      store.config.workingHoursPerDay = 8
      store.meetingData.duration = 3600000 // 1 hour
      store.meetingData.group1Participants = 8
      store.meetingData.group2Participants = 0

      expect(store.calculations.peopleDays).toBe(1)
    })

    it('calculates total cost with hourly rates', () => {
      const store = useMeetingStore()
      store.config.group1HourlyRate = 50
      store.config.group2HourlyRate = 30
      store.meetingData.duration = 3600000 // 1 hour
      store.meetingData.group1Participants = 2
      store.meetingData.group2Participants = 3

      // 2 * 50 + 3 * 30 = 100 + 90 = 190
      expect(store.calculations.totalCost).toBe(190)
    })

    it('calculates group costs separately', () => {
      const store = useMeetingStore()
      store.config.group1HourlyRate = 100
      store.config.group2HourlyRate = 50
      store.meetingData.duration = 1800000 // 0.5 hours
      store.meetingData.group1Participants = 2
      store.meetingData.group2Participants = 4

      expect(store.calculations.group1Cost).toBe(100) // 0.5 * 2 * 100
      expect(store.calculations.group2Cost).toBe(100) // 0.5 * 4 * 50
    })

    it('handles zero duration', () => {
      const store = useMeetingStore()
      store.meetingData.duration = 0
      store.meetingData.group1Participants = 5

      expect(store.calculations.peopleHours).toBe(0)
      expect(store.calculations.totalCost).toBe(0)
    })

    it('handles zero participants', () => {
      const store = useMeetingStore()
      store.meetingData.duration = 3600000
      store.meetingData.group1Participants = 0
      store.meetingData.group2Participants = 0

      expect(store.calculations.totalParticipants).toBe(0)
      expect(store.calculations.peopleHours).toBe(0)
      expect(store.calculations.totalCost).toBe(0)
    })

    it('calculates correctly with only group1 participants', () => {
      const store = useMeetingStore()
      store.config.group1HourlyRate = 75
      store.meetingData.duration = 3600000 // 1 hour
      store.meetingData.group1Participants = 4
      store.meetingData.group2Participants = 0

      expect(store.calculations.totalCost).toBe(300)
    })

    it('calculates correctly with only group2 participants', () => {
      const store = useMeetingStore()
      store.config.group2HourlyRate = 45
      store.meetingData.duration = 3600000 // 1 hour
      store.meetingData.group1Participants = 0
      store.meetingData.group2Participants = 6

      expect(store.calculations.totalCost).toBe(270)
    })
  })

  describe('Persistence', () => {
    it('saves meeting data when participants change', async () => {
      const store = useMeetingStore()

      store.meetingData.group1Participants = 10
      await nextTick()
      await nextTick()

      expect(localStorageHelper.safeSetItem).toHaveBeenCalled()
      const calls = vi.mocked(localStorageHelper.safeSetItem).mock.calls
      const lastCall = calls[calls.length - 1]!
      expect(lastCall[0]).toBe(STORAGE_KEYS.MEETING)
      expect(lastCall[1]).toContain('"group1Participants":10')
    })

    it('saves meeting data when timer state changes', async () => {
      const store = useMeetingStore()

      store.startTimer()
      await nextTick()
      await nextTick()

      expect(localStorageHelper.safeSetItem).toHaveBeenCalled()
      const calls = vi.mocked(localStorageHelper.safeSetItem).mock.calls
      const lastCall = calls[calls.length - 1]!
      expect(lastCall[0]).toBe(STORAGE_KEYS.MEETING)
      expect(lastCall[1]).toContain('"isRunning":true')
    })

    it('handles localStorage errors gracefully when saving', async () => {
      vi.mocked(localStorageHelper.safeSetItem).mockImplementation(() => {
        throw new Error('Storage full')
      })

      const store = useMeetingStore()

      // Should not throw
      expect(() => {
        store.meetingData.group1Participants = 10
      }).not.toThrow()
    })

    it('serializes startTime to ISO string', async () => {
      const store = useMeetingStore()
      const testDate = new Date('2025-01-01T10:00:00Z')
      vi.setSystemTime(testDate)

      store.startTimer()
      await nextTick()
      await nextTick()

      expect(localStorageHelper.safeSetItem).toHaveBeenCalled()
      const calls = vi.mocked(localStorageHelper.safeSetItem).mock.calls
      const lastCall = calls[calls.length - 1]!
      expect(lastCall[0]).toBe(STORAGE_KEYS.MEETING)
      expect(lastCall[1]).toContain(testDate.toISOString())
    })

    it('saves null startTime correctly', async () => {
      const store = useMeetingStore()
      store.startTimer()
      await nextTick()
      await nextTick()

      expect(localStorageHelper.safeSetItem).toHaveBeenCalled()

      vi.clearAllMocks()
      store.stopTimer()
      await nextTick()
      await nextTick()

      expect(localStorageHelper.safeSetItem).toHaveBeenCalled()
      const calls = vi.mocked(localStorageHelper.safeSetItem).mock.calls
      const lastCall = calls[calls.length - 1]!
      expect(lastCall[0]).toBe(STORAGE_KEYS.MEETING)
      expect(lastCall[1]).toContain('"startTime":null')
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid timer start/stop/start', () => {
      const store = useMeetingStore()

      store.startTimer()
      store.stopTimer()
      store.startTimer()

      expect(store.meetingData.isRunning).toBe(true)
      expect(store.meetingData.duration).toBe(0)
    })

    it('handles very long meeting durations', () => {
      const store = useMeetingStore()
      store.meetingData.duration = 36000000 // 10 hours

      expect(store.calculations.durationHours).toBe(10)
    })

    it('handles fractional hourly rates', () => {
      const store = useMeetingStore()
      store.config.group1HourlyRate = 50.5
      store.meetingData.duration = 3600000
      store.meetingData.group1Participants = 2

      expect(store.calculations.totalCost).toBe(101)
    })

    it('handles non-standard working hours per day', () => {
      const store = useMeetingStore()
      store.config.workingHoursPerDay = 6
      store.meetingData.duration = 3600000 // 1 hour
      store.meetingData.group1Participants = 6

      expect(store.calculations.peopleDays).toBe(1)
    })

    it('prevents negative duration', () => {
      const store = useMeetingStore()
      const futureTime = new Date(Date.now() + 10000)
      store.meetingData.startTime = futureTime
      store.meetingData.isRunning = true

      // Duration should be clamped to 0
      expect(store.calculations.durationHours).toBeGreaterThanOrEqual(0)
    })

    it('handles missing participant values', () => {
      const store = useMeetingStore()
      // @ts-expect-error Testing runtime behavior
      store.meetingData.group1Participants = undefined
      // @ts-expect-error Testing runtime behavior
      store.meetingData.group2Participants = null

      expect(store.calculations.totalParticipants).toBe(0)
    })
  })

  describe('formatDuration Export', () => {
    it('exports formatDuration function', () => {
      const store = useMeetingStore()

      expect(store.formatDuration).toBeDefined()
      expect(typeof store.formatDuration).toBe('function')
    })

    it('formatDuration works correctly', () => {
      const store = useMeetingStore()

      const result = store.formatDuration(3665000) // 1h 1m 5s

      expect(helpers.formatDuration).toHaveBeenCalledWith(3665000)
      expect(result).toBe('1:01:05')
    })
  })
})
