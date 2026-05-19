// Utility functions for the app

/**
 * Combine class names conditionally
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format time for countdown display
 */
export function formatCountdown(seconds: number): string {
  return String(seconds).padStart(2, '0');
}

/**
 * Format date to Spanish locale
 */
export function formatDateES(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format time HH:MM:SS
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Haversine formula to calculate distance between two geographic points in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a point is within a given radius of a center point
 */
export function isWithinRadius(
  studentLat: number,
  studentLon: number,
  classroomLat: number,
  classroomLon: number,
  radiusMeters: number = 50,
): boolean {
  const distance = calculateDistance(studentLat, studentLon, classroomLat, classroomLon);
  return distance <= radiusMeters;
}

/**
 * Get status color based on attendance status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    present: '#22C55E', // success
    pending: '#9CA3AF', // gray
    manual: '#F97316', // warning
    absent: '#DC2626', // error
    justified: '#3B82F6', // blue
  };
  return colors[status] || '#9CA3AF';
}

/**
 * Get status label in Spanish
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    present: 'Presente',
    pending: 'Pendiente',
    manual: 'Manual',
    absent: 'Ausente',
    justified: 'Justificado',
  };
  return labels[status] || status;
}

/**
 * Debounce utility for performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
