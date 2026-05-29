import { describe, it, expect } from 'vitest';
import { generateFakeQR, mockGeolocalizacion } from './hardwareMock';

describe('hardwareMock', () => {
  it('should generate a fake QR token containing the expected prefix', () => {
    const token = generateFakeQR();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    expect(token).toContain('MOCK_TOKEN');
  });

  it('should return simulated coordinates for the classroom', () => {
    const coords = mockGeolocalizacion();
    expect(coords).toHaveProperty('lat');
    expect(coords).toHaveProperty('lng');
    // Coordenadas simuladas para B-204 u otro lugar
    expect(typeof coords.lat).toBe('number');
    expect(typeof coords.lng).toBe('number');
  });
});
