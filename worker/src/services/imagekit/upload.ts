import type { ImageKitConfig, ImageUploadResult, UploadOptions } from './types';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

export async function uploadImage(
  file: File | Blob,
  config: ImageKitConfig,
  options: UploadOptions = {}
): Promise<ImageUploadResult> {
  // Validate file
  validateFile(file);

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);

  // Add options
  if (options.folder) {
    formData.append('folder', options.folder);
  }

  if (options.fileName) {
    formData.append('fileName', options.fileName);
  }

  if (options.useUniqueFileName !== undefined) {
    formData.append('useUniqueFileName', String(options.useUniqueFileName));
  }

  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  if (options.transformation) {
    if (options.transformation.pre) {
      formData.append('transformation', options.transformation.pre);
    }
  }

  // Create Basic Auth header
  const authHeader = 'Basic ' + btoa(config.privateKey + ':');

  // Upload to ImageKit
  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Upload failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMsg = String(errorData.message);
      }
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
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`);
  }
}
