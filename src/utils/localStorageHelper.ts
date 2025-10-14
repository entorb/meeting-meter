/**
 * Check if localStorage is available and functional
 * @returns true if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Safely get item from localStorage with error handling
 * @param key - The localStorage key
 * @returns The value or null if unavailable
 */
export function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null
  }
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Safely set item in localStorage with error handling
 * @param key - The localStorage key
 * @param value - The value to store
 * @returns true if successful, false otherwise
 */
export function safeSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    // localStorage might be full or disabled
    return false
  }
}

/**
 * Safely remove item from localStorage with error handling
 * @param key - The localStorage key
 * @returns true if successful, false otherwise
 */
export function safeRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
