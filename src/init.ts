import { ensureWebApp } from '@/bale/webApp';

export async function init(options: {
  debug: boolean;
  eruda: boolean;
}): Promise<void> {
  const webApp = ensureWebApp();
  if (!webApp) {
    throw new Error('Bale environment is not supported');
  }

  // Add Eruda if needed.
  options.eruda && void import('eruda').then(({ default: eruda }) => {
    eruda.init();
    eruda.position({ x: window.innerWidth - 50, y: 0 });
  });

  // Notify Bale that the Mini App is ready.
  webApp.ready();
  webApp.expand();
}
