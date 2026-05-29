export function generateFakeQR(): string {
  // En un caso real, esto podría generar un JWT mockeado o el formato exacto esperado
  return `MOCK_TOKEN_DEV_${new Date().getFullYear()}`;
}

export function mockGeolocalizacion(): { lat: number; lng: number } {
  // Coordenadas fijas para pruebas (ej. Aula B-204)
  return {
    lat: 19.7226,
    lng: -101.1858
  };
}
