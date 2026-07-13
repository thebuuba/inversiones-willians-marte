export function normalizePagination(take = 50, skip = 0, maxTake = 100) {
  const normalizedTake = Number.isFinite(take) ? Math.trunc(take) : 50;
  const normalizedSkip = Number.isFinite(skip) ? Math.trunc(skip) : 0;

  return {
    take: Math.min(Math.max(normalizedTake, 1), maxTake),
    skip: Math.max(normalizedSkip, 0),
  };
}
