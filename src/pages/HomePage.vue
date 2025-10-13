<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '@/composables/useMeetingStore'
import {
  formatCurrency,
  formatStartTime,
  parseTimeInput,
  isTimeBeforeNow,
  sanitizeIntegerInput,
  helperStatsDataWrite
} from '@/utils/helpers'
import { COLORS, EFFICIENCY_THRESHOLDS } from '@/utils/constants'
import { customIcons } from '@/utils/icons'

// Component name for linting compliance
defineOptions({
  name: 'HomePage'
})

const router = useRouter()
const isEditingStartTime = ref(false)
const editStartTimeValue = ref('')

const {
  config,
  meetingData,
  calculations,
  startTimer,
  stopTimer,
  pauseTimer,
  setManualStartTime,
  formatDuration
} = useMeetingStore()

function startEditingStartTime() {
  if (meetingData.value.startTime) {
    const hours = meetingData.value.startTime.getHours().toString().padStart(2, '0')
    const minutes = meetingData.value.startTime.getMinutes().toString().padStart(2, '0')
    editStartTimeValue.value = `${hours}:${minutes}`
    isEditingStartTime.value = true
  }
}

async function startTimerWithStats() {
  await startTimer()
  await helperStatsDataWrite()
}

function saveStartTime() {
  const parsedTime = parseTimeInput(editStartTimeValue.value)

  if (!parsedTime) {
    // Invalid format
    isEditingStartTime.value = false
    editStartTimeValue.value = ''
    return
  }

  const { hours, minutes } = parsedTime

  // Check if proposed time is before current time
  if (!isTimeBeforeNow(hours, minutes)) {
    isEditingStartTime.value = false
    editStartTimeValue.value = ''
    return
  }

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  setManualStartTime(timeString)

  isEditingStartTime.value = false
  editStartTimeValue.value = ''
}

function cancelEditStartTime() {
  isEditingStartTime.value = false
  editStartTimeValue.value = ''
}

function navigateToConfig(): void {
  router.push('/config')
}

// Computed properties for participant inputs with proper number handling
const group1ParticipantsInput = computed({
  get: () => meetingData.value.group1Participants.toString(),
  set: (value: string) => {
    const numValue = Number.parseInt(value, 10)
    meetingData.value.group1Participants = Number.isNaN(numValue) || numValue < 0 ? 0 : numValue
  }
})

const group2ParticipantsInput = computed({
  get: () => meetingData.value.group2Participants.toString(),
  set: (value: string) => {
    const numValue = Number.parseInt(value, 10)
    meetingData.value.group2Participants = Number.isNaN(numValue) || numValue < 0 ? 0 : numValue
  }
})

// Computed properties for cost calculations
const hasHourlyRatesConfigured = computed(() => {
  return (
    config.value.group1HourlyRate * meetingData.value.group1Participants +
      config.value.group2HourlyRate * meetingData.value.group2Participants >
    0
  )
})

const hourlyTotalCost = computed(() => {
  return (
    config.value.group1HourlyRate * meetingData.value.group1Participants +
    config.value.group2HourlyRate * meetingData.value.group2Participants
  )
})

// Efficiency indicator based on meeting duration and participant count
function getEfficiencyColor(): string {
  const durationMinutes = meetingData.value.duration / (1000 * 60)
  const totalParticipants = calculations.value.totalParticipants

  if (
    durationMinutes <= EFFICIENCY_THRESHOLDS.OPTIMAL_DURATION_MINUTES &&
    totalParticipants <= EFFICIENCY_THRESHOLDS.OPTIMAL_PARTICIPANT_COUNT
  ) {
    return COLORS.SUCCESS // Green - efficient
  }
  if (
    durationMinutes <= EFFICIENCY_THRESHOLDS.ACCEPTABLE_DURATION_MINUTES &&
    totalParticipants <= EFFICIENCY_THRESHOLDS.ACCEPTABLE_PARTICIPANT_COUNT
  ) {
    return COLORS.WARNING // Orange - moderate
  }
  return COLORS.ERROR // Red - potentially inefficient
}

function handleGroup1Input() {
  group1ParticipantsInput.value = sanitizeIntegerInput(group1ParticipantsInput.value)
}

function handleGroup2Input() {
  group2ParticipantsInput.value = sanitizeIntegerInput(group2ParticipantsInput.value)
}

// function getEfficiencyText(): string {
//   const durationMinutes = meetingData.value.duration / (1000 * 60)
//   const totalParticipants = calculations.value.totalParticipants

