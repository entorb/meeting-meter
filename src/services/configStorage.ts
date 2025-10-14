import type { Config } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'
import { safeGetItem, safeSetItem } from '@/utils/localStorageHelper'

export function loadConfig(): Config | null {
  try {
    const stored = safeGetItem(STORAGE_KEYS.CONFIG)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Validate the config structure with additional type safety
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.group1HourlyRate === 'number' &&
      typeof parsed.group2HourlyRate === 'number' &&
      typeof parsed.workingHoursPerDay === 'number' &&
      !Number.isNaN(parsed.group1HourlyRate) &&
      !Number.isNaN(parsed.group2HourlyRate) &&
      !Number.isNaN(parsed.workingHoursPerDay)
    ) {
      return parsed as Config
    }

    return null
  } catch {
    // Return null on any error - app will use defaults
    return null
  }
}

export function saveConfig(config: Config): void {
  try {
    safeSetItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch {
    // Silently fail - localStorage might be full or disabled
  }
}
