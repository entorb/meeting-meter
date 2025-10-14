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

    it('should handle timer operations with participants', () => {
      // Set participants first
      cy.setParticipants(2, 3)

      // Start timer and let it run briefly
      cy.startTimerAndWait()

      // Pause timer
      cy.get('[data-cy="pause-timer-btn"]').click()

      // Verify timer shows elapsed time
      cy.get('[data-cy="timer-display"]').should('not.contain', '0:00:00')
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
    })

    it('should calculate costs correctly with detailed setup', () => {
      // Configure rates
      cy.configureRates(50, 30)

      // Set participants
      cy.setParticipants(2, 3)

      // Start timer briefly
      cy.startTimerAndWait()
      cy.get('[data-cy="pause-timer-btn"]').click()

      // Should show calculated cost instead of "Configure rates"
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
    it('should navigate from home to config page with ESC key', () => {
      // Start on home page
      cy.url().should('not.include', '/config')
      cy.contains('Meeting Meter').should('be.visible')

      // Press ESC key to navigate to config
      cy.get('body').type('{esc}')

      // Should navigate to config page
      cy.url().should('include', '/config')
      cy.contains('Configuration').should('be.visible')
    })

    it('should navigate from config to home page with ESC key', () => {
      // Navigate to config page
      cy.get('[data-cy="config-btn"]').click()
      cy.url().should('include', '/config')
      cy.contains('Configuration').should('be.visible')

      // Press ESC key to navigate back to home
      cy.get('body').type('{esc}')

      // Should navigate back to home page
      cy.url().should('not.include', '/config')
      cy.contains('Meeting Meter').should('be.visible')
    })

    it('should toggle between pages multiple times with ESC key', () => {
      // Start on home
      cy.url().should('not.include', '/config')

      // ESC to config
      cy.get('body').type('{esc}')
      cy.url().should('include', '/config')

      // ESC to home
      cy.get('body').type('{esc}')
      cy.url().should('not.include', '/config')

      // ESC to config again
      cy.get('body').type('{esc}')
      cy.url().should('include', '/config')

      // ESC to home again
      cy.get('body').type('{esc}')
      cy.url().should('not.include', '/config')
    })
  })
})
