<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useMeetingStore } from '@/stores/meetingStore'
import { EFFICIENCY_THRESHOLDS, TIME_CONSTANTS, LIMITS } from '@/utils/constants'
import {
  formatCurrency,
  formatStartTime,
  sanitizeIntegerInput,
  helperStatsDataWrite,
  helperStatsDataRead,
  parseTimeInput,
  isTimeBeforeNow
} from '@/utils/helpers'

defineOptions({
  name: 'HomePage'
})

const router = useRouter()
const isEditingStartTime = ref(false)
const editStartTimeValue = ref('')

const meetingStore = useMeetingStore()

function startEditingStartTime() {
  if (meetingStore.meetingData.startTime) {
    editStartTimeValue.value = formatStartTime(meetingStore.meetingData.startTime)
    isEditingStartTime.value = true
  }
}

async function startTimerWithStats() {
  meetingStore.startTimer()
  await helperStatsDataWrite()
}

function saveStartTime() {
  meetingStore.setManualStartTime(editStartTimeValue.value)
  isEditingStartTime.value = false
  editStartTimeValue.value = ''
}

function cancelEditStartTime() {
  isEditingStartTime.value = false
  editStartTimeValue.value = ''
}

// Create reusable participant input computed
function createParticipantInput(key: 'group1Participants' | 'group2Participants') {
  return computed({
    get: () => meetingStore.meetingData[key].toString(),
    set: (value: string) => {
      const num = Number.parseInt(value, 10)
      meetingStore.meetingData[key] = Number.isNaN(num)
        ? LIMITS.MIN_PARTICIPANTS
        : Math.max(LIMITS.MIN_PARTICIPANTS, Math.min(LIMITS.MAX_PARTICIPANTS, num))
    }
  })
}

const group1ParticipantsInput = createParticipantInput('group1Participants')
const group2ParticipantsInput = createParticipantInput('group2Participants')

// Computed properties for cost calculations
const hasHourlyRatesConfigured = computed(() => {
  return (
    meetingStore.config.group1HourlyRate * meetingStore.meetingData.group1Participants +
      meetingStore.config.group2HourlyRate * meetingStore.meetingData.group2Participants >
    0
  )
})

const hourlyTotalCost = computed(() => {
  return (
    meetingStore.config.group1HourlyRate * meetingStore.meetingData.group1Participants +
    meetingStore.config.group2HourlyRate * meetingStore.meetingData.group2Participants
  )
})

// Efficiency indicator based on meeting duration and participant count
function getEfficiencyColor(): string {
  const durationMinutes =
    meetingStore.meetingData.duration /
    (TIME_CONSTANTS.SECONDS_IN_MINUTE * TIME_CONSTANTS.MILLISECONDS_IN_SECOND)
  const totalParticipants = meetingStore.calculations.totalParticipants

  if (
    durationMinutes <= EFFICIENCY_THRESHOLDS.OPTIMAL_DURATION_MINUTES &&
    totalParticipants <= EFFICIENCY_THRESHOLDS.OPTIMAL_PARTICIPANT_COUNT
  ) {
    return 'bg-positive' // Green - efficient
  }
  if (
    durationMinutes <= EFFICIENCY_THRESHOLDS.ACCEPTABLE_DURATION_MINUTES &&
    totalParticipants <= EFFICIENCY_THRESHOLDS.ACCEPTABLE_PARTICIPANT_COUNT
  ) {
    return 'bg-warning' // Orange - moderate
  }
  return 'bg-negative' // Red - potentially inefficient
}

function handleGroup1Input() {
  group1ParticipantsInput.value = sanitizeIntegerInput(group1ParticipantsInput.value)
}

function handleGroup2Input() {
  group2ParticipantsInput.value = sanitizeIntegerInput(group2ParticipantsInput.value)
}

// Validation error handler for participant inputs
function handleParticipantValidation(event: Event) {
  const input = event.target as HTMLInputElement

  if (input.validity.rangeOverflow) {
    input.setCustomValidity(`Maximum ${LIMITS.MAX_PARTICIPANTS} participants allowed`)
  } else if (input.validity.rangeUnderflow) {
    input.setCustomValidity(`Minimum ${LIMITS.MIN_PARTICIPANTS} participants required`)
  } else if (input.validity.valueMissing) {
    input.setCustomValidity('Participant count is required')
  } else if (input.validity.badInput) {
    input.setCustomValidity('Please enter a valid number')
  } else {
    input.setCustomValidity('')
  }
}

// Validation error handler for start time input
function handleStartTimeValidation(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value

  // Check format
  const parsedTime = parseTimeInput(value)
  if (!parsedTime) {
    input.setCustomValidity('Invalid time format. Use HH:MM or HHMM')
    return
  }

  // Check if time is in the future
  const { hours, minutes } = parsedTime
  if (!isTimeBeforeNow(hours, minutes)) {
    input.setCustomValidity('Start time cannot be in the future')
    return
  }

  input.setCustomValidity('')
}

