export const MAX_CLIENT_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_COMPRESSED_CLIENT_PHOTO_BYTES = 1_100_000;

const ALLOWED_CLIENT_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateClientPhoto(file: Pick<File, 'size' | 'type'>): string | null {
  if (!ALLOWED_CLIENT_PHOTO_TYPES.has(file.type.toLowerCase())) {
    return 'Selecciona una fotografía JPG, PNG o WebP.';
  }
  if (file.size > MAX_CLIENT_PHOTO_BYTES) {
    return 'La fotografía no puede superar 5 MB.';
  }
  return null;
}
