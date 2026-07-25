export const themes = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof themes)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ResolvedTheme {
  return preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference;
}

export const themeScript = `
(() => {
  const stored = localStorage.getItem('theme');
  const preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  const theme = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.documentElement.dataset.theme = theme;
})();
`;
