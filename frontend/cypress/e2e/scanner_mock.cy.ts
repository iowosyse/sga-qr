describe('Scanner Mock Injection', () => {
  it('should display the mock button in development environment and inject QR on click', () => {
    // Asumimos que el login mockeado o la sesión ya está iniciada
    // visitamos la URL del escáner
    cy.visit('/student/scanner');

    // Comprobamos que el botón de mock existe (el texto tiene el emoji 🛠️)
    cy.contains('button', 'Inyectar Asistencia').should('be.visible');

    // Interceptamos la navegación a GPS que es lo que desencadena el botón mock
    // porque en la implementación navega a /student/gps con el state
    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
    });

    // Click al botón de inyección
    cy.contains('button', 'Inyectar Asistencia').click();

    // Verificamos que navegamos a la vista GPS
    cy.url().should('include', '/student/gps');
  });
});