//   if (
//     durationMinutes <= EFFICIENCY_THRESHOLDS.OPTIMAL_DURATION_MINUTES &&
//     totalParticipants <= EFFICIENCY_THRESHOLDS.OPTIMAL_PARTICIPANT_COUNT
//   ) {
//     return '✓'
//   }
//   if (
//     durationMinutes <= EFFICIENCY_THRESHOLDS.ACCEPTABLE_DURATION_MINUTES &&
//     totalParticipants <= EFFICIENCY_THRESHOLDS.ACCEPTABLE_PARTICIPANT_COUNT
//   ) {
//     return '⚠'
//   }
//   return '⚠'
// }
</script>

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar
      :color="COLORS.PRIMARY"
      dark
      elevation="2"
      class="d-flex justify-space-between"
    >
      <v-toolbar-title class="text-h5 font-weight-medium flex-grow-1">
        Meeting Meter
      </v-toolbar-title>
      <v-btn
        to="/config"
        icon
        variant="text"
        @click="navigateToConfig"
        data-cy="config-btn"
      >
        <v-icon
          right
          class="mr-2"
          >{{ customIcons['cog'] }}</v-icon
        >
      </v-btn>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container
        class="py-8"
        fluid
      >
        <!-- Timer Card -->
        <v-card
          class="mb-6"
          elevation="3"
        >
          <v-card-text class="pa-4">
            <!-- Duration Display -->
            <div class="mb-3">
              <v-row
                justify="space-between"
                no-gutters
              >
                <v-col cols="auto">
                  <div class="d-flex align-center">
                    <!-- Timer Controls -->
                    <div class="mr-3 d-flex align-center">
                      <v-btn
                        v-if="!meetingData.startTime"
                        :color="COLORS.SUCCESS"
                        size="small"
                        variant="elevated"
                        @click="startTimerWithStats"
                        :icon="customIcons['play']"
                        rounded="xl"
                        data-cy="start-timer-btn"
                      />
                      <v-btn
                        v-else-if="meetingData.isRunning"
                        :color="COLORS.WARNING"
                        size="small"
                        variant="elevated"
                        @click="pauseTimer"
                        :icon="customIcons['pause']"
                        rounded="xl"
                        data-cy="pause-timer-btn"
                      />
                      <v-btn
                        v-else
                        :color="COLORS.ERROR"
                        size="small"
                        variant="elevated"
                        @click="stopTimer"
                        :icon="customIcons['stop']"
                        rounded="xl"
                        data-cy="stop-timer-btn"
                      />
                    </div>
                    <v-icon
                      size="32"
                      class="mr-3"
                      >{{ customIcons['timer-outline'] }}</v-icon
                    >
                    <div
                      class="text-h4 font-weight-medium"
                      data-cy="timer-display"
                    >
                      {{ formatDuration(meetingData.duration) }}
                    </div>
                    <div
                      v-if="meetingData.startTime"
                      class="ml-4"
                    >
                      <v-chip
                        v-if="!isEditingStartTime"
                        @click="startEditingStartTime"
                        variant="tonal"
                        size="small"
                        class="cursor-pointer"
                        :prepend-icon="customIcons['clock-outline']"
                        style="font-size: 1.1rem !important; padding: 8px 12px"
                      >
                        {{ formatStartTime(meetingData.startTime) }}
                      </v-chip>
                      <v-text-field
                        v-else
                        v-model="editStartTimeValue"
                        @keyup.enter="saveStartTime"
                        @blur="cancelEditStartTime"
                        variant="outlined"
                        density="compact"
                        placeholder="14:30 or 1430"
                        hint="HH:MM or HHMM format, must be before current time"
                        persistent-hint
                        autofocus
                        style="width: 140px"
                      >
                        <template #append-inner>
                          <v-btn
                            @click="saveStartTime"
                            :icon="customIcons['check']"
                            variant="text"
                            size="small"
                          />
                        </template>
                      </v-text-field>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>

        <!-- Participants Section -->
        <v-card
          class="mb-6"
          elevation="3"
        >
          <v-card-text class="pa-6">
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center">
                  <v-icon
                    class="mr-3"
                    size="28"
                    >{{ customIcons['crown'] }}</v-icon
                  >
                  <v-text-field
                    v-model="group1ParticipantsInput"
                    label="Senior/Management"
                    type="text"
                    inputmode="decimal"
                    variant="outlined"
                    density="comfortable"
                    class="flex-grow-1"
                    data-cy="input-group-1"
                    @blur="handleGroup1Input"
                    @keyup.enter="handleGroup1Input"
                  />
                </div>
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center">
                  <v-icon
                    class="mr-3"
                    size="28"
                    >{{ customIcons['hard-hat'] }}</v-icon
                  >
                  <v-text-field
                    v-model="group2ParticipantsInput"
                    label="Junior/Standard"
                    type="text"
                    inputmode="decimal"
                    variant="outlined"
                    density="comfortable"
                    class="flex-grow-1"
                    data-cy="input-group-2"
                    persistent-hint
                    @blur="handleGroup2Input"
                    @keyup.enter="handleGroup2Input"
                  />
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Calculations Results -->
        <v-card elevation="3">
          <v-card-text>
            <v-row>
              <!-- People Hours / People Days -->
              <v-col
                cols="12"
                md="6"
              >
                <!-- :color="COLORS.SECONDARY" -->
                <v-card
                  variant="tonal"
                  class="text-center pa-4 cursor-pointer"
                  @click="navigateToConfig"
                  data-cy="card-people-hours"
                >
                  <div class="text-h4 font-weight-medium">
                    {{ calculations.peopleHours.toFixed(1) }} /
                    {{ calculations.peopleDays.toFixed(1) }}
                  </div>
                  <div class="text-body-2 mt-1">People hours / days</div>
                </v-card>
              </v-col>

              <!-- Duration Hours and Cost -->
              <!-- :color="COLORS.SECONDARY" -->
              <v-col
                cols="12"
                md="6"
              >
                <v-card
                  variant="tonal"
                  :color="getEfficiencyColor()"
                  @click="navigateToConfig"
                  class="text-center pa-4"
                  data-cy="card-duration-costs"
                >
                  <div v-if="hasHourlyRatesConfigured">
                    <div class="text-h4 font-weight-medium">
                      {{ formatCurrency(hourlyTotalCost) }}/h
                      <span v-if="calculations.totalCost > 0">
                        = {{ formatCurrency(calculations.totalCost) }}
                      </span>
                    </div>
                    <div class="text-body-2 mt-1">
                      {{ calculations.totalParticipants }} Participants
                    </div>
                  </div>
                  <div v-else>
                    <div class="text-h4 font-weight-medium">
                      {{ calculations.totalParticipants }}
                    </div>
                    <div class="text-body-2 mt-1">Participants</div>
                    <div
                      class="mt-1 text-caption"
                      style="font-size: 0.85rem"
                    >
                      (Click to configure costs)
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
