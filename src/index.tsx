// Include Telegram UI styles first to allow our code override the package CSS.
import '@telegram-apps/telegram-ui/dist/styles.css';

import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';

import { Root } from '@/components/Root.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { getWebApp } from '@/bale/webApp';
import { init } from '@/init.ts';

import './index.css';

// Mock the environment in case, we are outside Bale.
import './mockEnv.ts';

const root = ReactDOM.createRoot(document.getElementById('root')!);

try {
  const webApp = getWebApp();
  const startParam = new URLSearchParams(window.location.search).get('tgWebAppStartParam') || '';
  const debug = startParam.includes('debug') || import.meta.env.DEV;

  // Configure all application dependencies.
  await init({
    debug,
    eruda: debug && webApp?.isIframe === false,
  })
    .then(() => {
      root.render(
        <StrictMode>
          <Root/>
        </StrictMode>,
      );
    });
} catch {
  root.render(<EnvUnsupported/>);
}