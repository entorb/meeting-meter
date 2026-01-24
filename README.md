# Meeting Meter App (MMA): The "Taxi Meter" for Meetings

Calculate the cost of meetings based on the number of attendees and their hourly rates.
(todo: sync this text to [GitHub.com](https://github.com/entorb/meeting-meter), [PWA-Manifest](public/site.webmanifest), [index.html](index.html))

Deployed to <https://entorb.net/meeting-meter/>

## Build and Run

```sh
# install packages
pnpm install
# format, lint, spell-checker, type-check, vitest
pnpm run check
# run locally in dev mode
pnpm run dev
# build for production
pnpm run build
# run built
pnpm run preview
# run cypress tests headless
pnpm run cy:run
# run cypress tests headless
pnpm run cy:open
# update single package
pnpm up vite
# update all dependencies
pnpm up
```

## Tools used

- [GitHub](https://github.com/entorb/meeting-meter/)
- pnpm
- [SonarQube](https://sonarcloud.io/summary/overall?id=entorb_meeting-meter&branch=main)
- Vue.js
- Vuetify
- Vitest
- Cypress
- ESLint
- Prettier
- CSpell
- Matomo (self-hosted)
