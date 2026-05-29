describe('WebSocket Reconnection Flow', () => {
  it('Should connect, handle forced disconnection, and reconnect (Red Phase)', () => {
    cy.viewport(1280, 720);
    // 1. Login via API
    cy.request('POST', '/api/auth/login', {
      no_control: '20000001', // MATI. Fernando Villaseñor Béjar (docente)
      password: 'password123'
    }).then((loginResponse) => {
      // Si falla aquí, ajustaremos el no_control para un docente real. 
      // Por convención SGA-QR, docente1 suele ser un no_control válido en dev.
      expect(loginResponse.status).to.eq(200);
      const token = loginResponse.body.access_token;
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('access_token', token); // por si acaso
      
      // 2. Visitar el Dashboard e interceptar /classes para inyectar una clase con sesión activa
      // y evitar la necesidad de geolocalización o dependencias de hora exacta en BD real
      // Pero el requerimiento es CERO MOCKS en BD real. 
      // Usaremos cy.request para obtener las clases y usar la primera.
      cy.request({
        method: 'GET',
        url: '/api/teacher/classes/today?debug_all=true',
        headers: { Authorization: `Bearer ${token}` }
      }).then((classesResp) => {
        const classes = classesResp.body;
        expect(classes.length).to.be.greaterThan(0);
        const cls = classes[0];

        // 3. Iniciar sesión vía API para evitar prompts de GPS en UI
        cy.request({
          method: 'POST',
          url: '/api/teacher/session/start',
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
          body: {
            horario_id: cls.horario_id,
            lat: 19.722, // ITM Coords approx
            lng: -101.185
          }
        }).then((sessionResp) => {
          const sessionData = sessionResp.body;

          // 4. Inyectamos estado de sesión y visitamos
          cy.on('window:console', (msg) => {
            cy.log(`CONSOLE: ${msg.type} - ${msg.args.join(' ')}`);
          });

          cy.visit('/teacher/dashboard');
          
          // Click en "Ver pase activo" (ahora debería estar visible porque iniciamos la sesión)
          cy.contains('Ver pase activo').should('be.visible').click();

          // 5. Verificar que el estado cambie a "En vivo"
          // Como la fase ROJA usa new WebSocket() puro sin manejar el estado
          // de Reconectando... ni exponerlo a la UI correctamente según useWebSocket, 
          // aseguraremos que la UI tenga el componente LiveBadge.
          cy.get('span:contains("EN VIVO"):visible', { timeout: 10000 }).should('exist');

          // 6. Forzar desconexión simulando caída de red con CDP (Chrome DevTools Protocol)
          // Cypress corre en CDP, podemos desconectar offline
          cy.log('Simulando caída de red (Offline)...');
          cy.wrap(
            Cypress.automation('remote:debugger:protocol', {
              command: 'Network.emulateNetworkConditions',
              params: {
                offline: true,
                latency: 0,
                downloadThroughput: -1,
                uploadThroughput: -1,
              },
            })
          );

          // 7. Verificar cambio de UI
          cy.get('span:contains("Reconectando..."):visible', { timeout: 10000 }).should('exist');

          // 8. Restaurar conexión
          cy.log('Restaurando red (Online)...');
          cy.wrap(
            Cypress.automation('remote:debugger:protocol', {
              command: 'Network.emulateNetworkConditions',
              params: {
                offline: false,
                latency: 0,
                downloadThroughput: -1,
                uploadThroughput: -1,
              },
            })
          );

          // 9. Verificar que vuelve a En vivo (damos más tiempo por el backoff delay)
          cy.get('span:contains("EN VIVO"):visible', { timeout: 15000 }).should('exist');
        });
      });
    });
  });
});
