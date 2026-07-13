export const CLIENT_ROW_HEIGHT = 64;

export function calculateClientPageSize(availableHeight: number): number {
  return Math.max(1, Math.floor(availableHeight / CLIENT_ROW_HEIGHT));
}
