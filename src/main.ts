/**
 * main.ts
 *
 * Bootstraps Quasar and other plugins then mounts the App
 */

import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog, Loading, Dark } from 'quasar'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

// Styles
import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'

// Enable dark mode
Dark.set(true)

createApp(App)
  .use(createPinia())
  .use(router)
  .use(Quasar, {
    plugins: { Notify, Dialog, Loading },
    config: {
      dark: true,
      notify: {
        position: 'top',
        timeout: 3000
      }
    }
  })
  .mount('#app')
