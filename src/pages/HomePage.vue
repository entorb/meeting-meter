<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useMeetingStore } from '@/composables/useMeetingStore'
import { COLORS, EFFICIENCY_THRESHOLDS, TIME_CONSTANTS, LIMITS } from '@/utils/constants'
import {
  formatCurrency,
  formatStartTime,
  sanitizeIntegerInput,
  helperStatsDataWrite,
  helperStatsDataRead
} from '@/utils/helpers'
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

const TIME_PAD_LENGTH = 2
const TIME_PAD_CHAR = '0'

function startEditingStartTime() {
  if (meetingData.value.startTime) {
    const hours = meetingData.value.startTime
      .getHours()
      .toString()
      .padStart(TIME_PAD_LENGTH, TIME_PAD_CHAR)
    const minutes = meetingData.value.startTime
      .getMinutes()
      .toString()
      .padStart(TIME_PAD_LENGTH, TIME_PAD_CHAR)
    editStartTimeValue.value = `${hours}:${minutes}`
    isEditingStartTime.value = true
  }
}

async function startTimerWithStats() {
  await startTimer()
  await helperStatsDataWrite()
}

function saveStartTime() {
  setManualStartTime(editStartTimeValue.value)
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
    if (Number.isNaN(numValue) || numValue < LIMITS.MIN_PARTICIPANTS) {
      meetingData.value.group1Participants = LIMITS.MIN_PARTICIPANTS
    } else if (numValue > LIMITS.MAX_PARTICIPANTS) {
      meetingData.value.group1Participants = LIMITS.MAX_PARTICIPANTS
    } else {
      meetingData.value.group1Participants = numValue
    }
  }
})

