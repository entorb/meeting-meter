<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const showInstallPrompt = ref(false)
let deferredPrompt: BeforeInstallPromptEvent | null = null

// Simplified platform detection
const platform = computed(() => {
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (ua.includes('mac') && /safari/.test(ua) && !/chrome/.test(ua)) return 'macos'
  return 'other'
})

const isSafari = computed(() => platform.value !== 'other')
const isIOS = computed(() => platform.value === 'ios')
const isMacOS = computed(() => platform.value === 'macos')

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
  <q-dialog
    v-model="showInstallPrompt"
    persistent
  >
    <q-card>
      <q-card-section>
        <div class="text-h6">Install App</div>
      </q-card-section>

      <q-card-section>
        <!-- Safari (iOS/macOS) instructions -->
        <div v-if="isSafari">
          <q-icon name="info_outline" />
          <span v-if="isIOS">
            Tap the Share button
            <q-icon
              name="ios_share"
              size="sm"
            />
            then select "Add to Home Screen"
          </span>
          <span v-else-if="isMacOS">
            Click the Share button in Safari's toolbar, then select "Add to Dock"
          </span>
        </div>

        <!-- Chrome/Edge automatic install -->
        <div v-else>
          <q-icon name="download" />
          Install Meeting Meter as an app for the best experience!
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <!-- Show Install button only for Chrome/Edge -->
        <q-btn
          v-if="!isSafari"
          type="button"
          flat
          label="Install"
          color="primary"
          aria-label="Install application"
          @click="installPWA"
        />
        <q-btn
          type="button"
          flat
          :label="isSafari ? 'Got it' : 'Later'"
          aria-label="Dismiss install prompt"
          @click="dismissPrompt"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
