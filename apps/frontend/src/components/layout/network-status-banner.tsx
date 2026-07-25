'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BACKEND_AVAILABLE_EVENT,
  BACKEND_UNAVAILABLE_EVENT,
  getNetworkStatusMessage,
  STALE_DATA_EVENT,
} from '@/lib/network-status';

export function NetworkStatusBanner() {
  const [online, setOnline] = useState(true);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [staleData, setStaleData] = useState(false);

  useEffect(() => {
    const refreshOnline = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) return;
      setBackendUnavailable(false);
    };
    const markBackendAvailable = () => {
      setBackendUnavailable(false);
      setStaleData(false);
    };
    const markBackendUnavailable = () => setBackendUnavailable(true);
    const markStaleData = () => setStaleData(true);

    refreshOnline();
    window.addEventListener('online', refreshOnline);
    window.addEventListener('offline', refreshOnline);
    window.addEventListener(BACKEND_AVAILABLE_EVENT, markBackendAvailable);
    window.addEventListener(BACKEND_UNAVAILABLE_EVENT, markBackendUnavailable);
    window.addEventListener(STALE_DATA_EVENT, markStaleData);
    return () => {
      window.removeEventListener('online', refreshOnline);
      window.removeEventListener('offline', refreshOnline);
      window.removeEventListener(BACKEND_AVAILABLE_EVENT, markBackendAvailable);
      window.removeEventListener(BACKEND_UNAVAILABLE_EVENT, markBackendUnavailable);
      window.removeEventListener(STALE_DATA_EVENT, markStaleData);
    };
  }, []);

  const message = useMemo(
    () => getNetworkStatusMessage({ online, backendUnavailable, staleData }),
    [backendUnavailable, online, staleData],
  );

  if (!message) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-[520px] rounded-control-compact border border-state-danger-dot bg-state-danger-bg px-4 py-3 text-center text-sm font-semibold text-state-danger shadow-card">
      {message}
    </div>
  );
}
