import { useEffect, useRef, useState } from 'react';

const EVENTS = [
  'patient.metric_added',
  'patient.medication_logged',
  'patient.prescription_scanned',
  'clinical.alert',
  'ready',
];

/**
 * Nghe SSE từ /clinic/stream. Fallback polling khi SSE lỗi.
 * onEvent(type, data) gọi mỗi khi có cập nhật từ bệnh nhân (hoặc 'poll' khi cần tự refetch).
 */
export function useClinicStream(onEvent) {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onEvent);
  cbRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('diaplus_token');
    if (!token) return;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
    const url = `${base}/clinic/stream?token=${encodeURIComponent(token)}`;

    let es = null;
    let pollTimer = null;
    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => cbRef.current?.('poll', null), 20_000);
    };
    const stopPolling = () => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    };

    try {
      es = new EventSource(url);
      es.onopen = () => { setConnected(true); stopPolling(); };
      es.onerror = () => { setConnected(false); startPolling(); };
      EVENTS.forEach((type) =>
        es.addEventListener(type, (e) => {
          try { cbRef.current?.(type, JSON.parse(e.data)); }
          catch { cbRef.current?.(type, null); }
        }),
      );
    } catch {
      startPolling();
    }

    return () => { es?.close(); stopPolling(); };
  }, []);

  return { connected };
}