// Keyboard navigation - Escape key to config page
useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    router.push('/config/')
  }
})

// Statistics comparisons
const showStatistics = computed(() => {
  return meetingStore.calculations.peopleHours > 0 || meetingStore.calculations.totalCost > 0
})

const meetingsMetered = ref<number>(0)

async function fetchMeetingsMetered() {
  meetingsMetered.value = await helperStatsDataRead()
}

const alternativeActivities = computed(() => {
  const hours = meetingStore.calculations.peopleHours
  return [
    { activity: 'Lines of code written', value: Math.round(hours * 50) },
    { activity: 'Emails answered', value: Math.round(hours * 12) },
    { activity: 'km jogging', value: Math.round(hours * 10) },
    { activity: 'Drinks consumed', value: Math.round((hours * 60) / 7) },
    { activity: 'Movies watched', value: Math.round(hours * 1.5) }
  ]
})

const alternativePurchases = computed(() => {
  const cost = meetingStore.calculations.totalCost
  if (cost === 0) return []

  return [
    { item: 'Coffees', value: Math.round(cost / 2) },
    { item: 'Pizzas', value: Math.round(cost / 15) },
    { item: 'Conference tickets', value: Math.round(cost / 500) },
    { item: 'Laptops', value: Math.round(cost / 1000) }
  ]
})

onMounted(() => {
  fetchMeetingsMetered()
})
</script>

