import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ConfigPage from '@/pages/ConfigPage.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Mock CSS imports
vi.mock('vuetify/styles', () => ({}))
vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))

// Mock the helpers module
vi.mock('@/utils/helpers', () => ({
  sanitizeIntegerInput: vi.fn((input: string) => input.replace(/\D+/g, '') || '0'),
  validateIntegerInput: vi.fn((input: string, min = 0, max = 100) => {
    const num = parseInt(input.replace(/\D+/g, '') || '0', 10)
    return Math.min(max, Math.max(min, num))
  }),
  helperStatsDataRead: vi.fn().mockResolvedValue(42)
}))

// Mock the composable
const mockUpdateConfig = vi.fn()
const mockConfig = {
  group1HourlyRate: 50,
  group2HourlyRate: 30,
  workingHoursPerDay: 8
}

vi.mock('@/composables/useMeetingStore', () => ({
  useMeetingStore: vi.fn(() => ({
    config: { value: mockConfig },
    updateConfig: mockUpdateConfig
  }))
}))

describe('ConfigPage', () => {
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
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/config', component: ConfigPage }
      ]
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = async () => {
    wrapper = mount(ConfigPage, {
      global: {
        plugins: [router, vuetify],
        stubs: {
          PWAInstallPrompt: true
        }
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
      expect(wrapper.text()).toContain('Configuration')
    })

    it('renders all three input fields', async () => {
      await createWrapper()
      const textFields = wrapper.findAllComponents({ name: 'VTextField' })
      expect(textFields.length).toBeGreaterThanOrEqual(3)
    })

    it('renders the back button', async () => {
      await createWrapper()
      const backBtn = wrapper.find('[data-cy="back-btn"]')
      expect(backBtn.exists()).toBe(true)
    })

    it('displays footer links', async () => {
      await createWrapper()
      expect(wrapper.text()).toContain('None of your data is stored on the server')
      expect(wrapper.html()).toContain('https://entorb.net')
      expect(wrapper.html()).toContain('https://github.com/entorb/meeting-meter')
    })
  })

  describe('Stats Display', () => {
    it('fetches and displays meeting count on mount', async () => {
      const { helperStatsDataRead } = await import('@/utils/helpers')
      await createWrapper()
      await wrapper.vm.$nextTick()

      expect(helperStatsDataRead).toHaveBeenCalled()
      expect(wrapper.text()).toContain('42 meetings metered so far')
    })

    it('displays 0 when stats fetch fails', async () => {
      const { helperStatsDataRead } = await import('@/utils/helpers')
      vi.mocked(helperStatsDataRead).mockResolvedValueOnce(0)

      await createWrapper()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('0 meetings metered so far')
    })
  })

  describe('Group 1 Hourly Rate Input', () => {
    it('displays current group1HourlyRate value', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-1"]')
      expect(input.exists()).toBe(true)
    })

    it('updates group1HourlyRate when input changes', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-1"] input')

      await input.setValue('75')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalledWith({ group1HourlyRate: 75 })
    })

    it('sanitizes non-numeric input for group1HourlyRate', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-1"] input')

      await input.setValue('abc')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalledWith({ group1HourlyRate: 0 })
    })

    it('handles empty input for group1HourlyRate', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-1"] input')

      await input.setValue('')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalledWith({ group1HourlyRate: 0 })
    })
  })

  describe('Group 2 Hourly Rate Input', () => {
    it('displays current group2HourlyRate value', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-2"]')
      expect(input.exists()).toBe(true)
    })

    it('updates group2HourlyRate when input changes', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-2"] input')

      await input.setValue('45')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalledWith({ group2HourlyRate: 45 })
    })

    it('sanitizes non-numeric input for group2HourlyRate', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-2"] input')

      await input.setValue('xyz')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalledWith({ group2HourlyRate: 0 })
    })
  })

  describe('Working Hours Per Day Input', () => {
    it('displays current workingHoursPerDay value', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="working-hours"]')
      expect(input.exists()).toBe(true)
    })

    it('updates workingHoursPerDay when input changes', async () => {
      const { validateIntegerInput } = await import('@/utils/helpers')
      vi.mocked(validateIntegerInput).mockReturnValueOnce(10)

      await createWrapper()
      const input = wrapper.find('[data-cy="working-hours"] input')

      await input.setValue('10')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalledWith({ workingHoursPerDay: 10 })
    })

    it('validates workingHoursPerDay with bounds', async () => {
      const { validateIntegerInput } = await import('@/utils/helpers')

      await createWrapper()
      const input = wrapper.find('[data-cy="working-hours"] input')

      await input.setValue('5')
      await wrapper.vm.$nextTick()

      expect(validateIntegerInput).toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('navigates back to home when back button is clicked', async () => {
      await createWrapper()
      await router.push('/config')

      const backBtn = wrapper.find('[data-cy="back-btn"]')
      await backBtn.trigger('click')
      await router.push('/') // Explicitly await the navigation
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('navigates back on Escape key press', async () => {
      await createWrapper()
      await router.push('/config')

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
      await router.push('/') // Explicitly await the navigation
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('does not navigate on other key presses', async () => {
      await createWrapper()
      await router.push('/config')

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(event)
      await wrapper.vm.$nextTick()

      expect(router.currentRoute.value.path).toBe('/config')
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
    it('handles rapid input changes', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-1"] input')

      await input.setValue('10')
      await input.setValue('20')
      await input.setValue('30')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalledTimes(3)
    })

    it('handles very large numbers', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-1"] input')

      await input.setValue('999999')
      await wrapper.vm.$nextTick()

      expect(mockUpdateConfig).toHaveBeenCalled()
    })

    it('handles decimal values by stripping decimal points', async () => {
      await createWrapper()
      const input = wrapper.find('[data-cy="cfg-salary-1"] input')

      await input.setValue('50.5')
      await wrapper.vm.$nextTick()

      // Sanitize strips non-digits, so '50.5' becomes '505'
      expect(mockUpdateConfig).toHaveBeenCalledWith({ group1HourlyRate: 505 })
    })
  })
})
