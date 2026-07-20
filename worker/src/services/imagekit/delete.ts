import type { ImageKitConfig } from './types';

const IMAGEKIT_API_URL = 'https://api.imagekit.io/v1/files';

export async function deleteImage(
  fileId: string,
  config: ImageKitConfig
): Promise<void> {
  if (!fileId) {
    throw new Error('File ID is required');
  }

  const cleanFileId = fileId.trim();
  const url = `${IMAGEKIT_API_URL}/${cleanFileId}`;
  const authHeader = 'Basic ' + btoa(config.privateKey + ':');

  console.log(`[ImageKit Delete] fileId: ${cleanFileId}`);
  console.log(`[ImageKit Delete] URL: ${url}`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': authHeader,
    },
  });

  console.log(`[ImageKit Delete] Status: ${response.status}`);

  const body = await response.text();
  console.log(`[ImageKit Delete] Response: ${body}`);

  if (!response.ok) {
    let errorMsg = `Delete failed with status ${response.status}`;
    try {
      const errorData = JSON.parse(body);
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMsg = String(errorData.message);
      }
    } catch {
      // not JSON, use raw body
      if (body) {
        errorMsg = body;
      }
    }
    throw new Error(errorMsg);
  }

  console.log(`[ImageKit Delete] Success: ${cleanFileId}`);
}
