import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDevicePermissions } from './useDevicePermissions';

describe('useDevicePermissions', () => {
  beforeEach(() => {
    // Limpiar mocks
    vi.restoreAllMocks();
    
    // Mock navigator.permissions
    const permissions = {
      query: vi.fn(),
    };
    Object.defineProperty(globalThis.navigator, 'permissions', {
      value: permissions,
      configurable: true,
      writable: true,
    });
  });

  it('should return initial state as prompt', () => {
    // Configurar mock para que no resuelva inmediatamente si queremos testear estado inicial
    const mockQuery = vi.fn().mockImplementation(() => new Promise(() => {}));
    (globalThis.navigator as any).permissions.query = mockQuery;

    const { result } = renderHook(() => useDevicePermissions());

    expect(result.current.cameraStatus).toBe('prompt');
    expect(result.current.geolocationStatus).toBe('prompt');
  });

  it('should update cameraStatus when camera permission is denied', async () => {
    const mockQuery = vi.fn().mockImplementation((descriptor) => {
      if (descriptor.name === 'camera') {
        return Promise.resolve({ state: 'denied', onchange: null });
      }
      return Promise.resolve({ state: 'prompt', onchange: null });
    });
    (globalThis.navigator as any).permissions.query = mockQuery;

    const { result } = renderHook(() => useDevicePermissions());

    // Esperar a que los hooks actualicen el estado
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.cameraStatus).toBe('denied');
  });

  it('should update geolocationStatus when geolocation permission is denied', async () => {
    const mockQuery = vi.fn().mockImplementation((descriptor) => {
      if (descriptor.name === 'geolocation') {
        return Promise.resolve({ state: 'denied', onchange: null });
      }
      return Promise.resolve({ state: 'prompt', onchange: null });
    });
    (globalThis.navigator as any).permissions.query = mockQuery;

    const { result } = renderHook(() => useDevicePermissions());

    // Esperar a que los hooks actualicen el estado
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.geolocationStatus).toBe('denied');
  });
});
