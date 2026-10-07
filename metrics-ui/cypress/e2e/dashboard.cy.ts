describe('MCP usage dashboard', () => {
  it('loads demo charts and responds to grain control', () => {
    cy.visit('/')
    cy.contains('MCP usage')
    cy.contains('Tool usage')
    cy.contains('Clients')
    cy.get('[data-card-id="tool-calls"]').within(() => {
      cy.contains('generate_artifact', { timeout: 10_000 })
      cy.contains('inspect_artifact')
      cy.contains('button', 'week').click()
    })
    cy.get('[data-card-id="clients"]').within(() => {
      cy.contains('cursor-agent')
    })
    cy.viewport(375, 812)
    cy.get('[data-card-id="tool-calls"]').should('be.visible')
  })
})
