describe('Detailed Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  describe('Timer Operations', () => {
    it('should start and stop timer', () => {
      // Initial timer state
      cy.get('[data-cy="timer-display"]').should('contain', '0:00:00')

      // Start timer
      cy.get('[data-cy="start-timer-btn"]').click()
      cy.get('[data-cy="pause-timer-btn"]').should('be.visible')
      cy.get('[data-cy="timer-display"]').should('not.contain', '0:00:00')

      // Pause timer
      cy.get('[data-cy="pause-timer-btn"]').click()
      cy.get('[data-cy="stop-timer-btn"]').should('be.visible')

      // Stop timer
      cy.get('[data-cy="stop-timer-btn"]').click()
      cy.get('[data-cy="timer-display"]').should('contain', '0:00:00')
      cy.get('[data-cy="start-timer-btn"]').should('be.visible')
    })
  })

  describe('Participant Management', () => {
    it('should update participant counts', () => {
      // Set participants for group 1
      cy.get('[data-cy="input-group-1"] input').clear()
      cy.get('[data-cy="input-group-1"] input').type('11')

      // Set participants for group 2
      cy.get('[data-cy="input-group-2"] input').clear()
      cy.get('[data-cy="input-group-2"] input').type('22')

      // Check total participants is displayed correctly
      cy.get('[data-cy="card-duration-costs"]').should('contain', '33')
    })
  })

  describe('Cost Calculations', () => {
    it('should calculate costs when rates are configured', () => {
      cy.configureRates(50, 30)
      cy.setParticipants(2, 3)

      cy.startTimerAndWait()
      cy.get('[data-cy="pause-timer-btn"]').click()

      // Should show calculated cost
      cy.get('[data-cy="card-duration-costs"]').should('not.contain', 'Configure rates')
      cy.get('[data-cy="card-duration-costs"]').should('contain', '190')
    })
  })

  describe('Data Persistence', () => {
    it('should persist meeting data across page reloads', () => {
      // Set up meeting
      cy.setParticipants(4, 6)
      cy.startTimerAndWait()

      // Reload page
      cy.reload()

      // Check if data persists
      cy.get('[data-cy="input-group-1"] input').should('have.value', '4')
      cy.get('[data-cy="input-group-2"] input').should('have.value', '6')
      cy.get('[data-cy="pause-timer-btn"]').should('be.visible')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should toggle between pages with ESC key', () => {
      // Start on home page
      cy.url().should('not.include', '/config')
      cy.contains('Meeting Meter').should('be.visible')

      // ESC to navigate to config
      cy.get('body').type('{esc}')
      cy.url().should('include', '/config')
      cy.contains('Configuration').should('be.visible')

      // ESC to navigate back to home
      cy.get('body').type('{esc}')
      cy.url().should('not.include', '/config')
      cy.contains('Meeting Meter').should('be.visible')
    })
  })

  describe('Manual Start Time Editing', () => {
    it('should allow editing start time by clicking the start time chip', () => {
      // Start timer first
      cy.get('[data-cy="start-timer-btn"]').click()
      // Wait for timer to tick (use assertion instead of arbitrary wait)
      cy.get('[data-cy="timer-display"]').should('not.contain', '0:00:00')

      // Find and click the start time chip
      cy.get('[data-cy="start-time-chip"]').should('be.visible')
      cy.get('[data-cy="start-time-chip"]').click()

      // Dialog or input should appear for editing start time
      cy.get('[data-cy="start-time-input"]').should('be.visible')
    })

    it('should update timer duration when start time is edited', () => {
      // Configure rates and participants for visible cost calculation
      cy.configureRates(50, 30)
      cy.setParticipants(2, 3)

      // Start timer
      cy.get('[data-cy="start-timer-btn"]').click()
      // Wait for timer to tick (use assertion instead of arbitrary wait)
      cy.get('[data-cy="timer-display"]').should('not.contain', '0:00:00')

      // Get current time and calculate a time 30 minutes ago
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      const timeString = `${thirtyMinutesAgo.getHours().toString().padStart(2, '0')}:${thirtyMinutesAgo.getMinutes().toString().padStart(2, '0')}`

      // Click start time chip and edit
      cy.get('[data-cy="start-time-chip"]').click()
      cy.get('[data-cy="start-time-input"] input').clear()
      cy.get('[data-cy="start-time-input"] input').type(timeString)
      cy.get('[data-cy="start-time-confirm-btn"]').click()

      // Timer should show approximately 30 minutes
      cy.get('[data-cy="timer-display"]').should('contain', '0:30:')
    })
  })
})
