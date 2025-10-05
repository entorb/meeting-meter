<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar :color="COLORS.PRIMARY" dark elevation="2">
      <v-btn icon variant="text" @click="navigateBack" data-cy="back-btn">
        <v-icon>{{ customIcons['arrow-left'] }}</v-icon>
      </v-btn>
      <v-toolbar-title class="text-h5 font-weight-medium">
        <v-icon left class="mr-2">{{ customIcons['cog'] }}</v-icon>
        Configuration
      </v-toolbar-title>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container class="py-8" fluid>
        <v-card class="mb-6" elevation="3">
          <v-card-text class="pa-6">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="group1HourlyRateInput"
                  label="Hourly Rate Manager (€)"
                  type="text"
                  inputmode="decimal"
                  variant="outlined"
                  density="comfortable"
                  persistent-hint
                  class="flex-grow-1"
                  data-cy="cfg-salary-1"
                  style="font-size: 1.5rem; min-width: 70px; max-width: 200px"
                  :prepend-icon="customIcons['crown']"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="group2HourlyRateInput"
                  label="Hourly Rate Worker (€)"
                  type="text"
                  inputmode="decimal"
                  variant="outlined"
                  density="comfortable"
                  persistent-hint
                  class="flex-grow-1"
                  data-cy="cfg-salary-2"
                  style="font-size: 1.5rem; min-width: 70px; max-width: 200px"
                  :prepend-icon="customIcons['hard-hat']"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="workingHoursPerDayInput"
                  label="Daily Working Hours"
                  type="text"
                  inputmode="decimal"
                  variant="outlined"
                  density="comfortable"
                  persistent-hint
                  class="flex-grow-1"
                  data-cy="working-hours"
                  style="font-size: 1.5rem; min-width: 70px; max-width: 200px"
                  :prepend-icon="customIcons['clock-outline']"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <PWAInstallPrompt />
        <PWAUpdatePrompt />
        <!-- Footer Section -->
        <v-container class="pt-8 pb-4" fluid>
          <v-row justify="center" align="center">
            <v-col cols="12" md="8" class="text-center">
              <a
                href="https://entorb.net"
                target="_blank"
                class="mb-2 text-primary text-decoration-underline d-inline-block"
                style="margin-right: 16px"
                >Home and Disclaimer</a
              >
              <a
                href="https://github.com/entorb/meeting-meter"
                target="_blank"
                class="mb-2 text-primary text-decoration-underline d-inline-block"
                >GitHub Repo</a
              >
              <div class="mt-4 text-body-2 grey--text">
                {{ meetingsMetered }} meetings metered so far
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { sanitizeIntegerInput, validateIntegerInput, helperStatsDataRead } from '@/utils/helpers'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '@/composables/useMeetingStore'
import { COLORS, LIMITS } from '@/utils/constants'
import { customIcons } from '@/utils/icons'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue'

defineOptions({
  name: 'ConfigurationPage',
})

const router = useRouter()
const { config, updateConfig } = useMeetingStore()

const meetingsMetered = ref<number>(0)

async function fetchMeetingsMetered() {
  meetingsMetered.value = await helperStatsDataRead()
}

const group1HourlyRateInput = computed({
  get: () => config.value.group1HourlyRate.toString(),
  set: (value: string) => {
    const sanitized = sanitizeIntegerInput(value)
    const numValue = parseInt(sanitized, 10)
    updateConfig({ group1HourlyRate: isNaN(numValue) ? 0 : numValue })
  },
})

const group2HourlyRateInput = computed({
  get: () => config.value.group2HourlyRate.toString(),
  set: (value: string) => {
    const sanitized = sanitizeIntegerInput(value)
    const numValue = parseInt(sanitized, 10)
    updateConfig({ group2HourlyRate: isNaN(numValue) ? 0 : numValue })
  },
})

const workingHoursPerDayInput = computed({
  get: () => config.value.workingHoursPerDay.toString(),
  set: (value: string) => {
    const validatedValue = validateIntegerInput(
      value,
      LIMITS.MIN_WORKING_HOURS,
      LIMITS.MAX_WORKING_HOURS,
      LIMITS.MIN_WORKING_HOURS,
    )
    updateConfig({ workingHoursPerDay: validatedValue })
  },
})

function navigateBack(): void {
  router.push('/')
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    navigateBack()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
  fetchMeetingsMetered()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})
</script>
