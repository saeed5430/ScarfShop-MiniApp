import type { BaleWebApp, BaleThemeParams } from './types';
import { setWebApp } from './webApp';

function createMockButton() {
  let visible = false;
  const handlers = new Set<() => void>();
  return {
    get isVisible() {
      return visible;
    },
    onClick(callback: () => void) {
      handlers.add(callback);
    },
    offClick(callback: () => void) {
      handlers.delete(callback);
    },
    show() {
      visible = true;
    },
    hide() {
      visible = false;
    },
  };
}

export function installBaleMock(): void {
  const themeParams: BaleThemeParams = {
    accent_text_color: '#6ab2f2',
    bg_color: '#17212b',
    button_color: '#5288c1',
    button_text_color: '#ffffff',
    destructive_text_color: '#ec3942',
    header_bg_color: '#17212b',
    hint_color: '#708499',
    link_color: '#6ab3f3',
    secondary_bg_color: '#232e3c',
    section_bg_color: '#17212b',
    section_header_text_color: '#6ab3f3',
    subtitle_text_color: '#708499',
    text_color: '#f5f5f5',
  };

  const authDate = Math.floor(Date.now() / 1000);
  const initData = new URLSearchParams([
    ['auth_date', authDate.toString()],
    ['hash', 'some-hash'],
    ['user', JSON.stringify({ id: 1, first_name: 'Vladislav' })],
  ]).toString();

  const webApp: BaleWebApp = {
    initData,
    initDataUnsafe: {
      query_id: 'AAMockQueryId',
      user: { id: 1, first_name: 'Vladislav' },
      auth_date: authDate,
      hash: 'some-hash',
    },
    version: '1.0.0',
    isIframe: true,
    themeParams,
    isClosingConfirmationEnabled: false,
    BackButton: createMockButton(),
    SettingsButton: createMockButton(),
    colorScheme: 'dark',
    isMiniAppSupported: true,
    openLink: (url) => {
      window.open(url, '_blank');
    },
    addToHomeScreen() {},
    enableClosingConfirmation() {},
    disableClosingConfirmation() {},
    onEvent() {},
    offEvent() {},
    ready() {},
    expand() {},
    close() {},
    setHeaderColor() {},
    sendData() {},
  };

  window.Bale = { WebApp: webApp };
  setWebApp(webApp);
}