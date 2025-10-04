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
        <v-row justify="center">
          <v-col cols="12" lg="8" xl="6">
            <!-- Salary Group 1 -->
            <v-card class="mb-6" elevation="3">
              <v-card-text class="pa-6">
                <div class="d-flex align-center">
                  <div
                    class="icon-container mr-4"
                    style="width: 32px; display: flex; justify-content: center"
                  >
                    <v-icon size="28">{{ customIcons['crown'] }}</v-icon>
                  </div>
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
                  />
                </div>
              </v-card-text>
            </v-card>

            <!-- Salary Group 2 -->
            <v-card class="mb-6" elevation="3">
              <v-card-text class="pa-6">
                <div class="d-flex align-center">
                  <div
                    class="icon-container mr-4"
                    style="width: 32px; display: flex; justify-content: center"
                  >
                    <v-icon size="28">{{ customIcons['hard-hat'] }}</v-icon>
                  </div>
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
                  />
                </div>
              </v-card-text>
            </v-card>

            <!-- Working Hours -->
            <v-card class="mb-6" elevation="3">
              <v-card-text class="pa-6">
                <div class="d-flex align-center">
                  <div
                    class="icon-container mr-4"
                    style="width: 32px; display: flex; justify-content: center"
                  >
                    <v-icon size="28">{{ customIcons['clock-outline'] }}</v-icon>
                  </div>
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
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { sanitizeIntegerInput, validateIntegerInput } from '@/utils/helpers'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '@/composables/useMeetingStore'
import { COLORS, LIMITS } from '@/utils/constants'
import { customIcons } from '@/utils/icons'

defineOptions({
  name: 'ConfigurationPage',
})

const router = useRouter()
const { config, updateConfig } = useMeetingStore()

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
</script>
