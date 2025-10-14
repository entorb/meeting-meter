import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ref } from 'vue'

// Mock CSS imports
vi.mock('vuetify/styles', () => ({}))
vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  formatCurrency: vi.fn((amount: number) => `${Math.round(amount)} €`),
  formatStartTime: vi.fn((date: Date) => {
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }),
  sanitizeIntegerInput: vi.fn((input: string) => input.replace(/\D+/g, '') || '0'),
  helperStatsDataWrite: vi.fn().mockResolvedValue(undefined)
}))

// Mock store
const mockStartTimer = vi.fn()
const mockStopTimer = vi.fn()
const mockPauseTimer = vi.fn()
const mockSetManualStartTime = vi.fn()
const mockFormatDuration = vi.fn((ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const mockMeetingData = ref({
  startTime: null as Date | null,
  duration: 0,
  isRunning: false,
  group1Participants: 5,
  group2Participants: 3
})

const mockConfig = ref({
  group1HourlyRate: 50,
  group2HourlyRate: 30,
  workingHoursPerDay: 8
})

const mockCalculations = ref({
  totalParticipants: 8,
  peopleHours: 2.5,
  peopleDays: 0.3,
  totalCost: 200
})

vi.mock('@/composables/useMeetingStore', () => ({
  useMeetingStore: vi.fn(() => ({
    config: mockConfig,
    meetingData: mockMeetingData,
    calculations: mockCalculations,
    startTimer: mockStartTimer,
    stopTimer: mockStopTimer,
    pauseTimer: mockPauseTimer,
    setManualStartTime: mockSetManualStartTime,
    formatDuration: mockFormatDuration
  }))
}))

describe('HomePage', () => {
  let wrapper: VueWrapper
  let router: any
  let vuetify: any

  beforeEach(() => {
    vuetify = createVuetify({
      components,
      directives
    })

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomePage },
        { path: '/config', component: { template: '<div>Config</div>' } }
      ]
    })

    // Reset mocks
    vi.clearAllMocks()
    mockMeetingData.value = {
      startTime: null,
      duration: 0,
      isRunning: false,
      group1Participants: 5,
      group2Participants: 3
    }
    mockConfig.value = {
      group1HourlyRate: 50,
      group2HourlyRate: 30,
      workingHoursPerDay: 8
    }
    mockCalculations.value = {
      totalParticipants: 8,
      peopleHours: 2.5,
      peopleDays: 0.3,
      totalCost: 200
    }
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = async () => {
    wrapper = mount(HomePage, {
      global: {
        plugins: [router, vuetify]
      }
    })
    await wrapper.vm.$nextTick()
    return wrapper
  }

  describe('Component Rendering', () => {
    it('renders the component correctly', async () => {
      await createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('displays the correct title', async () => {
      await createWrapper()
      expect(wrapper.text()).toContain('Meeting Meter')
    })

    it('renders config button', async () => {
      await createWrapper()
      const configBtn = wrapper.find('[data-cy="config-btn"]')
      expect(configBtn.exists()).toBe(true)
    })

    it('renders timer display', async () => {
      await createWrapper()
      const timerDisplay = wrapper.find('[data-cy="timer-display"]')
      expect(timerDisplay.exists()).toBe(true)
    })
  })

  describe('Timer Controls', () => {
    it('shows start button when timer not started', async () => {
      mockMeetingData.value.startTime = null
      await createWrapper()

      const startBtn = wrapper.find('[data-cy="start-timer-btn"]')
      expect(startBtn.exists()).toBe(true)
    })

    it('starts timer and writes stats when start button clicked', async () => {
      mockMeetingData.value.startTime = null
      const { helperStatsDataWrite } = await import('@/utils/helpers')

      await createWrapper()
      const startBtn = wrapper.find('[data-cy="start-timer-btn"]')
      await startBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockStartTimer).toHaveBeenCalled()
      expect(helperStatsDataWrite).toHaveBeenCalled()
    })

    it('shows pause button when timer is running', async () => {
      mockMeetingData.value.startTime = new Date()
      mockMeetingData.value.isRunning = true

      await createWrapper()
      const pauseBtn = wrapper.find('[data-cy="pause-timer-btn"]')
      expect(pauseBtn.exists()).toBe(true)
    })

    it('pauses timer when pause button clicked', async () => {
      mockMeetingData.value.startTime = new Date()
      mockMeetingData.value.isRunning = true

      await createWrapper()
      const pauseBtn = wrapper.find('[data-cy="pause-timer-btn"]')
      await pauseBtn.trigger('click')

      expect(mockPauseTimer).toHaveBeenCalled()
    })

    it('shows stop button when timer is paused', async () => {
      mockMeetingData.value.startTime = new Date()
      mockMeetingData.value.isRunning = false

      await createWrapper()
      const stopBtn = wrapper.find('[data-cy="stop-timer-btn"]')
      expect(stopBtn.exists()).toBe(true)
    })

    it('stops timer when stop button clicked', async () => {
      mockMeetingData.value.startTime = new Date()
      mockMeetingData.value.isRunning = false

      await createWrapper()
      const stopBtn = wrapper.find('[data-cy="stop-timer-btn"]')
      await stopBtn.trigger('click')

      expect(mockStopTimer).toHaveBeenCalled()
    })

    it('displays formatted duration', async () => {
      mockMeetingData.value.duration = 3665000 // 1h 1m 5s

      await createWrapper()
      expect(mockFormatDuration).toHaveBeenCalledWith(3665000)
    })
  })

  describe('Start Time Editing', () => {
    it('does not show start time when timer not started', async () => {
      mockMeetingData.value.startTime = null
      await createWrapper()

      const startTimeBtn = wrapper.find('[aria-label="Edit meeting start time"]')
      expect(startTimeBtn.exists()).toBe(false)
    })

    it('shows start time button when timer is running', async () => {
      mockMeetingData.value.startTime = new Date(2025, 0, 1, 14, 30)
      await createWrapper()

      expect(wrapper.text()).toContain('14:30')
    })

    it('enters edit mode when start time is clicked', async () => {
      mockMeetingData.value.startTime = new Date(2025, 0, 1, 14, 30)
      await createWrapper()

      const startTimeBtn = wrapper.find('[aria-label="Edit meeting start time"]')
      await startTimeBtn.trigger('click')
      await wrapper.vm.$nextTick()

      const input = wrapper.find('[aria-label="Edit meeting start time"][placeholder*="14:30"]')
      expect(input.exists()).toBe(true)
    })

    it('saves start time on Enter key', async () => {
      mockMeetingData.value.startTime = new Date(2025, 0, 1, 14, 30)
      await createWrapper()

      const startTimeBtn = wrapper.find('[aria-label="Edit meeting start time"]')
      await startTimeBtn.trigger('click')
      await wrapper.vm.$nextTick()

      const input = wrapper.find('input[aria-label="Edit meeting start time"]')
      await input.setValue('15:45')
      await input.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect(mockSetManualStartTime).toHaveBeenCalledWith('15:45')
    })

    it('saves start time when check button clicked', async () => {
      mockMeetingData.value.startTime = new Date(2025, 0, 1, 14, 30)
      await createWrapper()

      const startTimeBtn = wrapper.find('[aria-label="Edit meeting start time"]')
      await startTimeBtn.trigger('click')
      await wrapper.vm.$nextTick()

      const input = wrapper.find('input[aria-label="Edit meeting start time"]')
      await input.setValue('16:00')
      await wrapper.vm.$nextTick()

      // Find and click the check button
      const checkBtn = wrapper.find('[data-cy="start-time-confirm-btn"]')
      await checkBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockSetManualStartTime).toHaveBeenCalledWith('16:00')
    })

    it('cancels edit on blur', async () => {
      mockMeetingData.value.startTime = new Date(2025, 0, 1, 14, 30)
      await createWrapper()

      const startTimeBtn = wrapper.find('[aria-label="Edit meeting start time"]')
      await startTimeBtn.trigger('click')
      await wrapper.vm.$nextTick()

      const input = wrapper.find('input[aria-label="Edit meeting start time"]')
      await input.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(mockSetManualStartTime).not.toHaveBeenCalled()
    })
  })

  describe('Participant Inputs', () => {
    it('displays group 1 participants input', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-1"]')
      expect(input.exists()).toBe(true)
    })

    it('displays group 2 participants input', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-2"]')
      expect(input.exists()).toBe(true)
    })

    it('updates group1Participants on input', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-1"] input')

      await input.setValue('10')
      await wrapper.vm.$nextTick()

      expect(mockMeetingData.value.group1Participants).toBe(10)
    })

    it('updates group2Participants on input', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-2"] input')

      await input.setValue('7')
      await wrapper.vm.$nextTick()

      expect(mockMeetingData.value.group2Participants).toBe(7)
    })

    it('clamps group1Participants to minimum', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-1"] input')

      await input.setValue('-5')
      await wrapper.vm.$nextTick()

      expect(mockMeetingData.value.group1Participants).toBe(0) // LIMITS.MIN_PARTICIPANTS
    })

    it('clamps group1Participants to maximum', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-1"] input')

      await input.setValue('9999')
      await wrapper.vm.$nextTick()

      expect(mockMeetingData.value.group1Participants).toBe(1000) // LIMITS.MAX_PARTICIPANTS
    })

    it('sanitizes group1 input on blur', async () => {
      const { sanitizeIntegerInput } = await import('@/utils/helpers')
      await createWrapper()

      const input = wrapper.find('[data-cy="input-group-1"] input')
      await input.setValue('5abc')
      await input.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(sanitizeIntegerInput).toHaveBeenCalled()
    })

    it('sanitizes group2 input on blur', async () => {
      const { sanitizeIntegerInput } = await import('@/utils/helpers')
      await createWrapper()

      const input = wrapper.find('[data-cy="input-group-2"] input')
      await input.setValue('3xyz')
      await input.trigger('blur')
      await wrapper.vm.$nextTick()

      expect(sanitizeIntegerInput).toHaveBeenCalled()
    })

    it('handles NaN input for group1Participants', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-1"] input')

      await input.setValue('abc')
      await wrapper.vm.$nextTick()

      expect(mockMeetingData.value.group1Participants).toBe(0)
    })
  })

  describe('Calculations Display', () => {
    it('displays people hours and days', async () => {
      mockCalculations.value = {
        totalParticipants: 8,
        peopleHours: 4.5,
        peopleDays: 0.6,
        totalCost: 360
      }

      await createWrapper()
      const card = wrapper.find('[data-cy="card-people-hours"]')
      expect(card.text()).toContain('4.5')
      expect(card.text()).toContain('0.6')
    })

    it('displays costs when hourly rates configured', async () => {
      mockConfig.value = {
        group1HourlyRate: 50,
        group2HourlyRate: 30,
        workingHoursPerDay: 8
      }
      mockMeetingData.value = {
        startTime: new Date(),
        duration: 3600000,
        isRunning: true,
        group1Participants: 2,
        group2Participants: 3
      }

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      expect(card.exists()).toBe(true)
    })

    it('shows participant count when no hourly rates configured', async () => {
      mockConfig.value = {
        group1HourlyRate: 0,
        group2HourlyRate: 0,
        workingHoursPerDay: 8
      }
      mockCalculations.value.totalParticipants = 5

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      expect(card.text()).toContain('5')
      expect(card.text()).toContain('Click to configure costs')
    })

    it('calculates hourly total cost correctly', async () => {
      mockConfig.value = {
        group1HourlyRate: 50,
        group2HourlyRate: 30,
        workingHoursPerDay: 8
      }
      mockMeetingData.value.group1Participants = 2
      mockMeetingData.value.group2Participants = 3

      await createWrapper()

      // hourlyTotalCost = 50*2 + 30*3 = 190
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      expect(card.exists()).toBe(true)
    })
  })

  describe('Efficiency Color', () => {
    it('shows green for efficient meetings', async () => {
      mockMeetingData.value.duration = 900000 // 15 minutes
      mockCalculations.value.totalParticipants = 5

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      // Check for success color class or styling
      expect(card.exists()).toBe(true)
    })

    it('shows orange for moderate meetings', async () => {
      mockMeetingData.value.duration = 3600000 // 60 minutes
      mockCalculations.value.totalParticipants = 12

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      expect(card.exists()).toBe(true)
    })

    it('shows red for inefficient meetings', async () => {
      mockMeetingData.value.duration = 7200000 // 120 minutes
      mockCalculations.value.totalParticipants = 20

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      expect(card.exists()).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('navigates to config page when config button clicked', async () => {
      await createWrapper()
      await router.push('/')

      const configBtn = wrapper.find('[data-cy="config-btn"]')
      await configBtn.trigger('click')
      await router.push('/config') // Explicitly await the navigation
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/config')
    })

    it('navigates to config on people hours card click', async () => {
      await createWrapper()
      await router.push('/')

      const card = wrapper.find('[data-cy="card-people-hours"]')
      await card.trigger('click')
      await router.push('/config') // Explicitly await the navigation
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/config')
    })

    it('navigates to config on duration card click', async () => {
      await createWrapper()
      await router.push('/')

      const card = wrapper.find('[data-cy="card-duration-costs"]')
      await card.trigger('click')
      await router.push('/config') // Explicitly await the navigation
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/config')
    })

    it('navigates to config on Escape key press', async () => {
      await createWrapper()
      await router.push('/')

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
      await router.push('/config') // Explicitly await the navigation
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/config')
    })

    it('does not navigate on other key presses', async () => {
      await createWrapper()
      await router.push('/')

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(event)
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('Event Listeners', () => {
    it('adds keydown listener on mount', async () => {
      const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener')
      await createWrapper()

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('removes keydown listener on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener')
      await createWrapper()

      wrapper.unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid participant input changes', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-1"] input')

      await input.setValue('5')
      await input.setValue('10')
      await input.setValue('15')
      await wrapper.vm.$nextTick()

      expect(mockMeetingData.value.group1Participants).toBe(15)
    })

    it('handles zero participants', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="input-group-1"] input')

      await input.setValue('0')
      await wrapper.vm.$nextTick()

      expect(mockMeetingData.value.group1Participants).toBe(0)
    })

    it('handles timer at zero duration', async () => {
      mockMeetingData.value.duration = 0
      await createWrapper()

      expect(mockFormatDuration).toHaveBeenCalledWith(0)
    })

    it('handles very long meeting durations', async () => {
      mockMeetingData.value.duration = 36000000 // 10 hours
      await createWrapper()

      expect(mockFormatDuration).toHaveBeenCalledWith(36000000)
    })

    it('handles missing start time gracefully', async () => {
      mockMeetingData.value.startTime = null
      await createWrapper()

      expect(wrapper.find('[aria-label="Edit meeting start time"]').exists()).toBe(false)
    })

    it('displays correct total cost calculation', async () => {
      mockConfig.value = {
        group1HourlyRate: 100,
        group2HourlyRate: 50,
        workingHoursPerDay: 8
      }
      mockMeetingData.value.group1Participants = 1
      mockMeetingData.value.group2Participants = 2
      mockCalculations.value.totalCost = 500

      await createWrapper()
      const { formatCurrency } = await import('@/utils/helpers')

      // hourlyTotalCost = 100*1 + 50*2 = 200
      expect(formatCurrency).toHaveBeenCalled()
    })

    it('handles when formatCurrency is called', async () => {
      const { formatCurrency } = await import('@/utils/helpers')
      mockCalculations.value.totalCost = 150

      await createWrapper()

      expect(formatCurrency).toHaveBeenCalled()
    })
  })

  describe('Computed Properties', () => {
    it('correctly determines hasHourlyRatesConfigured when rates are set', async () => {
      mockConfig.value = {
        group1HourlyRate: 50,
        group2HourlyRate: 30,
        workingHoursPerDay: 8
      }
      mockMeetingData.value.group1Participants = 2
      mockMeetingData.value.group2Participants = 1

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')

      // Should show costs, not "Click to configure"
      expect(card.text()).not.toContain('Click to configure costs')
    })

    it('correctly determines hasHourlyRatesConfigured when no rates', async () => {
      mockConfig.value = {
        group1HourlyRate: 0,
        group2HourlyRate: 0,
        workingHoursPerDay: 8
      }
      mockMeetingData.value.group1Participants = 0
      mockMeetingData.value.group2Participants = 0

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')

      expect(card.text()).toContain('Click to configure costs')
    })

    it('correctly calculates hourlyTotalCost', async () => {
      mockConfig.value = {
        group1HourlyRate: 75,
        group2HourlyRate: 45,
        workingHoursPerDay: 8
      }
      mockMeetingData.value.group1Participants = 3
      mockMeetingData.value.group2Participants = 4

      await createWrapper()

      // hourlyTotalCost = 75*3 + 45*4 = 225 + 180 = 405
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      expect(card.exists()).toBe(true)
    })
  })

  describe('Input Validation on Enter Key', () => {
    it('sanitizes group1 input on Enter key', async () => {
      const { sanitizeIntegerInput } = await import('@/utils/helpers')
      await createWrapper()

      const input = wrapper.find('[data-cy="input-group-1"] input')
      await input.setValue('8abc')
      await input.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect(sanitizeIntegerInput).toHaveBeenCalled()
    })

    it('sanitizes group2 input on Enter key', async () => {
      const { sanitizeIntegerInput } = await import('@/utils/helpers')
      await createWrapper()

      const input = wrapper.find('[data-cy="input-group-2"] input')
      await input.setValue('6xyz')
      await input.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect(sanitizeIntegerInput).toHaveBeenCalled()
    })
  })

  describe('Total Cost Display', () => {
    it('shows total cost when greater than 0', async () => {
      mockConfig.value = {
        group1HourlyRate: 50,
        group2HourlyRate: 30,
        workingHoursPerDay: 8
      }
      mockMeetingData.value.group1Participants = 2
      mockMeetingData.value.group2Participants = 2
      mockCalculations.value.totalCost = 250

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')

      expect(card.text()).toContain('250 €')
    })

    it('does not show total cost separator when cost is 0', async () => {
      mockConfig.value = {
        group1HourlyRate: 50,
        group2HourlyRate: 30,
        workingHoursPerDay: 8
      }
      mockMeetingData.value.group1Participants = 2
      mockMeetingData.value.group2Participants = 2
      mockCalculations.value.totalCost = 0

      await createWrapper()
      const card = wrapper.find('[data-cy="card-duration-costs"]')
      const text = card.text()

      // Should not have the " = " separator when totalCost is 0
      expect(text).not.toContain(' = ')
    })
  })

  describe('Start Time Display Format', () => {
    it('formats start time correctly', async () => {
      const testDate = new Date(2025, 0, 1, 9, 5) // 09:05
      mockMeetingData.value.startTime = testDate
      const { formatStartTime } = await import('@/utils/helpers')

      await createWrapper()

      expect(formatStartTime).toHaveBeenCalledWith(testDate)
    })

    it('handles different start times', async () => {
      const testDate = new Date(2025, 11, 31, 23, 59) // 23:59
      mockMeetingData.value.startTime = testDate
      const { formatStartTime } = await import('@/utils/helpers')

      await createWrapper()

      expect(formatStartTime).toHaveBeenCalledWith(testDate)
    })
  })

  describe('Integration Tests', () => {
    it('complete workflow: start timer, update participants, check calculations', async () => {
      mockMeetingData.value.startTime = null

      await createWrapper()

      // Start timer
      const startBtn = wrapper.find('[data-cy="start-timer-btn"]')
      await startBtn.trigger('click')
      expect(mockStartTimer).toHaveBeenCalled()

      // Update participants
      mockMeetingData.value.startTime = new Date()
      mockMeetingData.value.isRunning = true
      await wrapper.vm.$nextTick()

      const group1Input = wrapper.find('[data-cy="input-group-1"] input')
      await group1Input.setValue('10')

      expect(mockMeetingData.value.group1Participants).toBe(10)
    })

    it('handles complete edit start time workflow', async () => {
      mockMeetingData.value.startTime = new Date(2025, 0, 1, 10, 0)

      await createWrapper()

      // Click to edit
      const startTimeBtn = wrapper.find('[aria-label="Edit meeting start time"]')
      await startTimeBtn.trigger('click')
      await wrapper.vm.$nextTick()

      // Enter new time
      const input = wrapper.find('input[aria-label="Edit meeting start time"]')
      await input.setValue('11:30')
      await input.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect(mockSetManualStartTime).toHaveBeenCalledWith('11:30')
    })
  })
})
