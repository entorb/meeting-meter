<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
    <PWAInstallPrompt />
    <PWAUpdatePrompt />
  </v-app>
</template>

<script lang="ts" setup>
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue'
</script>
