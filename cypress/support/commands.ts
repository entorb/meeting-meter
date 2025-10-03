/// <reference types="cypress" />

// Custom commands for Meeting Meter

// Configure rates helper command
Cypress.Commands.add(
  'configureRates',
  (group1Rate: number, group2Rate: number, workingHours?: number) => {
    cy.visit('/meeting-meter/config')

    cy.get('[data-cy="group1-rate"] input').clear()
    cy.get('[data-cy="group1-rate"] input').type(group1Rate.toString())

    cy.get('[data-cy="group2-rate"] input').clear()
    cy.get('[data-cy="group2-rate"] input').type(group2Rate.toString())

    if (workingHours) {
      cy.get('[data-cy="working-hours"] input').clear()
      cy.get('[data-cy="working-hours"] input').type(workingHours.toString())
    }

    cy.get('[data-cy="back-btn"]').click()
  },
)

// Set participants helper command
Cypress.Commands.add('setParticipants', (group1Count: number, group2Count: number) => {
  // Use force and direct value setting to avoid input concatenation issues
  cy.get('[data-cy="participant-group1"] input').clear()
  cy.get('[data-cy="participant-group1"] input').invoke('val', group1Count.toString())
  cy.get('[data-cy="participant-group1"] input').trigger('input')
  cy.get('[data-cy="participant-group1"] input').trigger('change')

  cy.get('[data-cy="participant-group2"] input').clear()
  cy.get('[data-cy="participant-group2"] input').invoke('val', group2Count.toString())
  cy.get('[data-cy="participant-group2"] input').trigger('input')
  cy.get('[data-cy="participant-group2"] input').trigger('change')
})

// Start timer and wait for it to tick
Cypress.Commands.add('startTimerAndWait', () => {
  cy.get('[data-cy="start-timer-btn"]').click()
  cy.get('[data-cy="timer-display"]').should('not.contain', '0:00:00')
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      configureRates(group1Rate: number, group2Rate: number, workingHours?: number): Chainable<void>
      setParticipants(group1Count: number, group2Count: number): Chainable<void>
      startTimerAndWait(): Chainable<void>
    }
  }
}

export {}
