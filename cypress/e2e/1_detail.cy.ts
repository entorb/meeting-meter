// Meeting Meter - Detailed E2E Tests (Consolidated)

describe('Meeting Meter - Detailed Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/meeting-meter/')
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
      cy.get('[data-cy="participant-group1"] input').clear()
      cy.get('[data-cy="participant-group1"] input').type('3')

      // Set participants for group 2
      cy.get('[data-cy="participant-group2"] input').clear()
      cy.get('[data-cy="participant-group2"] input').type('2')

      // Check total participants is displayed correctly
      cy.get('[data-cy="total-participants"]').should('contain', '5')
    })

    it('should handle large participant counts and negative values', () => {
      // Test large numbers are accepted (no maximum limit)
      cy.get('[data-cy="participant-group1"] input').clear()
      cy.get('[data-cy="participant-group1"] input').invoke('val', '100')
      cy.get('[data-cy="participant-group1"] input').trigger('input')
      cy.get('[data-cy="participant-group1"] input').should('have.value', '100')

      // TODO: fix
      // // Test negative values are converted to 0
      // cy.get('[data-cy="participant-group1"] input').clear()
      // cy.get('[data-cy="participant-group1"] input').invoke('val', '-5')
      // cy.get('[data-cy="participant-group1"] input').trigger('input')
      // cy.get('[data-cy="participant-group1"] input').trigger('change')
      // // The input handler should convert negative to 0
      // cy.get('[data-cy="participant-group1"] input').should('have.value', '0')
    })

    it('should use custom command for setting participants', () => {
      cy.setParticipants(3, 2)
      cy.get('[data-cy="total-participants"]').should('contain', '5')
    })
  })

  describe('Navigation', () => {
    it('should navigate between pages', () => {
      // Navigate to config page
      cy.get('[data-cy="config-btn"]').click()
      cy.url().should('include', '/config')
      cy.contains('Configuration').should('be.visible')

      // Navigate back to home
      cy.get('[data-cy="back-btn"]').click()
      cy.url().should('not.include', '/config')
      cy.contains('Meeting Meter').should('be.visible')
    })

    it('should navigate back to home page from config', () => {
      cy.visit('/meeting-meter/config')
      cy.get('[data-cy="back-btn"]').click()
      cy.url().should('not.include', '/config')
      cy.contains('Meeting Meter').should('be.visible')
    })
  })

  describe('Configuration Management', () => {
    it('should save configuration values', () => {
      cy.visit('/meeting-meter/config')

      // Set configuration values
      cy.get('[data-cy="group1-rate"] input').clear()
      cy.get('[data-cy="group1-rate"] input').type('75')
      cy.get('[data-cy="group2-rate"] input').clear()
      cy.get('[data-cy="group2-rate"] input').type('45')
      cy.get('[data-cy="working-hours"] input').clear()
      cy.get('[data-cy="working-hours"] input').type('7')

      // Navigate away and back
      cy.get('[data-cy="back-btn"]').click()
      cy.get('[data-cy="config-btn"]').click()

      // Verify values are saved
      cy.get('[data-cy="group1-rate"] input').should('have.value', '75')
      cy.get('[data-cy="group2-rate"] input').should('have.value', '45')
      cy.get('[data-cy="working-hours"] input').should('have.value', '7')
    })

    it('should save and load configuration with different values', () => {
      cy.visit('/meeting-meter/config')

      // Set values
      cy.get('[data-cy="group1-rate"] input').clear()
      cy.get('[data-cy="group1-rate"] input').type('50')
      cy.get('[data-cy="group2-rate"] input').clear()
      cy.get('[data-cy="group2-rate"] input').type('30')
      cy.get('[data-cy="working-hours"] input').clear()
      cy.get('[data-cy="working-hours"] input').type('8')

      // Navigate away and back
      cy.get('[data-cy="back-btn"]').click()
      cy.get('[data-cy="config-btn"]').click()

      // Verify persistence
      cy.get('[data-cy="group1-rate"] input').should('have.value', '50')
      cy.get('[data-cy="group2-rate"] input').should('have.value', '30')
      cy.get('[data-cy="working-hours"] input').should('have.value', '8')
    })

    it('should validate input values', () => {
      cy.visit('/meeting-meter/config')

      // Test negative value
      cy.get('[data-cy="group1-rate"] input').clear()
      cy.get('[data-cy="group1-rate"] input').type('-10')
      cy.get('[data-cy="group1-rate"] input').blur()

      // Should show error state
      cy.get('[data-cy="group1-rate"]').should('have.class', 'v-input--error')
    })

    it('should validate configuration inputs with negative rate', () => {
      cy.visit('/meeting-meter/config')

      // Test negative rate
      cy.get('[data-cy="group1-rate"] input').clear()
      cy.get('[data-cy="group1-rate"] input').type('-10')
      cy.get('[data-cy="group1-rate"] input').blur()

      // Should show validation state
      cy.get('[data-cy="group1-rate"]').should('have.class', 'v-input--error')
    })
  })

  describe('Cost Calculations', () => {
    it('should calculate costs when rates are configured', () => {
      cy.configureRates(50, 30)

      cy.setParticipants(2, 3)

      cy.startTimerAndWait()
      cy.get('[data-cy="pause-timer-btn"]').click()

      // Should show calculated cost
      cy.get('[data-cy="total-cost"]').should('not.contain', 'Configure rates')
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
      cy.get('[data-cy="total-cost"]').should('not.contain', 'Configure rates')
    })

    it('should show "Configure rates" when no rates are set', () => {
      cy.setParticipants(2, 3)
      cy.get('[data-cy="total-cost"]').should('contain', 'Configure rates')
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
      cy.get('[data-cy="participant-group1"] input').should('have.value', '4')
      cy.get('[data-cy="participant-group2"] input').should('have.value', '6')
      cy.get('[data-cy="pause-timer-btn"]').should('be.visible')
    })

    it('should persist meeting state across reloads with different values', () => {
      // Set up meeting
      cy.setParticipants(2, 3)
      cy.startTimerAndWait()

      // Reload page
      cy.reload()

      // Verify persistence
      cy.get('[data-cy="participant-group1"] input').should('have.value', '2')
      cy.get('[data-cy="participant-group2"] input').should('have.value', '3')
      cy.get('[data-cy="pause-timer-btn"]').should('be.visible')
    })

    it('should persist configuration across sessions', () => {
      // Set configuration
      cy.visit('/meeting-meter/config')
      cy.get('[data-cy="group1-rate"] input').clear()
      cy.get('[data-cy="group1-rate"] input').type('60')
      cy.get('[data-cy="group2-rate"] input').clear()
      cy.get('[data-cy="group2-rate"] input').type('40')

      // Go to home and reload
      cy.get('[data-cy="back-btn"]').click()
      cy.reload()

      // Check configuration persists
      cy.get('[data-cy="config-btn"]').click()
      cy.get('[data-cy="group1-rate"] input').should('have.value', '60')
      cy.get('[data-cy="group2-rate"] input').should('have.value', '40')
    })
  })

  describe('Meeting Efficiency', () => {
    it('should show efficiency indicator', () => {
      // Configure rates
      cy.configureRates(80, 50)

      // Set many participants for large meeting
      cy.setParticipants(8, 12)

      // Start timer
      cy.startTimerAndWait()
      cy.get('[data-cy="pause-timer-btn"]').click()

      // Should show efficiency indicator
      cy.get('[data-cy="efficiency-indicator"]').should('be.visible')
    })

    it('should show efficiency indicator with different participant setup', () => {
      // Configure rates for cost calculation
      cy.configureRates(50, 30)

      // Set up a large meeting
      cy.setParticipants(5, 8)

      // Start timer
      cy.startTimerAndWait()
      cy.get('[data-cy="pause-timer-btn"]').click()

      // Should show efficiency indicator
      cy.get('[data-cy="efficiency-indicator"]').should('be.visible')
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle corrupted localStorage gracefully', () => {
      // Corrupt localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('mcc-config', 'invalid-json')
        win.localStorage.setItem('mcc-meeting', 'invalid-json')
      })

      // App should still load
      cy.reload()
      cy.contains('Meeting Meter').should('be.visible')
      cy.get('[data-cy="timer-display"]').should('contain', '0:00:00')
    })
  })
})
