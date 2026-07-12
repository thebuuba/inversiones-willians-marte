const COMPRESSED_IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function createCompressedImageFile(blob: Blob, originalName: string): File {
  const mimeType = blob.type.toLowerCase();
  const extension = COMPRESSED_IMAGE_EXTENSIONS[mimeType];
  if (!extension) throw new Error(`Formato de imagen comprimida no permitido: ${mimeType || 'desconocido'}`);

  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'foto';
  return new File([blob], `${baseName}${extension}`, { type: mimeType });
}

export function compressImage(file: File, maxWidth = 1000, quality = 0.58): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width <= maxWidth && height <= maxWidth && file.size < 500_000) {
        return resolve(file);
      }

      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          try {
            resolve(createCompressedImageFile(blob, file.name));
          } catch (error) {
            reject(error);
          }
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
