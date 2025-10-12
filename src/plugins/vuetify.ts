/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com
 */

import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { customIcons } from '@/utils/icons'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      ...Object.fromEntries(
        Object.entries(customIcons).map(([key, value]) => [`mdi-${key}`, value])
      )
    },
    sets: {
      mdi
    }
  },
  theme: {
    defaultTheme: 'system'
  },
  defaults: {
    VApp: {
      // Disable Vuetify's default font loading
      style: 'font-family: Roboto, sans-serif !important'
    }
  }
})
