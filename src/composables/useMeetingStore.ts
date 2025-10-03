import { computed, ref, watch, onUnmounted } from 'vue'
import type { Config, MeetingData, Calculations } from '@/types'
import { loadConfig, saveConfig } from '@/services/configStorage'
import { STORAGE_KEYS, LIMITS, DEFAULTS } from '@/utils/constants'

// Type for serialized meeting data in localStorage
interface SerializedMeetingData {
  startTime: string | null
  isRunning: boolean
  group1Participants: number
  group2Participants: number
}

// Meeting data persistence functions
function saveMeetingData(data: MeetingData): void {
  try {
    const serializedData: SerializedMeetingData = {
      startTime: data.startTime ? data.startTime.toISOString() : null,
      isRunning: data.isRunning,
      group1Participants: data.group1Participants,
      group2Participants: data.group2Participants,
    }
    localStorage.setItem(STORAGE_KEYS.MEETING, JSON.stringify(serializedData))
  } catch (error) {
    console.warn('Failed to save meeting data:', error)
  }
}

function loadMeetingData(): MeetingData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MEETING)
    if (!saved) return null

    const parsed: SerializedMeetingData = JSON.parse(saved)
    const startTime = parsed.startTime ? new Date(parsed.startTime) : null

    // Validate startTime if it exists
    if (startTime && isNaN(startTime.getTime())) {
      console.warn('Invalid startTime in saved data, ignoring')
      return null
    }

    // Recalculate duration from start time if timer is running
    let duration = 0
    if (startTime && parsed.isRunning) {
      duration = Math.max(0, Date.now() - startTime.getTime())
    }

    return {
      startTime,
      duration,
      isRunning: parsed.isRunning || false,
      group1Participants: Math.max(LIMITS.MIN_PARTICIPANTS, parsed.group1Participants || 0),
      group2Participants: Math.max(LIMITS.MIN_PARTICIPANTS, parsed.group2Participants || 0),
    }
  } catch (error) {
    console.warn('Failed to load meeting data:', error)
    return null
  }
}

export function useMeetingStore() {
  // Configuration state
  const config = ref<Config>({
    group1HourlyRate: DEFAULTS.GROUP1_HOURLY_RATE,
    group2HourlyRate: DEFAULTS.GROUP2_HOURLY_RATE,
    workingHoursPerDay: DEFAULTS.WORKING_HOURS_PER_DAY,
  })

  // Meeting state
  const meetingData = ref<MeetingData>({
    startTime: null,
    duration: 0,
    isRunning: false,
    group1Participants: LIMITS.MIN_PARTICIPANTS,
    group2Participants: LIMITS.MIN_PARTICIPANTS,
  })

  // Timer interval reference
  let timerInterval: ReturnType<typeof setInterval> | null = null

  // Load config on initialization
  const loadedConfig = loadConfig()
  if (loadedConfig) {
    // Validate and clean the loaded config
    function validateRate(rate: number, min: number, max: number, def: number): number {
      return Number.isFinite(rate) ? Math.max(min, Math.min(max, rate)) : def
    }

    config.value = {
      group1HourlyRate: validateRate(
        loadedConfig.group1HourlyRate,
        LIMITS.MIN_HOURLY_RATE,
        LIMITS.MAX_HOURLY_RATE,
        DEFAULTS.GROUP1_HOURLY_RATE,
      ),
      group2HourlyRate: validateRate(
        loadedConfig.group2HourlyRate,
        LIMITS.MIN_HOURLY_RATE,
        LIMITS.MAX_HOURLY_RATE,
        DEFAULTS.GROUP2_HOURLY_RATE,
      ),
      workingHoursPerDay: validateRate(
        loadedConfig.workingHoursPerDay,
        LIMITS.MIN_WORKING_HOURS,
        LIMITS.MAX_WORKING_HOURS,
        DEFAULTS.WORKING_HOURS_PER_DAY,
      ),
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
          meetingData.value.duration = Math.max(
            0,
            Date.now() - meetingData.value.startTime.getTime(),
          )
        }
      }, 1000)
    }
  }

  // Cleanup function for timer
  const cleanup = (): void => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // Cleanup on unmount
  onUnmounted(cleanup)

  // Save config when it changes
  watch(
    config,
    (newConfig) => {
      try {
        saveConfig(newConfig)
      } catch (error) {
        console.warn('Failed to save config:', error)
      }
    },
    { deep: true },
  )

  // Save meeting data when it changes
  watch(
    meetingData,
    (newMeetingData) => {
      try {
        saveMeetingData(newMeetingData)
      } catch (error) {
        console.warn('Failed to save meeting data:', error)
      }
    },
    { deep: true },
  )

  // Computed calculations
  const calculations = computed<Calculations>(() => {
    const durationHours = meetingData.value.duration / (1000 * 60 * 60) // Convert ms to hours
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
      group2Cost,
    }
  })

  // Timer functions
  function startTimer() {
    const now = new Date()

    if (!meetingData.value.startTime) {
      // Starting fresh - set start time and reset duration
      meetingData.value.startTime = now
      meetingData.value.duration = 0
    } else if (!meetingData.value.isRunning) {
      // Resuming after pause - adjust start time based on current duration
      const adjustedStartTime = new Date(now.getTime() - meetingData.value.duration)
      meetingData.value.startTime = adjustedStartTime
    }

    meetingData.value.isRunning = true

    // Update timer every second
    timerInterval = setInterval(() => {
      if (meetingData.value.startTime) {
        meetingData.value.duration = Date.now() - meetingData.value.startTime.getTime()
      }
    }, 1000)
  }

  function stopTimer() {
    // Stop and reset everything
    meetingData.value.isRunning = false
    meetingData.value.startTime = null
    meetingData.value.duration = 0

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function pauseTimer() {
    // Pause the timer - stop updates but keep state
    if (!meetingData.value.isRunning) return

    meetingData.value.isRunning = false

    // Update duration one final time before stopping
    if (meetingData.value.startTime) {
      meetingData.value.duration = Date.now() - meetingData.value.startTime.getTime()
    }

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function adjustStartTime(minutes: number) {
    if (!meetingData.value.startTime) return

    const newStartTime = new Date(meetingData.value.startTime)
    newStartTime.setMinutes(newStartTime.getMinutes() - minutes)

    // Round to nearest 5 minutes
    const mins = newStartTime.getMinutes()
    const roundedMins = Math.round(mins / 5) * 5
    newStartTime.setMinutes(roundedMins)
    newStartTime.setSeconds(0)
    newStartTime.setMilliseconds(0)

    meetingData.value.startTime = newStartTime

    // Recalculate duration if timer is running
    if (meetingData.value.isRunning) {
      meetingData.value.duration = Date.now() - newStartTime.getTime()
    }
  }

  function setManualStartTime(timeString: string) {
    if (!timeString || !timeString.match(/^\d{1,2}:\d{2}$/)) return

    const timeParts = timeString.split(':')
    if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) return

    const hours = parseInt(timeParts[0], 10)
    const minutes = parseInt(timeParts[1], 10)

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59)
      return

    const today = new Date()
    const newStartTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      hours,
      minutes,
      0,
      0,
    )

    meetingData.value.startTime = newStartTime

    // Recalculate duration if timer is running
    if (meetingData.value.isRunning) {
      meetingData.value.duration = Date.now() - newStartTime.getTime()
    }
  }

  function formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (num: number): string => (num < 10 ? '0' : '') + num
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }

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
    adjustStartTime,
    setManualStartTime,
    formatDuration,
    updateConfig,
  }
}
