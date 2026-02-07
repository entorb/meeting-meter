<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import { useMeetingStore } from '@/stores/meetingStore'
import { LIMITS } from '@/utils/constants'
import { sanitizeIntegerInput, validateIntegerInput } from '@/utils/helpers'

defineOptions({
  name: 'ConfigurationPage'
})

const router = useRouter()
const meetingStore = useMeetingStore()

const group1HourlyRateInput = computed({
  get: () => meetingStore.config.group1HourlyRate.toString(),
  set: (value: string) => {
    const sanitized = sanitizeIntegerInput(value)
    const numValue = Number.parseInt(sanitized, 10)
    meetingStore.updateConfig({ group1HourlyRate: Number.isNaN(numValue) ? 0 : numValue })
  }
})

const group2HourlyRateInput = computed({
  get: () => meetingStore.config.group2HourlyRate.toString(),
  set: (value: string) => {
    const sanitized = sanitizeIntegerInput(value)
    const numValue = Number.parseInt(sanitized, 10)
    meetingStore.updateConfig({ group2HourlyRate: Number.isNaN(numValue) ? 0 : numValue })
  }
})

const workingHoursPerDayInput = computed({
  get: () => meetingStore.config.workingHoursPerDay.toString(),
  set: (value: string) => {
    const validatedValue = validateIntegerInput(
      value,
      LIMITS.MIN_WORKING_HOURS,
      LIMITS.MAX_WORKING_HOURS,
      LIMITS.MIN_WORKING_HOURS
    )
    meetingStore.updateConfig({ workingHoursPerDay: validatedValue })
  }
})

function navigateBack(): void {
  router.push('/')
}

// Validation handlers
function handleRateValidation(event: Event): void {
  const input = event.target as HTMLInputElement

  if (input.validity.badInput) {
    input.setCustomValidity('')
  }
}

function handleWorkingHoursValidation(event: Event): void {
  const input = event.target as HTMLInputElement

  if (input.validity.valueMissing) {
    input.setCustomValidity('')
  }
}

// Keyboard navigation - Escape key to home page
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    navigateBack()
  }
})
</script>

<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg bg-primary text-white q-pa-md">
      <q-btn
        type="button"
        flat
        round
        size="lg"
        icon="arrow_back"
        text-color="white"
        data-cy="back-btn"
        aria-label="Navigate back to home page"
        @click="navigateBack"
      />
      <div class="col">
        <div class="text-h4">
          <q-icon name="settings" />
          Configuration
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-input
              v-model="group1HourlyRateInput"
              label="Hourly Rate Senior (€)"
              type="number"
              inputmode="decimal"
              min="0"
              step="1"
              filled
              color="primary"
              data-cy="cfg-salary-1"
              aria-label="Hourly rate for managers in euros"
              @invalid="handleRateValidation"
            >
              <template #prepend>
                <q-icon name="school" />
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="group2HourlyRateInput"
              label="Hourly Rate Junior (€)"
              type="number"
              inputmode="decimal"
              min="0"
              step="1"
              filled
              color="primary"
              data-cy="cfg-salary-2"
              aria-label="Hourly rate for workers in euros"
              @invalid="handleRateValidation"
            >
              <template #prepend>
                <q-icon name="engineering" />
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="workingHoursPerDayInput"
              label="Daily Working Hours"
              type="number"
              inputmode="numeric"
              :min="LIMITS.MIN_WORKING_HOURS"
              :max="LIMITS.MAX_WORKING_HOURS"
              step="0.5"
              required
              filled
              color="primary"
              data-cy="working-hours"
              aria-label="Daily working hours"
              @invalid="handleWorkingHoursValidation"
            >
              <template #prepend>
                <q-icon name="schedule" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <PWAInstallPrompt />
  </q-page>
</template>
