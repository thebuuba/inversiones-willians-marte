import { BadRequestException } from '@nestjs/common';
import { existsSync, readFileSync, unlinkSync } from 'fs';

type UploadedFileWithPath = {
  mimetype: string;
  path?: string;
};

const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

export function assertAllowedUploadedFile(file: UploadedFileWithPath) {
  if (!file.path || !existsSync(file.path)) return;

  const bytes = readFileSync(file.path).subarray(0, 16);
  if (isAllowedFileSignature(file.mimetype, bytes)) return;

  unlinkSync(file.path);
  throw new BadRequestException('El contenido del archivo no coincide con el tipo permitido');
}

export function isAllowedFileSignature(mimeType: string, bytes: Buffer) {
  if (mimeType === 'application/pdf') return startsWith(bytes, Buffer.from('%PDF'));
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png')
    return startsWith(bytes, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/webp')
    return (
      startsWith(bytes, Buffer.from('RIFF')) && bytes.subarray(8, 12).equals(Buffer.from('WEBP'))
    );
  if (mimeType === 'text/plain') return !bytes.includes(0);
  if (mimeType === 'application/rtf') return startsWith(bytes, Buffer.from('{\\rtf'));
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return startsWith(bytes, OLE_SIGNATURE) || startsWith(bytes, Buffer.from('PK'));
  }
  return false;
}

function startsWith(bytes: Buffer, signature: Buffer) {
  return bytes.length >= signature.length && bytes.subarray(0, signature.length).equals(signature);
}
