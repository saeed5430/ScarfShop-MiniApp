import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type FC,
  type PropsWithChildren,
} from 'react';

import type { BaleThemeParams, BaleWebApp } from './types';
import { getWebApp, getSnapshot, subscribeWebApp } from './webApp';

export type RGB = string;

export type User = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  allows_write_to_pm?: boolean;
  photo_url?: string;
  is_premium?: boolean;
  is_bot?: boolean;
  language_code?: string;
};

export interface LaunchParams {
  tgWebAppPlatform: string;
  tgWebAppShowSettings: boolean;
  tgWebAppVersion: string;
  tgWebAppBotInline: boolean;
  tgWebAppStartParam?: string;
  tgWebAppThemeParams: BaleThemeParams;
}

export interface InitDataState {
  query_id?: string;
  user?: User;
  auth_date?: Date;
  hash?: string;
  receiver?: User;
  chat?: Record<string, unknown>;
}

export function isRGB(color: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) || /^rgb\(/i.test(color);
}

export function isColorDark(color: string): boolean {
  if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
  }
  const match = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(color);
  if (match) {
    const [, r, g, b] = match.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
  }
  return false;
}

export function parseInitData(raw: string | undefined): InitDataState {
  if (!raw) {
    return {};
  }
  const params = new URLSearchParams(raw);
  const state: Record<string, unknown> = {};
  for (const [key, value] of params) {
    if (value === '') {
      continue;
    }
    if (key === 'user' || key === 'receiver' || key === 'chat') {
      try {
        state[key] = JSON.parse(value);
      } catch {
        state[key] = value;
      }
    } else if (key === 'auth_date') {
      state[key] = new Date(parseInt(value, 10) * 1000);
    } else {
      state[key] = value;
    }
  }
  return state as InitDataState;
}

export function useBaleWebApp(): BaleWebApp | null {
  return useSyncExternalStore(subscribeWebApp, getSnapshot, getSnapshot);
}

export function useIsDark(): boolean {
  return useBaleWebApp()?.colorScheme === 'dark';
}

export function useRawInitData(): string | undefined {
  return useBaleWebApp()?.initData;
}

export function useThemeParamsState(): BaleThemeParams {
  return useBaleWebApp()?.themeParams ?? {};
}

export function useInitData(): { raw?: string; state: InitDataState } {
  const raw = useRawInitData();
  const state = useMemo(() => parseInitData(raw), [raw]);
  return { raw, state };
}

function buildLaunchParams(): LaunchParams {
  const webApp = getWebApp();
  const params = new URLSearchParams(window.location.search);
  return {
    tgWebAppPlatform: webApp?.isIframe ? 'web' : 'android',
    tgWebAppShowSettings: true,
    tgWebAppVersion: webApp?.version ?? '0.0',
    tgWebAppBotInline: false,
    tgWebAppStartParam: params.get('tgWebAppStartParam') ?? params.get('startapp') ?? undefined,
    tgWebAppThemeParams: webApp?.themeParams ?? {},
  };
}

export function useLaunchParams(): LaunchParams {
  const webApp = useBaleWebApp();
  return useMemo(() => {
    if (webApp) {
      return buildLaunchParams();
    }
    return {
      tgWebAppPlatform: 'web',
      tgWebAppShowSettings: true,
      tgWebAppVersion: '0.0',
      tgWebAppBotInline: false,
      tgWebAppStartParam: undefined,
      tgWebAppThemeParams: {},
    };
  }, [webApp]);
}

export function retrieveLaunchParams(): LaunchParams {
  return buildLaunchParams();
}

export const backButton = {
  show(): void {
    getWebApp()?.BackButton.show();
  },
  hide(): void {
    getWebApp()?.BackButton.hide();
  },
  onClick(callback: () => void): () => void {
    const webApp = getWebApp();
    if (!webApp) {
      return () => {};
    }
    webApp.BackButton.onClick(callback);
    return () => webApp.BackButton.offClick(callback);
  },
};

export function openLink(url: string): void {
  const webApp = getWebApp();
  if (webApp) {
    webApp.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

const WebAppContext = createContext<BaleWebApp | null>(null);

export const BaleProvider: FC<PropsWithChildren> = ({ children }) => {
  const webApp = useBaleWebApp();
  return (
    <WebAppContext.Provider value={webApp}>
      {children}
    </WebAppContext.Provider>
  );
};

export function useBaleWebAppContext(): BaleWebApp | null {
  return useContext(WebAppContext);
}