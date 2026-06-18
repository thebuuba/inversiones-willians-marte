export function formatPersonName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-DO')
    .replace(/(^|[\s-])(\p{L})/gu, (_, prefix: string, letter: string) => {
      return `${prefix}${letter.toLocaleUpperCase('es-DO')}`;
    });
}
