describe('MCP usage dashboard', () => {
  it('loads demo charts and responds to grain control', () => {
    cy.visit('/')
    cy.contains('MCP usage')
    cy.contains('Tool usage')
    cy.get('[data-card-id="tool-calls"]').within(() => {
      cy.contains('run_bytecode', { timeout: 10_000 })
      cy.contains('button', 'week').click()
    })
    cy.viewport(375, 812)
    cy.get('[data-card-id="tool-calls"]').should('be.visible')
  })
})
