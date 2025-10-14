/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App
 */

// Plugins
import { registerPlugins } from '@/plugins'
import router from '@/router'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import '@/styles/fonts.css'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, _instance, info) => {
  // Log error for debugging
  console.error('Vue error:', err)
  console.error('Error info:', info)
  // In production, you could send this to a monitoring service
}

registerPlugins(app)

// Wait for router to be ready before mounting
router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
  app.mount('#app')
})
