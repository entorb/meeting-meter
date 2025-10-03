import type { Config } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

export function loadConfig(): Config | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Validate the config structure
    if (
      typeof parsed.group1HourlyRate === 'number' &&
      typeof parsed.group2HourlyRate === 'number' &&
      typeof parsed.workingHoursPerDay === 'number'
    ) {
      return parsed as Config
    }

    return null
  } catch (error) {
    console.warn('Failed to load config from localStorage:', error)
    return null
  }
}

export function saveConfig(config: Config): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch (error) {
    console.warn('Failed to save config to localStorage:', error)
    // Optionally, you could add fallback behavior here if needed
  }
}
