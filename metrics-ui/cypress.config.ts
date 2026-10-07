import { defineConfig } from 'cypress'

import { METRICS_UI_DEV_PORT } from './devServerPort.js'

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${METRICS_UI_DEV_PORT}`,
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.ts',
  },
})
