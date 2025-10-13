<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const showUpdatePrompt = ref(false)

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    console.log('SW Registered: ' + r)
  },
  onRegisterError(error) {
    console.log('SW registration error', error)
  }
})

// Show update prompt when needed
onMounted(() => {
  if (needRefresh.value) {
    showUpdatePrompt.value = true
  }
})

// Watch for needRefresh changes
watch(needRefresh, value => {
  if (value) {
    showUpdatePrompt.value = true
  }
})

const updatePWA = async () => {
  await updateServiceWorker(true)
  showUpdatePrompt.value = false
}

const dismissUpdate = () => {
  showUpdatePrompt.value = false
}
</script>

<template>
  <v-snackbar
    v-model="showUpdatePrompt"
    :timeout="-1"
    location="top"
    color="success"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon start>mdi-update</v-icon>
      <span>A new version is available!</span>
    </div>

    <template #actions>
      <v-btn
        variant="text"
        color="white"
        @click="updatePWA"
      >
        Update
      </v-btn>
      <v-btn
        variant="text"
        color="white"
        @click="dismissUpdate"
      >
        Later
      </v-btn>
    </template>
  </v-snackbar>
</template>
