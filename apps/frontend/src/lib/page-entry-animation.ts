export const pageEntryHeaderClassName = 'animate-fade-in-up';

export function pageEntryStatCardClassName(index: number) {
  const delay = Math.max(index, 0) * 60;
  return `opacity-0 animate-fade-in-up [animation-delay:${delay}ms] [animation-fill-mode:forwards]`;
}

export const pageEntryTableClassName =
  'opacity-0 animate-fade-in-up [animation-delay:260ms] [animation-fill-mode:forwards]';
