export const themes = ['light', 'dark'] as const;

export type ThemePreference = (typeof themes)[number];

export function parseThemePreference(stored: string | null): ThemePreference {
  return stored === 'dark' ? 'dark' : 'light';
}

export const themeScript = `
(() => {
  const theme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
})();
`;
