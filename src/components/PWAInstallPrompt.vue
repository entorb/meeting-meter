<template>
  <v-snackbar
    v-model="showInstallPrompt"
    :timeout="-1"
    location="bottom"
    color="primary"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon start>mdi-download</v-icon>
      <span>Install Meeting Meter as an app for the best experience!</span>
    </div>

    <template #actions>
      <v-btn variant="text" color="white" @click="installPWA"> Install </v-btn>
      <v-btn variant="text" color="white" @click="dismissPrompt"> Later </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const showInstallPrompt = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  // Check if PWA is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return // Already installed
  }

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', e => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Save the event so it can be triggered later
    deferredPrompt = e
    // Show the install prompt
    showInstallPrompt.value = true
  })

  // Listen for the appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed')
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
  const { outcome } = await deferredPrompt.userChoice

  if (outcome === 'accepted') {
    console.log('User accepted the install prompt')
  } else {
    console.log('User dismissed the install prompt')
  }

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
