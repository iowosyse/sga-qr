import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { User, UserRole } from '@/types';

/**
 * Hook for authentication management
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // TODO: Fetch user data from /api/auth/me endpoint
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (no_control: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.login(no_control, password);
      // TODO: Fetch and set user data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiClient.logout();
    setUser(null);
  }, []);

  const isAuthenticated = !!user || apiClient.isAuthenticated();

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
  };
}

/**
 * Hook for geolocation
 */
export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation no está soportado en este dispositivo');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  return {
    coords,
    error,
    loading,
    requestLocation,
  };
}

/**
 * Hook for countdown timer
 */
export function useCountdown(duration: number) {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => (prev <= 1 ? duration : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [duration]);

  return count;
}

/**
 * Hook for WebSocket connection
 */
export function useWebSocket(url: string) {
  const [data, setData] = useState<unknown>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const wsUrl = `${url}?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setData(message);
      } catch (err) {
        setData(event.data);
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return {
    data,
    connected,
    error,
  };
}
