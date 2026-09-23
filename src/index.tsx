// Include Telegram UI styles first to allow our code override the package CSS.
import '@telegram-apps/telegram-ui/dist/styles.css';

import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';

import { Root } from '@/components/Root.tsx';
import { getBaleWebApp } from '@/bale/bale-webapp';

import './index.css';

// Mock the environment in case, we are outside Telegram.
import './mockEnv.ts';

const root = ReactDOM.createRoot(document.getElementById('root')!);

function renderBale() {
  root.render(
    <StrictMode>
      <Root platform="bale" />
    </StrictMode>,
  );
}

let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if (getBaleWebApp() || tries > 50) {
    clearInterval(timer);
    renderBale();
  }
}, 100);
