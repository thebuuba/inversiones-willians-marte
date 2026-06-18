export const SIDEBAR_COUNTER_REFRESH_MS = 60_000;

export function canRefreshSidebarCounters(visibilityState: DocumentVisibilityState) {
  return visibilityState !== 'hidden';
}
