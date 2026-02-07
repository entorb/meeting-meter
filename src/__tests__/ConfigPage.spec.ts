import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import ConfigPage from '@/pages/ConfigPage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'

describe('ConfigPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  const createMockRouter = () => {
    return createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/config', name: 'config', component: { template: '<div>Config</div>' } }
      ]
    })
  }

  const createMountOptions = (router: ReturnType<typeof createMockRouter>) => ({
    global: {
      mocks: quasarMocks,
      plugins: [router],
      provide: quasarProvide,
      stubs: {
        ...quasarStubs,
        PWAInstallPrompt: { template: '<div />' }
      }
    }
  })

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(ConfigPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toBeTruthy()
  })

  it('displays the correct title', async () => {
    const router = createMockRouter()
    const wrapper = mount(ConfigPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Configuration')
  })

  it('renders the back button', async () => {
    const router = createMockRouter()
    const wrapper = mount(ConfigPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const backBtn = wrapper.find('[data-cy="back-btn"]')
    expect(backBtn.exists()).toBe(true)
  })

  it('renders group 1 hourly rate input', async () => {
    const router = createMockRouter()
    const wrapper = mount(ConfigPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const input = wrapper.find('[data-cy="cfg-salary-1"]')
    expect(input.exists()).toBe(true)
  })

  it('renders group 2 hourly rate input', async () => {
    const router = createMockRouter()
    const wrapper = mount(ConfigPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const input = wrapper.find('[data-cy="cfg-salary-2"]')
    expect(input.exists()).toBe(true)
  })

  it('renders working hours input', async () => {
    const router = createMockRouter()
    const wrapper = mount(ConfigPage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const input = wrapper.find('[data-cy="working-hours"]')
    expect(input.exists()).toBe(true)
  })

  it('navigates back on Escape key press', async () => {
    const router = createMockRouter()
    await router.push('/config')
    await router.isReady()
    mount(ConfigPage, createMountOptions(router))
    await new Promise(resolve => setTimeout(resolve, 10))

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('does not navigate on other key presses', async () => {
    const router = createMockRouter()
    await router.push('/config')
    mount(ConfigPage, createMountOptions(router))

    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    window.dispatchEvent(event)
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/config')
  })
})
