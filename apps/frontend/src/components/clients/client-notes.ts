export type ClientNote = {
  id: number;
  text: string;
  author: string;
  date: string;
};

export function parseClientNotes(value?: string | null): ClientNote[] {
  const text = value?.trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isClientNote);
  } catch {
    return [{ id: 1, text, author: 'Sistema', date: '' }];
  }
}

export function hasClientNotes(value?: string | null): boolean {
  return parseClientNotes(value).length > 0;
}

export function countClientNotes(value?: string | null): number {
  return parseClientNotes(value).length;
}

export function formatClientNotesPreview(value?: string | null): string {
  const notes = parseClientNotes(value);
  if (notes.length === 0) return '—';
  return notes.map((note) => note.text).join(' · ');
}

function isClientNote(value: unknown): value is ClientNote {
  if (typeof value !== 'object' || value === null) return false;
  const note = value as Partial<ClientNote>;
  return typeof note.id === 'number' && typeof note.text === 'string';
}
