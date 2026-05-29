import { useState, useEffect, useRef, useCallback } from 'react';
import { calculateBackoff } from '@/lib/backoff';

export type WebSocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export function useWebSocket(url: string, maxAttempts: number = 5) {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (!url) return;
    
    // Si ya estamos conectados o intentando, evitamos crear múltiples
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setStatus(attemptsRef.current === 0 ? 'connecting' : 'reconnecting');
    
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      attemptsRef.current = 0; // Reset attempts on successful connection
      
      // Setup Heartbeat (30s)
      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onclose = () => {
      clearTimers();
      
      if (attemptsRef.current < maxAttempts) {
        setStatus('reconnecting');
        attemptsRef.current += 1;
        const delay = calculateBackoff(attemptsRef.current);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log(`[useWebSocket] Intentando reconectar... (Intento ${attemptsRef.current}/${maxAttempts})`);
          connect();
        }, delay);
      } else {
        console.log(`[useWebSocket] Desconectado permanentemente tras ${maxAttempts} intentos.`);
        setStatus('disconnected');
      }
    };

    ws.onerror = () => {
      // ws.onerror is usually followed by ws.onclose, so the logic in onclose handles reconnects.
      // We just set error here temporarily if needed, but 'reconnecting' takes precedence
      // in standard flows.
    };

  }, [url, maxAttempts]);

  useEffect(() => {
    connect();

    return () => {
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { status, ws: wsRef.current };
}
