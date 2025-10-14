<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const showInstallPrompt = ref(false)
let deferredPrompt: BeforeInstallPromptEvent | null = null

// Detect if user is on Safari (iOS or macOS) - more robust detection
const isSafari = computed(() => {
  // More reliable Safari detection
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
})

// Check if running on iOS
const isIOS = computed(() => {
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua)
})

// Check if running on macOS
const isMacOS = computed(() => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('mac') && !isIOS.value
})

onMounted(() => {
  // Check if PWA is already installed
  if (globalThis.matchMedia('(display-mode: standalone)').matches) {
    return // Already installed
  }

  // For Safari, show manual instruction prompt
  if (isSafari.value) {
    // Show after a short delay to not interrupt initial page load
    setTimeout(() => {
      showInstallPrompt.value = true
    }, 2000)
    return
  }

  // Listen for the beforeinstallprompt event (Chrome/Edge)
  globalThis.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Save the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent
    // Show the install prompt
    showInstallPrompt.value = true
  })

  // Listen for the appinstalled event
  globalThis.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false
    deferredPrompt = null
  })
})

const installPWA = async () => {
  if (!deferredPrompt) {
    return
  }

  // Show the install prompt
  deferredPrompt.prompt()

  // Wait for the user to respond to the prompt
  await deferredPrompt.userChoice

  // Clear the deferredPrompt variable
  deferredPrompt = null
  showInstallPrompt.value = false
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  // Don't show again for this session
  deferredPrompt = null
}
</script>

<template>
  <v-snackbar
    v-model="showInstallPrompt"
    :timeout="-1"
    location="bottom"
    color="primary"
    variant="elevated"
  >
    <!-- Safari (iOS/macOS) instructions -->
    <div
      v-if="isSafari"
      class="d-flex align-center"
    >
      <v-icon start>mdi-information-outline</v-icon>
      <span v-if="isIOS">
        Tap the Share button
        <v-icon
          size="small"
          class="mx-1"
          >mdi-export-variant</v-icon
        >
        then select "Add to Home Screen"
      </span>
      <span v-else-if="isMacOS">
        Click the Share button in Safari's toolbar, then select "Add to Dock"
      </span>
    </div>

    <!-- Chrome/Edge automatic install -->
    <div
      v-else
      class="d-flex align-center"
    >
      <v-icon start>mdi-download</v-icon>
      <span>Install Meeting Meter as an app for the best experience!</span>
    </div>

    <template #actions>
      <!-- Show Install button only for Chrome/Edge -->
      <v-btn
        v-if="!isSafari"
        variant="text"
        color="white"
        @click="installPWA"
      >
        Install
      </v-btn>
      <v-btn
        variant="text"
        color="white"
        @click="dismissPrompt"
      >
        {{ isSafari ? 'Got it' : 'Later' }}
      </v-btn>
    </template>
  </v-snackbar>
</template>