const group2ParticipantsInput = computed({
  get: () => meetingData.value.group2Participants.toString(),
  set: (value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (Number.isNaN(numValue) || numValue < LIMITS.MIN_PARTICIPANTS) {
      meetingData.value.group2Participants = LIMITS.MIN_PARTICIPANTS
    } else if (numValue > LIMITS.MAX_PARTICIPANTS) {
      meetingData.value.group2Participants = LIMITS.MAX_PARTICIPANTS
    } else {
      meetingData.value.group2Participants = numValue
    }
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
  const durationMinutes =
    meetingData.value.duration /
    (TIME_CONSTANTS.SECONDS_IN_MINUTE * TIME_CONSTANTS.MILLISECONDS_IN_SECOND)
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

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    router.push('/config/')
  }
}

// Statistics comparisons
const showStatistics = computed(() => {
  return calculations.value.peopleHours > 0 || calculations.value.totalCost > 0
})

const meetingsMetered = ref<number>(0)

async function fetchMeetingsMetered() {
  meetingsMetered.value = await helperStatsDataRead()
}

const alternativeActivities = computed(() => {
  const hours = calculations.value.peopleHours
  return [
    { activity: 'Lines of code written', value: Math.round(hours * 50) },
    { activity: 'Emails answered', value: Math.round(hours * 12) },
    { activity: 'km Jogging', value: Math.round(hours * 10) },
    { activity: 'Drinks consumed', value: Math.round((hours * 60) / 7) },
    { activity: 'Movies watched', value: Math.round(hours * 1.5) }
  ]
})

const alternativePurchases = computed(() => {
  const cost = calculations.value.totalCost
  if (cost === 0) return []

  return [
    { item: 'Coffees', value: Math.round(cost / 2) },
    { item: 'Pizzas', value: Math.round(cost / 15) },
    { item: 'Conference tickets', value: Math.round(cost / 500) },
    { item: 'Laptops', value: Math.round(cost / 1000) }
  ]
})

onMounted(() => {
  globalThis.addEventListener('keydown', handleEscape)
  fetchMeetingsMetered()
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', handleEscape)
})
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
        data-cy="config-btn"
        @click="navigateToConfig"
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
                        :icon="customIcons['play']"
                        rounded="xl"
                        data-cy="start-timer-btn"
                        aria-label="Start meeting timer"
                        @click="startTimerWithStats"
                      />
                      <v-btn
                        v-else-if="meetingData.isRunning"
                        :color="COLORS.WARNING"
                        size="small"
                        variant="elevated"
                        :icon="customIcons['pause']"
                        rounded="xl"
                        data-cy="pause-timer-btn"
                        aria-label="Pause meeting timer"
                        @click="pauseTimer"
                      />
                      <v-btn
                        v-else
                        :color="COLORS.ERROR"
                        size="small"
                        variant="elevated"
                        :icon="customIcons['stop']"
                        rounded="xl"
                        data-cy="stop-timer-btn"
                        aria-label="Stop and reset meeting timer"
                        @click="stopTimer"
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
                      <v-btn
                        v-if="!isEditingStartTime"
                        variant="tonal"
                        size="small"
                        class="cursor-pointer"
                        :prepend-icon="customIcons['clock-outline']"
                        style="
                          font-size: 1.1rem !important;
                          padding: 8px 12px;
                          text-transform: none;
                          letter-spacing: normal;
                        "
                        rounded="pill"
                        aria-label="Edit meeting start time"
                        data-cy="start-time-chip"
                        @click="startEditingStartTime"
                      >
                        {{ formatStartTime(meetingData.startTime) }}
                      </v-btn>
                      <v-text-field
                        v-else
                        v-model="editStartTimeValue"
                        variant="outlined"
                        density="compact"
                        placeholder="14:30 or 1430"
                        hint="HH:MM or HHMM"
                        persistent-hint
                        style="width: 140px"
                        aria-label="Edit meeting start time"
                        aria-describedby="start-time-hint"
                        data-cy="start-time-input"
                        @keyup.enter="saveStartTime"
                        @blur="cancelEditStartTime"
                      >
                        <template #append-inner>
                          <v-btn
                            :icon="customIcons['check']"
                            variant="text"
                            size="small"
                            data-cy="start-time-confirm-btn"
                            @click="saveStartTime"
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
                    aria-label="Number of senior or management participants"
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
                    aria-label="Number of junior or standard participants"
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
                  data-cy="card-people-hours"
                  @click="navigateToConfig"
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
                  class="text-center pa-4"
                  data-cy="card-duration-costs"
                  @click="navigateToConfig"
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

        <!-- Statistics Section -->
        <v-card
          v-if="showStatistics"
          elevation="3"
          class="mt-6"
        >
          <v-card-title class="text-h6 pa-4">
            <v-icon
              class="mr-2"
              size="24"
            >
              {{ customIcons['chart-bar'] }}
            </v-icon>
            What could have been done instead?
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row>
              <!-- Alternative Activities (based on people hours) -->
              <v-col
                v-if="calculations.peopleHours > 0"
                cols="12"
                :md="hasHourlyRatesConfigured && calculations.totalCost > 0 ? 6 : 12"
              >
                <v-list
                  density="compact"
                  class="bg-transparent"
                >
                  <v-list-item
                    v-for="item in alternativeActivities"
                    :key="item.activity"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon
                        size="20"
                        class="mr-2"
                      >
                        {{ customIcons['check-circle'] }}
                      </v-icon>
                    </template>
                    <v-list-item-title>
                      <span class="font-weight-medium">{{ item.value }}</span>
                      {{ item.activity }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>

              <!-- Alternative Purchases (based on cost) -->
              <v-col
                v-if="hasHourlyRatesConfigured && calculations.totalCost > 0"
                cols="12"
                :md="calculations.peopleHours > 0 ? 6 : 12"
              >
                <v-list
                  density="compact"
                  class="bg-transparent"
                >
                  <v-list-item
                    v-for="item in alternativePurchases"
                    :key="item.item"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon
                        size="20"
                        class="mr-2"
                      >
                        {{ customIcons['currency-eur'] }}
                      </v-icon>
                    </template>
                    <v-list-item-title>
                      <span class="font-weight-medium">{{ item.value }}</span>
                      {{ item.item }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <!-- Footer Section -->
        <v-container
          class="pt-8 pb-4"
          fluid
        >
          <v-row
            justify="center"
            align="center"
          >
            <v-col
              cols="12"
              md="8"
              class="text-center"
            >
              <div class="mt-4 text-body-2 grey--text">
                {{ meetingsMetered }} meetings metered so far. None of your data is stored on the
                server.
              </div>
              <div class="mt-4 text-body-2 grey--text">
                <a
                  href="https://entorb.net/contact.php?origin=MeetingMeter"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mb-2 text-primary text-decoration-underline d-inline-block"
                  style="margin-right: 16px"
                  >by Torben</a
                >
                <a
                  href="https://entorb.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mb-2 text-primary text-decoration-underline d-inline-block"
                  style="margin-right: 16px"
                  >Home</a
                >
                <a
                  href="https://entorb.net/impressum.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mb-2 text-primary text-decoration-underline d-inline-block"
                  style="margin-right: 16px"
                  >Disclaimer</a
                >
                <a
                  href="https://github.com/entorb/meeting-meter"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mb-2 text-primary text-decoration-underline d-inline-block"
                  style="margin-right: 16px"
                  >GitHub</a
                >
                <a
                  href="https://www.linkedin.com/posts/menke_meeting-meter-app-mma-activity-7381266281557204993-_y1v"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mb-2 text-primary text-decoration-underline d-inline-block"
                  >LinkedIn Post</a
                >
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
