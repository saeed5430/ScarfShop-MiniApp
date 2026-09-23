import type { BaleImageKitConfig, BaleImageUploadResult, BaleUploadOptions } from './types';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

export async function uploadBaleImage(
  file: File | Blob,
  config: BaleImageKitConfig,
  options: BaleUploadOptions = {}
): Promise<BaleImageUploadResult> {
  validateFile(file);

  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.fileName) formData.append('fileName', options.fileName);
  if (options.useUniqueFileName !== undefined) {
    formData.append('useUniqueFileName', String(options.useUniqueFileName));
  }

  const authHeader = 'Basic ' + btoa(config.privateKey + ':');
  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Upload failed with status ${response.status}`;
    try {
      const errorData = await response.json() as { message?: string };
      if (errorData?.message) errorMsg = errorData.message;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  const result = await response.json() as Record<string, unknown>;
  return {
    url: String(result.url || ''),
    fileId: String(result.fileId || ''),
    thumbnailUrl: result.thumbnailUrl ? String(result.thumbnailUrl) : undefined,
    width: result.width ? Number(result.width) : undefined,
    height: result.height ? Number(result.height) : undefined,
    name: result.name ? String(result.name) : undefined,
    size: result.size ? Number(result.size) : undefined,
    fileType: result.fileType ? String(result.fileType) : undefined,
  };
}

function validateFile(file: File | Blob): void {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
  const maxSize = 5 * 1024 * 1024;
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  if (file.size > maxSize) {
    throw new Error(`File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`);
  }
}
