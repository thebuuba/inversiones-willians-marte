const defaultMaxStaggerDelay = 0.3;

export function getStaggerDelay(
  index: number,
  step: number,
  maxDelay = defaultMaxStaggerDelay,
): number {
  return Number(Math.min(Math.max(index, 0) * step, maxDelay).toFixed(3));
}
