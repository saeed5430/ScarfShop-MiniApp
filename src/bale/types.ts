export interface BaleWebAppUser {
  id: number;
  first_name: string;
  username?: string;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

export interface BaleWebAppInitData {
  query_id?: string;
  user?: BaleWebAppUser;
  auth_date?: number;
  hash?: string;
}

export interface BaleThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface BaleBackButton {
  isVisible: boolean;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
}

export interface BaleSettingsButton {
  isVisible: boolean;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
  show(): void;
  hide(): void;
}

export type BaleColorScheme = 'light' | 'dark';

export interface BaleWebApp {
  initData: string;
  initDataUnsafe: BaleWebAppInitData;
  version: string;
  isIframe: boolean;
  themeParams: BaleThemeParams;
  isClosingConfirmationEnabled: boolean;
  BackButton: BaleBackButton;
  SettingsButton: BaleSettingsButton;
  colorScheme: BaleColorScheme;
  isMiniAppSupported: boolean;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  addToHomeScreen(): void;
  checkHomeScreenStatus?(callback?: (status: string) => void): void;
  requestContact?(callback?: (shared: boolean, phone?: string) => void): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  onEvent(eventType: string, eventHandler: (...args: unknown[]) => void): void;
  offEvent(eventType: string, eventHandler: (...args: unknown[]) => void): void;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  showScanQrPopup?(data?: unknown): void;
  sendData(data: string): void;
  openInvoice?(invoiceParams: unknown, callback?: (result: { status: string }) => void): void;
  askReview?(data: { delay_seconds: number }): void;
}

declare global {
  interface Window {
    Bale?: {
      WebApp?: BaleWebApp;
    };
  }
}

export {};