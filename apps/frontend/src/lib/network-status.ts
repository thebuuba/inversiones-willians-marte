export const BACKEND_AVAILABLE_EVENT = 'backend-available';
export const BACKEND_UNAVAILABLE_EVENT = 'backend-unavailable';
export const STALE_DATA_EVENT = 'stale-data';

export interface NetworkStatusState {
  online: boolean;
  backendUnavailable: boolean;
  staleData: boolean;
}

export function getNetworkStatusMessage(state: NetworkStatusState) {
  if (!state.online) return 'Sin conexión. Mostrando datos guardados cuando estén disponibles.';
  if (state.backendUnavailable) return 'No se pudo conectar con el servidor. Reintentaremos cuando vuelva.';
  if (state.staleData) return 'Mostrando datos guardados mientras se actualiza la conexión.';
  return '';
}

export function emitNetworkEvent(eventName: string) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(eventName));
  }
}
