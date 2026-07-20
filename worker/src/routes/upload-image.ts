import { Hono } from 'hono';
import { uploadImage, deleteImage } from '../services/imagekit';
import type { ImageKitConfig } from '../services/imagekit/types';

type Bindings = {
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
};

export const uploadRoutes = new Hono<{ Bindings: Bindings }>();

uploadRoutes.post('/image', async (c) => {
  try {
    const privateKey = c.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = c.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = c.env.IMAGEKIT_URL_ENDPOINT;

    if (!privateKey || !publicKey || !urlEndpoint) {
      return c.json({ error: 'ImageKit configuration missing' }, 500);
    }

    const config: ImageKitConfig = {
      privateKey,
      publicKey,
      urlEndpoint,
    };

    // Get file from request
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'uploads';
    const fileName = formData.get('fileName') as string || undefined;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Upload to ImageKit
    const result = await uploadImage(file, config, {
      folder,
      fileName,
      useUniqueFileName: true,
    });

    console.log(`[ImageKit] Upload success: ${result.fileId} -> ${result.url}`);

    return c.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      width: result.width,
      height: result.height,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error(`[ImageKit] Upload failed: ${errorMessage}`);
    return c.json({ error: errorMessage }, 500);
  }
});

uploadRoutes.delete('/image/:fileId', async (c) => {
  try {
    const privateKey = c.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = c.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = c.env.IMAGEKIT_URL_ENDPOINT;
    const fileId = c.req.param('fileId');

    if (!privateKey || !publicKey || !urlEndpoint) {
      return c.json({ error: 'ImageKit configuration missing' }, 500);
    }

    if (!fileId) {
      return c.json({ error: 'File ID is required' }, 400);
    }

    const config: ImageKitConfig = {
      privateKey,
      publicKey,
      urlEndpoint,
    };

    // Delete from ImageKit
    await deleteImage(fileId, config);

    console.log(`[ImageKit] Delete success: ${fileId}`);

    return c.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Delete failed';
    console.error(`[ImageKit] Delete failed: ${errorMessage}`);
    return c.json({ error: errorMessage }, 500);
  }
});