<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-lg bg-primary text-white q-pa-md">
      <div class="col-auto">
        <div class="text-h4">Meeting Meter</div>
      </div>
      <div class="col row justify-center">
        <q-btn
          v-if="!meetingStore.meetingData.startTime"
          type="button"
          color="positive"
          round
          icon="play_arrow"
          data-cy="start-timer-btn"
          aria-label="Start meeting timer"
          @click="startTimerWithStats"
        />
        <q-btn
          v-else-if="meetingStore.meetingData.isRunning"
          type="button"
          color="warning"
          round
          icon="pause"
          data-cy="pause-timer-btn"
          aria-label="Pause meeting timer"
          @click="meetingStore.pauseTimer"
        />
        <q-btn
          v-else
          type="button"
          color="negative"
          round
          icon="delete"
          data-cy="stop-timer-btn"
          aria-label="Stop and reset meeting timer"
          @click="meetingStore.stopTimer"
        />
      </div>
      <q-btn
        type="button"
        flat
        round
        size="lg"
        icon="settings"
        text-color="white"
        to="/config"
        data-cy="config-btn"
        aria-label="Open configuration"
      />
    </div>

    <!-- Participants Section -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="group1ParticipantsInput"
              label="Senior"
              type="number"
              inputmode="numeric"
              :min="LIMITS.MIN_PARTICIPANTS"
              :max="LIMITS.MAX_PARTICIPANTS"
              step="1"
              required
              filled
              color="primary"
              data-cy="input-group-1"
              aria-label="Number of senior or management participants"
              @blur="handleGroup1Input"
              @keyup.enter="handleGroup1Input"
              @invalid="handleParticipantValidation"
            >
              <template #prepend>
                <q-icon name="school" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="group2ParticipantsInput"
              label="Junior"
              type="number"
              inputmode="numeric"
              :min="LIMITS.MIN_PARTICIPANTS"
              :max="LIMITS.MAX_PARTICIPANTS"
              step="1"
              required
              filled
              color="primary"
              data-cy="input-group-2"
              aria-label="Number of junior or standard participants"
              @blur="handleGroup2Input"
              @keyup.enter="handleGroup2Input"
              @invalid="handleParticipantValidation"
            >
              <template #prepend>
                <q-icon name="engineering" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Timer Card -->
    <q-card
      v-if="meetingStore.meetingData.startTime"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="timer-container">
          <!-- Timer Display -->
          <div class="timer-display">
            <q-icon
              size="lg"
              name="timer"
            />
            <div
              class="timer-text"
              data-cy="timer-display"
            >
              {{ meetingStore.formatDuration(meetingStore.meetingData.duration) }}
            </div>
          </div>

          <!-- Start Time -->
          <div
            v-if="meetingStore.meetingData.startTime"
            class="timer-start-time"
          >
            <q-chip
              v-if="!isEditingStartTime"
              clickable
              outline
              icon="schedule"
              size="md"
              data-cy="start-time-chip"
              aria-label="Edit meeting start time"
              @click="startEditingStartTime"
            >
              {{ formatStartTime(meetingStore.meetingData.startTime) }}
            </q-chip>
            <q-input
              v-else
              v-model="editStartTimeValue"
              type="text"
              pattern="^([0-1]?[0-9]|2[0-3]):?[0-5][0-9]$"
              outlined
              dense
              color="primary"
              placeholder="14:30 or 1430"
              hint="HH:MM or HHMM"
              class="start-time-input"
              aria-label="Edit meeting start time"
              data-cy="start-time-input"
              @keyup.enter="saveStartTime"
              @blur="cancelEditStartTime"
              @invalid="handleStartTimeValidation"
            >
              <template #append>
                <q-btn
                  type="button"
                  icon="check"
                  flat
                  dense
                  data-cy="start-time-confirm-btn"
                  aria-label="Confirm start time"
                  @click="saveStartTime"
                />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Calculations Results -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- People Hours / People Days -->
          <div class="col-12 col-sm-6">
            <q-card
              flat
              bordered
              class="text-center cursor-pointer"
              data-cy="card-people-hours"
              @click="router.push('/config')"
            >
              <q-card-section>
                <div class="text-h4">
                  {{ meetingStore.calculations.peopleHours.toFixed(1) }} /
                  {{ meetingStore.calculations.peopleDays.toFixed(1) }}
                </div>
                <div class="text-caption">People hours / days</div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Duration Hours and Cost -->
          <div class="col-12 col-sm-6">
            <q-card
              flat
              bordered
              :class="`text-center cursor-pointer ${getEfficiencyColor()}`"
              data-cy="card-duration-costs"
              @click="router.push('/config')"
            >
              <q-card-section>
                <div v-if="hasHourlyRatesConfigured">
                  <div class="text-h4">
                    {{ formatCurrency(hourlyTotalCost) }}/h
                    <span v-if="meetingStore.calculations.totalCost > 0">
                      = {{ formatCurrency(meetingStore.calculations.totalCost) }}
                    </span>
                  </div>
                  <div class="text-caption">
                    {{ meetingStore.calculations.totalParticipants }} Participants
                  </div>
                </div>
                <div v-else>
                  <div class="text-h4">
                    {{ meetingStore.calculations.totalParticipants }}
                  </div>
                  <div class="text-caption">Participants</div>
                  <div class="text-caption q-mt-xs">(Click to configure costs)</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Statistics Section -->
    <q-card
      v-if="showStatistics"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="bar_chart" />
          What could have been done instead?
        </div>
        <div class="row q-col-gutter-md">
          <!-- Alternative Activities (based on people hours) -->
          <div
            v-if="meetingStore.calculations.peopleHours > 0"
            class="col-12"
            :class="
              hasHourlyRatesConfigured && meetingStore.calculations.totalCost > 0 ? 'col-sm-6' : ''
            "
          >
            <q-list dense>
              <q-item
                v-for="item in alternativeActivities"
                :key="item.activity"
              >
                <q-item-section avatar>
                  <q-icon name="check_circle" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <span class="text-weight-medium">{{ item.value }}</span>
                    {{ item.activity }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Alternative Purchases (based on cost) -->
          <div
            v-if="hasHourlyRatesConfigured && meetingStore.calculations.totalCost > 0"
            class="col-12"
            :class="meetingStore.calculations.peopleHours > 0 ? 'col-sm-6' : ''"
          >
            <q-list dense>
              <q-item
                v-for="item in alternativePurchases"
                :key="item.item"
              >
                <q-item-section avatar>
                  <q-icon name="euro" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <span class="text-weight-medium">{{ item.value }}</span>
                    {{ item.item }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Footer Section -->
    <div class="text-center q-mt-lg q-mb-md">
      <div class="text-caption text-grey-7 q-mb-sm">
        {{ meetingsMetered }} meetings metered so far. None of your data is stored on the server.
      </div>
      <div class="footer-links">
        <a
          href="https://entorb.net/contact.php?origin=MeetingMeter"
          target="_blank"
          rel="noopener noreferrer"
          >by Torben</a
        >
        <a
          href="https://entorb.net"
          target="_blank"
          rel="noopener noreferrer"
          >Home</a
        >
        <a
          href="https://entorb.net/impressum.php"
          target="_blank"
          rel="noopener noreferrer"
          >Disclaimer</a
        >
        <a
          href="https://github.com/entorb/meeting-meter"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub</a
        >
        <a
          href="https://www.linkedin.com/posts/menke_meeting-meter-app-mma-activity-7381266281557204993-_y1v"
          target="_blank"
          rel="noopener noreferrer"
          >LinkedIn Post</a
        >
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

a {
  color: var(--q-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Timer container - responsive layout */
.timer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: center;
}

.timer-text {
  font-size: 2.5rem;
  font-weight: 400;
  line-height: 1.2;
}

.timer-start-time {
  width: 100%;
  display: flex;
  justify-content: center;
}

.start-time-input {
  width: 100%;
  max-width: 200px;
}

/* Footer links - wrap on mobile */
.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 16px;
  font-size: 0.75rem;
}

/* Tablet and up */
@media (min-width: 600px) {
  .timer-container {
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .timer-display {
    width: auto;
  }

  .timer-start-time {
    width: auto;
  }

  .timer-text {
    font-size: 2.125rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .timer-text {
    font-size: 2.125rem;
  }
}
</style>
