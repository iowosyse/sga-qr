export function calculateBackoff(attempt: number): number {
  const baseInterval = 2000;
  const maxInterval = 30000;
  
  if (attempt <= 0) return baseInterval;

  // Crecimiento exponencial: 2000, 4000, 8000, 16000...
  const exponentialInterval = baseInterval * Math.pow(2, attempt - 1);
  const cappedInterval = Math.min(maxInterval, exponentialInterval);

  // Jitter del 0% al 20%
  const jitter = Math.random() * cappedInterval * 0.2;
  
  return Math.floor(cappedInterval + jitter);
}
