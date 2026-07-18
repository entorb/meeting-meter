import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { loadConfig, saveConfig } from '@/services/configStorage'
import type { Calculations, Config, MeetingData } from '@/types'
import { DEFAULTS, STORAGE_KEYS, TIME_CONSTANTS, TIMER_SETTINGS } from '@/utils/constants'
import { formatDuration, isTimeBeforeNow, parseTimeInput } from '@/utils/helpers'
import { safeGetItem, safeSetItem } from '@/utils/localStorageHelper'

// Type for serialized meeting data in localStorage
interface SerializedMeetingData {
  startTime: string | null
  isRunning: boolean
  pauseDuration: number
  pauseStartedAt: string | null
  group1Participants: number
  group2Participants: number
}

export const useMeetingStore = defineStore('meeting', () => {
  // Configuration state
  const config = ref<Config>({
    group1HourlyRate: DEFAULTS.GROUP1_HOURLY_RATE,
    group2HourlyRate: DEFAULTS.GROUP2_HOURLY_RATE,
    workingHoursPerDay: DEFAULTS.WORKING_HOURS_PER_DAY
  })

  // Meeting state
  const meetingData = ref<MeetingData>({
    startTime: null,
    duration: 0,
    isRunning: false,
    pauseDuration: 0,
    group1Participants: 0,
    group2Participants: 0
  })

  // Timer interval reference (used in timer control actions)
  let timerInterval: ReturnType<typeof setInterval> | null = null
  let pauseStartedAt: number | null = null

  // Meeting data persistence functions
  function saveMeetingData(data: MeetingData): void {
    try {
      const serializedData: SerializedMeetingData = {
        startTime: data.startTime ? data.startTime.toISOString() : null,
        isRunning: data.isRunning,
        pauseDuration: data.pauseDuration,
        pauseStartedAt: pauseStartedAt ? new Date(pauseStartedAt).toISOString() : null,
        group1Participants: data.group1Participants,
        group2Participants: data.group2Participants
      }
      safeSetItem(STORAGE_KEYS.MEETING, JSON.stringify(serializedData))
    } catch {
      // Silently fail - localStorage might be full or disabled
    }
  }

  function clampParticipants(value: number | undefined): number {
    return Math.max(0, value || 0)
  }

  function isSessionExpired(startTime: Date): boolean {
    const msInExpiryPeriod =
      TIMER_SETTINGS.SESSION_EXPIRY_HOURS * TIME_CONSTANTS.MILLISECONDS_IN_HOUR
    return Date.now() - startTime.getTime() > msInExpiryPeriod
  }

  function clearExpiredSession(parsed: SerializedMeetingData): Date | null {
    const startTime = parsed.startTime ? new Date(parsed.startTime) : null
    if (startTime && Number.isNaN(startTime.getTime())) return null
    if (startTime && isSessionExpired(startTime)) {
      parsed.isRunning = false
      saveMeetingData({
        startTime: null,
        duration: 0,
        isRunning: false,
        pauseDuration: 0,
        group1Participants: clampParticipants(parsed.group1Participants),
        group2Participants: clampParticipants(parsed.group2Participants)
      })
      return null
    }
    return startTime
  }

  function restorePauseState(parsed: SerializedMeetingData): void {
    if (!parsed.pauseStartedAt) return
    const parsedPauseStart = new Date(parsed.pauseStartedAt)
    if (!Number.isNaN(parsedPauseStart.getTime())) {
      pauseStartedAt = parsedPauseStart.getTime()
    }
  }

  function loadMeetingData(): MeetingData | null {
    try {
      const saved = safeGetItem(STORAGE_KEYS.MEETING)
      if (!saved) return null

      const parsed: SerializedMeetingData = JSON.parse(saved)
      const startTime = clearExpiredSession(parsed)
      restorePauseState(parsed)

      let duration = 0
      if (startTime) {
        duration = Math.max(0, Date.now() - startTime.getTime())
      }

      return {
        startTime,
        duration,
        isRunning: parsed.isRunning,
        pauseDuration: parsed.pauseDuration || 0,
        group1Participants: clampParticipants(parsed.group1Participants),
        group2Participants: clampParticipants(parsed.group2Participants)
      }
    } catch {
      return null
    }
  }

  // Encapsulated initialization logic
  function initialize() {
    // Load config on initialization
    const loadedConfig = loadConfig()
    if (loadedConfig) {
      config.value = {
        group1HourlyRate: loadedConfig.group1HourlyRate || 0,
        group2HourlyRate: loadedConfig.group2HourlyRate || 0,
        workingHoursPerDay: loadedConfig.workingHoursPerDay || 8
      }
    }

    // Load meeting data on initialization
    const savedMeetingData = loadMeetingData()
    if (savedMeetingData) {
      meetingData.value = savedMeetingData

      // If timer was running, restart the interval
      if (savedMeetingData.isRunning && savedMeetingData.startTime) {
        timerInterval = setInterval(() => {
          if (meetingData.value.startTime) {
            meetingData.value.duration =
              Math.max(0, Date.now() - meetingData.value.startTime.getTime()) -
              meetingData.value.pauseDuration
          }
        }, TIMER_SETTINGS.UPDATE_INTERVAL_MS)
      }
    }
  }

  // Run initialization
  initialize()

  // Persistence watchers
  watch(config, newConfig => saveConfig(newConfig), { deep: true })
  watch(meetingData, newData => saveMeetingData(newData), { deep: true })

  // Computed calculations
  const calculations = computed<Calculations>(() => {
    // Convert ms to hours
    const durationHours = meetingData.value.duration / TIME_CONSTANTS.MILLISECONDS_IN_HOUR
    const group1People = meetingData.value.group1Participants || 0
    const group2People = meetingData.value.group2Participants || 0
    const totalParticipants = group1People + group2People

    const peopleHours = durationHours * totalParticipants
    const peopleDays = peopleHours / config.value.workingHoursPerDay

    const group1Cost = durationHours * group1People * config.value.group1HourlyRate
    const group2Cost = durationHours * group2People * config.value.group2HourlyRate
    const totalCost = group1Cost + group2Cost

    return {
      durationHours,
      peopleHours,
      peopleDays,
      totalCost,
      totalParticipants,
      group1Cost,
      group2Cost
    }
  })

  // --- Timer Control Functions ---

  /**
   * Starts or resumes the meeting timer.
   * If the timer is paused, it resumes from the current duration.
   * If the timer is stopped, it starts from zero.
   */
  function startTimer() {
    const now = new Date()

    if (!meetingData.value.startTime) {
      // Starting fresh - set start time and reset duration
      meetingData.value.startTime = now
      meetingData.value.duration = 0
    } else if (!meetingData.value.isRunning && pauseStartedAt) {
      // Resuming after pause - accumulate paused time
      meetingData.value.pauseDuration += Date.now() - pauseStartedAt
      pauseStartedAt = null
    }

    meetingData.value.isRunning = true

    // Clear any existing interval before creating a new one
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    // Update timer every second
    timerInterval = setInterval(() => {
      if (meetingData.value.startTime) {
        meetingData.value.duration =
          Math.max(0, Date.now() - meetingData.value.startTime.getTime()) -
          meetingData.value.pauseDuration
      }
    }, TIMER_SETTINGS.UPDATE_INTERVAL_MS)
  }

  /**
   * Stops and resets the meeting timer and duration.
   */
  function stopTimer() {
    // Stop and reset everything
    meetingData.value.isRunning = false
    meetingData.value.startTime = null
    meetingData.value.duration = 0
    meetingData.value.pauseDuration = 0
    pauseStartedAt = null

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  /**
   * Pauses the meeting timer, preserving the current duration.
   */
  function pauseTimer() {
    if (!meetingData.value.isRunning) return

    meetingData.value.isRunning = false
    pauseStartedAt = Date.now()

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  /**
   * Sets the start time of the meeting manually based on a time string (e.g., "14:30").
   * @param timeString - The time string in HH:MM or HHMM format.
   */
  function setManualStartTime(timeString: string) {
    const parsedTime = parseTimeInput(timeString)
    if (!parsedTime) return

    const { hours, minutes } = parsedTime
    if (!isTimeBeforeNow(hours, minutes)) return

    const today = new Date()
    const newStartTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes,
      0,
      0
    )

    meetingData.value.startTime = newStartTime

    // Recalculate duration if timer is running
    if (meetingData.value.isRunning) {
      meetingData.value.duration =
        Date.now() - newStartTime.getTime() - meetingData.value.pauseDuration
    }
  }

  /**
   * Manually sets the pause duration in minutes.
   * @param minutes - Pause duration in minutes.
   */
  function setPauseDuration(minutes: number) {
    meetingData.value.pauseDuration = Math.max(0, minutes * TIME_CONSTANTS.MILLISECONDS_IN_MINUTE)
    if (!meetingData.value.isRunning && meetingData.value.startTime) {
      meetingData.value.duration =
        Math.max(0, Date.now() - meetingData.value.startTime.getTime()) -
        meetingData.value.pauseDuration
    }
  }

  /**
   * Updates the configuration with new values using direct mutation pattern.
   * @param newConfig - Partial configuration object with values to update.
   */
  function updateConfig(newConfig: Partial<Config>) {
    config.value = { ...config.value, ...newConfig }
  }

  return {
    config,
    meetingData,
    calculations,
    startTimer,
    stopTimer,
    pauseTimer,
    setManualStartTime,
    setPauseDuration,
    updateConfig,
    formatDuration
  }
})
