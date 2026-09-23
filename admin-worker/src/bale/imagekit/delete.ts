import type { BaleImageKitConfig } from './types';

const IMAGEKIT_API_URL = 'https://api.imagekit.io/v1/files';

export async function deleteBaleImage(fileId: string, config: BaleImageKitConfig): Promise<void> {
  if (!fileId) throw new Error('File ID is required');
  const cleanFileId = fileId.trim();
  const url = `${IMAGEKIT_API_URL}/${cleanFileId}`;
  const authHeader = 'Basic ' + btoa(config.privateKey + ':');
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });
  if (!response.ok) {
    let errorMsg = `Delete failed with status ${response.status}`;
    try {
      const errorData = await response.json() as { message?: string };
      if (errorData?.message) errorMsg = errorData.message;
    } catch {
      const body = await response.text().catch(() => '');
      if (body) errorMsg = body;
    }
    throw new Error(errorMsg);
  }
}
