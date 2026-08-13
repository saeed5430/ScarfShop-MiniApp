import { Navigate, Route, Routes, MemoryRouter } from 'react-router-dom';
import { useIsDark, useLaunchParams } from '@/bale/react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { routes } from '@/navigation/routes.tsx';
import { useAuth } from '@/context/AuthContext';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #E5E7EB',
        borderTop: '4px solid #7C3AED',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <p style={{
        fontFamily: 'Vazirmatn, Estedad, sans-serif',
        fontSize: '14px',
        color: '#6B7280',
        margin: 0,
      }}>
        در حال بارگذاری...
      </p>
    </div>
  );
}

export function App() {
  const lp = useLaunchParams();
  const isDark = useIsDark();
  const { loading } = useAuth();

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <MemoryRouter>
        {loading ? (
          <LoadingScreen />
        ) : (
          <Routes>
            {routes.map((route) => <Route key={route.path} {...route} />)}
            <Route path="*" element={<Navigate to="/"/>}/>
          </Routes>
        )}
      </MemoryRouter>
    </AppRoot>
  );
}