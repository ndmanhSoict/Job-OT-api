import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '@config/env.config';
import { AppError } from './app-error';
import { ErrorCode } from '@shared/constants/error-codes';

const IMAGE_SIGNATURES = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  webpRiff: Buffer.from('RIFF'),
  webpWebp: Buffer.from('WEBP'),
} as const;

const PDF_SIGNATURE = Buffer.from('%PDF-');
const DOC_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export interface StoredFileInfo {
  fileName: string;
  absolutePath: string;
  publicUrl: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

function ensureDir(targetDir: string): void {
  fs.mkdirSync(targetDir, { recursive: true });
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getUploadRoot(): string {
  return path.resolve(env.upload.dest);
}

export function buildPublicFileUrl(reqProtocol: string, reqHost: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  return `${reqProtocol}://${reqHost}/${normalized}`;
}

export async function storeUploadedBuffer(
  fileBuffer: Buffer,
  folder: string,
  originalName: string,
  reqProtocol: string,
  reqHost: string
): Promise<StoredFileInfo> {
  const uploadRoot = getUploadRoot();
  const targetDir = path.join(uploadRoot, folder);
  ensureDir(targetDir);

  const fileName = `${randomUUID()}_${sanitizeFileName(originalName)}`;
  const absolutePath = path.join(targetDir, fileName);
  await fs.promises.writeFile(absolutePath, fileBuffer);

  const relativePath = path.join('uploads', folder, fileName);

  return {
    fileName,
    absolutePath,
    publicUrl: buildPublicFileUrl(reqProtocol, reqHost, relativePath),
  };
}

export async function deleteStoredFile(fileUrl: string): Promise<void> {
  const uploadRoot = getUploadRoot();
  const uploadsSegment = '/uploads/';
  const normalizedUrl = fileUrl.replace(/\\/g, '/');
  const index = normalizedUrl.indexOf(uploadsSegment);
  if (index === -1) return;

  const relativePath = normalizedUrl.slice(index + 1);
  const absolutePath = path.resolve(relativePath);

  if (!absolutePath.startsWith(uploadRoot)) return;
  if (fs.existsSync(absolutePath)) {
    await fs.promises.unlink(absolutePath);
  }
}

export function assertImageMagicBytes(buffer: Buffer): void {
  const isJpeg = buffer.subarray(0, 3).equals(IMAGE_SIGNATURES.jpeg);
  const isPng = buffer.subarray(0, 4).equals(IMAGE_SIGNATURES.png);
  const isWebp =
    buffer.subarray(0, 4).equals(IMAGE_SIGNATURES.webpRiff) &&
    buffer.subarray(8, 12).equals(IMAGE_SIGNATURES.webpWebp);

  if (!isJpeg && !isPng && !isWebp) {
    throw new AppError(
      ErrorCode.UPLOAD_FILE_TYPE_INVALID,
      400,
      'File không phải ảnh hợp lệ'
    );
  }
}

export function assertDocumentMagicBytes(buffer: Buffer, mimeType: string): void {
  if (mimeType === 'application/pdf' && buffer.subarray(0, 5).equals(PDF_SIGNATURE)) return;
  if (mimeType === 'application/msword' && buffer.subarray(0, 4).equals(DOC_SIGNATURE)) return;
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
    buffer.subarray(0, 4).equals(ZIP_SIGNATURE)
  ) {
    return;
  }

  throw new AppError(
    ErrorCode.UPLOAD_FILE_TYPE_INVALID,
    400,
    'File tài liệu không đúng định dạng cho phép'
  );
}

export function assertSpreadsheetMagicBytes(buffer: Buffer): void {
  if (!buffer.subarray(0, 4).equals(ZIP_SIGNATURE)) {
    throw new AppError(
      ErrorCode.UPLOAD_FILE_TYPE_INVALID,
      400,
      'File import phải là định dạng xlsx hợp lệ'
    );
  }
}

export function getImageDimensions(buffer: Buffer): ImageDimensions | undefined {
  if (buffer.subarray(0, 4).equals(IMAGE_SIGNATURES.png)) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.subarray(0, 3).equals(IMAGE_SIGNATURES.jpeg)) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const size = buffer.readUInt16BE(offset + 2);
      const isSofMarker =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker);

      if (isSofMarker) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      offset += 2 + size;
    }
  }

  if (
    buffer.subarray(0, 4).equals(IMAGE_SIGNATURES.webpRiff) &&
    buffer.subarray(8, 12).equals(IMAGE_SIGNATURES.webpWebp)
  ) {
    const chunkType = buffer.toString('ascii', 12, 16);

    if (chunkType === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
  }

  return undefined;
}
