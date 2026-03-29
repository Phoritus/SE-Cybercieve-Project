import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom React hook implementing the Observer pattern via WebSocket.
 * 
 * Connects to ws://cybersieve-api.fly.dev/api/ws/scans/{fileHash} and listens
 * for real-time scan completion events pushed by the backend.
 */

interface ScanSocketState {
  /** Whether the WebSocket connection is currently open */
  isConnected: boolean;
  /** The completed scan report, if received */
  completedReport: any | null;
  /** The resolved file hash from the completed event */
  completedHash: string | null;
}

export function useScanStatusSocket(fileHash: string | null): ScanSocketState {
  const [isConnected, setIsConnected] = useState(false);
  const [completedReport, setCompletedReport] = useState<any | null>(null);
  const [completedHash, setCompletedHash] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!fileHash) {
      cleanup();
      return;
    }

    // Reset state for a new subscription
    setCompletedReport(null);
    setCompletedHash(null);
    // cybersieve-api.fly.dev or localhost:8000
    const wsUrl = `ws://127.0.0.1:8000/api/ws/scans/${fileHash}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Send periodic pings to keep the connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 20_000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'scan_completed') {
          setCompletedReport(data.report);
          setCompletedHash(data.file_hash);
          // Auto-close after receiving the completed result
          cleanup();
        }
      } catch {
        // Ignore non-JSON messages (e.g. pong)
      }
    };

    ws.onerror = () => {
      // WebSocket errors are non-fatal; the polling fallback still works
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      cleanup();
    };
  }, [fileHash, cleanup]);

  return { isConnected, completedReport, completedHash };
}
