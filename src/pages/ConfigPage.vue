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
                    v-model="localConfig.group1HourlyRate"
                    label="Hourly Rate Manager (€)"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    min="0"
                    step="5"
                    persistent-hint
                    class="flex-grow-1"
                    data-cy="group1-rate"
                    :rules="[
                      (v) =>
                        v === '' ||
                        (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) ||
                        'Must be a positive number',
                    ]"
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
                    v-model="localConfig.group2HourlyRate"
                    label="Hourly Rate Worker (€)"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    min="0"
                    step="5"
                    persistent-hint
                    class="flex-grow-1"
                    data-cy="group2-rate"
                    :rules="[
                      (v) =>
                        v === '' ||
                        (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) ||
                        'Must be a positive number',
                    ]"
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
                    v-model="localConfig.workingHoursPerDay"
                    label="Daily Working Hours"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    min="1"
                    max="24"
                    step="0.5"
                    persistent-hint
                    class="flex-grow-1"
                    data-cy="working-hours"
                    :rules="[
                      (v) =>
                        v === '' ||
                        (!isNaN(parseFloat(v)) &&
                          parseFloat(v) >= LIMITS.MIN_WORKING_HOURS &&
                          parseFloat(v) <= LIMITS.MAX_WORKING_HOURS) ||
                        `Must be between ${LIMITS.MIN_WORKING_HOURS} and ${LIMITS.MAX_WORKING_HOURS} hours`,
                    ]"
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '@/composables/useMeetingStore'
import { LIMITS, COLORS } from '@/utils/constants'
import { customIcons } from '@/utils/icons'

defineOptions({
  name: 'ConfigurationPage',
})

const router = useRouter()
const { config, updateConfig } = useMeetingStore()

// Local form state for better UX
const localConfig = ref({
  group1HourlyRate: '',
  group2HourlyRate: '',
  workingHoursPerDay: '',
})

// Load current config into form
onMounted(() => {
  localConfig.value = {
    group1HourlyRate: config.value.group1HourlyRate.toString(),
    group2HourlyRate: config.value.group2HourlyRate.toString(),
    workingHoursPerDay: config.value.workingHoursPerDay.toString(),
  }
})

// Save configuration when form changes
watch(
  localConfig,
  (newConfig) => {
    try {
      const configToSave = {
        group1HourlyRate: Math.max(0, parseFloat(newConfig.group1HourlyRate) || 0),
        group2HourlyRate: Math.max(0, parseFloat(newConfig.group2HourlyRate) || 0),
        workingHoursPerDay: Math.max(
          1,
          Math.min(24, parseFloat(newConfig.workingHoursPerDay) || 8),
        ),
      }
      updateConfig(configToSave)
    } catch (error) {
      console.error('Failed to save configuration:', error)
    }
  },
  { deep: true },
)

function navigateBack(): void {
  router.push('/')
}
</script>
