/// <reference types="cypress" />

// Custom commands for Meeting Meter

// Configure rates helper command
Cypress.Commands.add(
  'configureRates',
  (group1Rate: number, group2Rate: number, workingHours?: number) => {
    cy.visit('/config')

    // Configure Quasar q-input fields - split commands to avoid unsafe chaining
    cy.get('[data-cy="cfg-salary-1"]').clear()
    cy.get('[data-cy="cfg-salary-1"]').type(group1Rate.toString())

    cy.get('[data-cy="cfg-salary-2"]').clear()
    cy.get('[data-cy="cfg-salary-2"]').type(group2Rate.toString())

    if (workingHours) {
      cy.get('[data-cy="working-hours"]').clear()
      cy.get('[data-cy="working-hours"]').type(workingHours.toString())
    }

    cy.get('[data-cy="back-btn"]').click()
  }
)

// Set participants helper command
Cypress.Commands.add('setParticipants', (group1Count: number, group2Count: number) => {
  // Split commands to avoid unsafe chaining
  cy.get('[data-cy="input-group-1"]').clear()
  cy.get('[data-cy="input-group-1"]').type(group1Count.toString())

  cy.get('[data-cy="input-group-2"]').clear()
  cy.get('[data-cy="input-group-2"]').type(group2Count.toString())
})

// Start timer and wait for it to tick
Cypress.Commands.add('startTimerAndWait', () => {
  cy.get('[data-cy="start-timer-btn"]').click()
  cy.get('[data-cy="timer-display"]').should('not.contain', '0:00:00')
})

declare global {
  namespace Cypress {
    interface Chainable {
      configureRates(group1Rate: number, group2Rate: number, workingHours?: number): Chainable<void>
      setParticipants(group1Count: number, group2Count: number): Chainable<void>
      startTimerAndWait(): Chainable<void>
    }
  }
}

export {}
