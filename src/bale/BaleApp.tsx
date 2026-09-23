import { useEffect } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { BaleHomePage } from './pages/BaleHomePage';
import { BaleShopPage } from './pages/BaleShopPage';
import { BaleProfilePage } from './pages/BaleProfilePage';
import { BaleOrdersPage } from './pages/BaleOrdersPage';
import { useBaleAuth } from './BaleAuthContext';
import { baleReady, getBaleColorScheme } from './bale-webapp';

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTop: '4px solid #7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontFamily: 'Vazirmatn, sans-serif', fontSize: '14px', color: '#6B7280', margin: 0 }}>در حال بارگذاری...</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '24px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Vazirmatn, sans-serif', fontSize: '15px', color: '#6B7280' }}>{message}</p>
    </div>
  );
}

export function BaleApp() {
  const { loading, error } = useBaleAuth();

  useEffect(() => {
    baleReady();
  }, []);

  return (
    <AppRoot appearance={getBaleColorScheme() === 'dark' ? 'dark' : 'light'} platform="base">
      <MemoryRouter>
        {loading ? <LoadingScreen /> : error ? <ErrorScreen message={error} /> : (
          <Routes>
            <Route path="/" element={<BaleHomePage />} />
            <Route path="/shop" element={<BaleShopPage />} />
            <Route path="/profile" element={<BaleProfilePage />} />
            <Route path="/orders" element={<BaleOrdersPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </MemoryRouter>
    </AppRoot>
  );
}
