import { describe, it, expect, vi } from 'vitest';
import { calculateBackoff } from './backoff';

describe('calculateBackoff', () => {
  it('should return base time of 2000ms for attempt 1 (before jitter)', () => {
    // Mockeamos Math.random para anular el jitter temporalmente y probar la base
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateBackoff(1)).toBe(2000);
  });

  it('should return 4000ms for attempt 2 (exponential growth without jitter)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateBackoff(2)).toBe(4000);
  });

  it('should cap at maximum backoff of 30000ms (attempt 10 without jitter)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateBackoff(10)).toBe(30000);
  });

  it('should apply jitter variability correctly (attempt 2 with 0.5 random)', () => {
    // El jitter añade aleatoriedad. Si la base es 4000ms, queremos que varíe.
    // Nuestra fórmula planeada: base + (Math.random() * base * 0.2) // +-20% por ejemplo.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = calculateBackoff(2);
    // Verificaremos que el resultado sea diferente de la base exacta 4000
    expect(result).toBeGreaterThanOrEqual(4000);
    expect(result).toBeLessThanOrEqual(4800); // Max 20% jitter
  });

  it('should handle attempt 0 gracefully (returning minimum interval)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateBackoff(0)).toBe(2000);
    vi.restoreAllMocks();
  });
});
