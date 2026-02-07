import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import HomePage from '@/pages/HomePage.vue'

import { quasarMocks, quasarProvide, quasarStubs } from '@/__tests__/testUtils'

describe('HomePage Component', () => {
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
      stubs: quasarStubs
    }
  })

  it('mounts without errors and renders content', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toBeTruthy()
  })

  it('displays the correct title', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Meeting Meter')
  })

  it('renders config button', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const configBtn = wrapper.find('[data-cy="config-btn"]')
    expect(configBtn.exists()).toBe(true)
  })

  it('renders start timer button when timer not started', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const startBtn = wrapper.find('[data-cy="start-timer-btn"]')
    expect(startBtn.exists()).toBe(true)
  })

  it('renders group 1 participants input', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const input = wrapper.find('[data-cy="input-group-1"]')
    expect(input.exists()).toBe(true)
  })

  it('renders group 2 participants input', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const input = wrapper.find('[data-cy="input-group-2"]')
    expect(input.exists()).toBe(true)
  })

  it('renders people hours card', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const card = wrapper.find('[data-cy="card-people-hours"]')
    expect(card.exists()).toBe(true)
  })

  it('renders duration costs card', async () => {
    const router = createMockRouter()
    const wrapper = mount(HomePage, createMountOptions(router))
    await wrapper.vm.$nextTick()
    const card = wrapper.find('[data-cy="card-duration-costs"]')
    expect(card.exists()).toBe(true)
  })

  it('navigates to config on Escape key press', async () => {
    const router = createMockRouter()
    await router.push('/')
    await router.isReady()
    mount(HomePage, createMountOptions(router))
    await new Promise(resolve => setTimeout(resolve, 10))

    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(router.currentRoute.value.path).toBe('/config/')
  })

  it('does not navigate on other key presses', async () => {
    const router = createMockRouter()
    await router.push('/')
    mount(HomePage, createMountOptions(router))

    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    window.dispatchEvent(event)
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/')
  })
})
