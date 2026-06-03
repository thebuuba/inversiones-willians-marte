export function getInvestorNameValidationError(firstName: string, lastName: string): string | null {
  const name = `${firstName.trim()} ${lastName.trim()}`.trim();
  return name.length >= 2 ? null : 'Completa nombres y apellidos antes de guardar.';
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;

  const data = (error as { response?: { data?: { error?: unknown; message?: unknown } } }).response?.data;
  const message = data?.error ?? data?.message;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}
