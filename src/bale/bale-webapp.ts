interface BaleBackButton {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface BaleWebAppFull {
  initData: string;
  initDataUnsafe?: { user?: BaleInitUser };
  version: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (type: string, handler: (...args: unknown[]) => void) => void;
  offEvent: (type: string, handler: (...args: unknown[]) => void) => void;
  BackButton: BaleBackButton;
}

declare global {
  interface Window {
    Bale?: { WebApp?: BaleWebAppFull };
    Telegram?: { WebApp?: { initData?: string } };
  }
}

export function getBaleWebApp(): BaleWebAppFull | null {
  return window.Bale?.WebApp ?? null;
}

export function getBaleInitData(): string {
  return getBaleWebApp()?.initData ?? '';
}

export interface BaleInitUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function getBaleInitUser(): BaleInitUser | null {
  try {
    const unsafeUser = getBaleWebApp()?.initDataUnsafe?.user;
    if (unsafeUser?.id) return unsafeUser;
    const initData = getBaleInitData();
    if (!initData) return null;
    const userJson = new URLSearchParams(initData).get('user');
    if (!userJson) return null;
    return JSON.parse(userJson) as BaleInitUser;
  } catch {
    return null;
  }
}

export function openBaleLink(url: string): void {
  try {
    const app = getBaleWebApp();
    if (app?.openLink) {
      app.openLink(url);
      return;
    }
  } catch {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

const BALE_ADMIN_USERNAMES = ['saeed5430', 'fnazari57'];

const ADMIN_PANEL_URL = 'https://scarfminiappbale-admin.pages.dev';

export function openAdminPanel(): void {
  openBaleLink(ADMIN_PANEL_URL);
}

export function isBaleAdmin(username?: string | null): boolean {
  if (!username) return false;
  return BALE_ADMIN_USERNAMES.includes(username.toLowerCase().trim().replace(/^@/, ''));
}

export function isBaleEnv(): boolean {
  return getBaleWebApp() !== null;
}

export function baleReady(): void {
  try {
    const app = getBaleWebApp();
    app?.ready();
    app?.expand();
  } catch {
    return;
  }
}

export function getBaleColorScheme(): 'light' | 'dark' {
  return getBaleWebApp()?.colorScheme ?? 'light';
}

export function getBaleThemeParams(): Record<string, string> {
  return getBaleWebApp()?.themeParams ?? {};
}
