describe('Application Smoke Test', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/meeting-meter/')
  })
  it('should load the main page', () => {
    cy.get('.v-toolbar-title__placeholder').contains('Meeting Meter').should('be.visible')
    cy.get('[data-cy="timer-display"]').should('contain', '0:00:00')
    cy.get('[data-cy="start-timer-btn"]').should('be.visible')
    cy.get('[data-cy="config-btn"]').should('be.visible')
  })

  it('should load the config page', () => {
    cy.get('[data-cy="config-btn"]').click()
    cy.get('.v-toolbar-title__placeholder').contains('Configuration').should('be.visible')
    cy.get('[data-cy="cfg-salary-1"]').should('be.visible')
    cy.get('[data-cy="cfg-salary-2"]').should('be.visible')
    cy.get('[data-cy="working-hours"]').should('be.visible')
  })
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

  it('should convert hour rate "" to 0', () => {
    cy.get('[data-cy="config-btn"]').click()
    cy.get('[data-cy="cfg-salary-1"] input').clear()
    cy.get('[data-cy="cfg-salary-1"] input').type('100')
    cy.get('[data-cy="cfg-salary-2"] input').clear()
    cy.get('[data-cy="cfg-salary-2"] input').blur() // Leave empty and blur to trigger validation
    // Check localStorage values
    cy.window().then((window) => {
      const config = JSON.parse(window.localStorage.getItem('mcc-config') || '{}')
      expect(config.group1HourlyRate).to.equal(100)
      expect(config.group2HourlyRate).to.equal(0)
    })
  })
})
