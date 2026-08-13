import type { BaleWebApp } from './types';

let cached: BaleWebApp | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getWebApp(): BaleWebApp | null {
  return window.Bale?.WebApp ?? null;
}

export function isBaleEnvironment(): boolean {
  return Boolean(window.Bale?.WebApp);
}

export function ensureWebApp(): BaleWebApp | null {
  cached = getWebApp();
  if (cached) {
    notify();
  }
  return cached;
}

export function setWebApp(webApp: BaleWebApp): void {
  cached = webApp;
  notify();
}

export function subscribeWebApp(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getSnapshot(): BaleWebApp | null {
  return cached;
}