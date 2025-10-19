/// <reference types="cypress" />

// Custom commands for Meeting Meter

// Configure rates helper command
Cypress.Commands.add(
  'configureRates',
  (group1Rate: number, group2Rate: number, workingHours?: number) => {
    cy.visit('/config')

    // Try multiple selector strategies for Vuetify v-text-field
    cy.get('[data-cy="cfg-salary-1"]').within(() => {
      cy.get('input').clear()
      cy.get('input').type(group1Rate.toString())
    })

    cy.get('[data-cy="cfg-salary-2"]').within(() => {
      cy.get('input').clear()
      cy.get('input').type(group2Rate.toString())
    })

    if (workingHours) {
      cy.get('[data-cy="working-hours"]').within(() => {
        cy.get('input').clear()
        cy.get('input').type(workingHours.toString())
      })
    }

    cy.get('[data-cy="back-btn"]').click()
  }
)

// Set participants helper command
Cypress.Commands.add('setParticipants', (group1Count: number, group2Count: number) => {
  // Use within() to scope the search and avoid input concatenation issues
  cy.get('[data-cy="input-group-1"]').within(() => {
    cy.get('input').clear()
    cy.get('input').type(group1Count.toString())
  })

  cy.get('[data-cy="input-group-2"]').within(() => {
    cy.get('input').clear()
    cy.get('input').type(group2Count.toString())
  })
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
