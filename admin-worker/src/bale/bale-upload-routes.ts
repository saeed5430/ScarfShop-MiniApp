import { Hono } from 'hono';
import { uploadBaleImage } from './imagekit/upload';
import { deleteBaleImage } from './imagekit/delete';
import type { BaleImageKitConfig } from './imagekit/types';
import { requireBaleAdmin } from './bale-admin-auth';

type Bindings = {
  BALE_DB: D1Database;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
  JWT_SECRET: string;
};

const DEFAULT_FOLDER = '/products-bale';

export const baleUploadRoutes = new Hono<{ Bindings: Bindings }>();

baleUploadRoutes.use('*', requireBaleAdmin);

baleUploadRoutes.post('/image', async (c) => {
  try {
    const privateKey = c.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = c.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = c.env.IMAGEKIT_URL_ENDPOINT;
    if (!privateKey || !publicKey || !urlEndpoint) {
      return c.json({ error: 'ImageKit configuration missing' }, 500);
    }
    const config: BaleImageKitConfig = { privateKey, publicKey, urlEndpoint };
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || DEFAULT_FOLDER;
    const fileName = (formData.get('fileName') as string) || undefined;
    if (!file) return c.json({ error: 'No file provided' }, 400);
    const result = await uploadBaleImage(file, config, {
      folder,
      fileName,
      useUniqueFileName: true,
    });
    return c.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      width: result.width,
      height: result.height,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return c.json({ error: errorMessage }, 500);
  }
});

baleUploadRoutes.delete('/image/:fileId', async (c) => {
  try {
    const privateKey = c.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = c.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = c.env.IMAGEKIT_URL_ENDPOINT;
    if (!privateKey || !publicKey || !urlEndpoint) {
      return c.json({ error: 'ImageKit configuration missing' }, 500);
    }
    const fileId = c.req.param('fileId');
    if (!fileId) return c.json({ error: 'File ID is required' }, 400);
    const config: BaleImageKitConfig = { privateKey, publicKey, urlEndpoint };
    await deleteBaleImage(fileId, config);
    return c.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Delete failed';
    return c.json({ error: errorMessage }, 500);
  }
});
