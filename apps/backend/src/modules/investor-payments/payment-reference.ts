// Use the existing reference field for retry metadata while preserving the bank reference.
export function paymentReference(reference: string | null | undefined): string | null {
  if (!reference) return null;
  const match = /^request:[0-9a-f-]{36}(?:\|([\s\S]*))?$/i.exec(reference);
  return match ? match[1] || null : reference;
}
