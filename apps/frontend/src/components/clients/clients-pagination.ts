export const CLIENT_ROW_HEIGHT = 64;
export const MOBILE_LIST_BREAKPOINT = 768;
export const MOBILE_PAGE_SIZE = 5;

export function calculateClientPageSize(
  availableHeight: number,
  viewportWidth = MOBILE_LIST_BREAKPOINT,
): number {
  if (viewportWidth < MOBILE_LIST_BREAKPOINT) return MOBILE_PAGE_SIZE;
  return Math.max(1, Math.floor(availableHeight / CLIENT_ROW_HEIGHT));
}
