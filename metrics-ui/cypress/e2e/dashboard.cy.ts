describe('MCP usage dashboard', () => {
  it('loads home pins and section routes', () => {
    cy.visit('/')
    cy.contains('MCP usage')
    cy.get('[data-testid="liveness-indicator"]').should('be.visible')
    cy.get('[data-testid="error-health-indicator"]').should('be.visible')
    cy.contains('MCP liveness')
    cy.contains('Sessions')
    cy.contains('Tool usage')
    cy.contains('EIP numbers')

    cy.contains('nav a', 'Usage').click()
    cy.url().should('include', '/usage')
    cy.contains('Distinct agent fingerprints')
    cy.contains('Client / Versions')

    cy.contains('nav a', 'Tools').click()
    cy.get('[data-card-id="tool-calls"]').within(() => {
      cy.contains('generate_artifact', { timeout: 10_000 })
      cy.contains('run_bytecode')
      cy.contains('button', 'week').click()
    })

    cy.contains('nav a', 'Errors').click()
    cy.contains('Tool errors')
    cy.contains('Causes')

    cy.viewport(375, 812)
    cy.contains('nav a', 'Home').click()
    cy.get('[data-card-id="tool-calls"]').should('be.visible')
  })
})
