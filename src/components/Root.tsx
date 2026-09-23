import { TonConnectUIProvider } from '@tonconnect/ui-react';

import { App } from '@/components/App.tsx';
import { BaleApp } from '@/bale/BaleApp.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';
import { AuthProvider } from '@/context/AuthContext.tsx';
import { BaleAuthProvider } from '@/bale/BaleAuthContext.tsx';
import { publicUrl } from '@/helpers/publicUrl.ts';

function ErrorBoundaryError({ error }: { error: unknown }) {
  return (
    <div>
      <p>An unhandled error occurred:</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

export function Root({ platform }: { platform: 'bale' | 'telegram' }) {
  if (platform === 'bale') {
    return (
      <ErrorBoundary fallback={ErrorBoundaryError}>
        <BaleAuthProvider>
          <BaleApp />
        </BaleAuthProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <TonConnectUIProvider
        manifestUrl={publicUrl('tonconnect-manifest.json')}
      >
        <AuthProvider>
          <App/>
        </AuthProvider>
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}
