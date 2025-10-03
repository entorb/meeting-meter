export interface Config {
  group1HourlyRate: number
  group2HourlyRate: number
  workingHoursPerDay: number
}

export interface MeetingData {
  startTime: Date | null
  duration: number
  isRunning: boolean
  group1Participants: number
  group2Participants: number
}

export interface Calculations {
  durationHours: number
  peopleHours: number
  peopleDays: number
  totalCost: number
  totalParticipants: number
  group1Cost: number
  group2Cost: number
}
