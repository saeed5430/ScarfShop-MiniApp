import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRawInitData } from '@tma.js/sdk-react';
import { login, getCurrentUser, type User } from '@/api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawInitData = useRawInitData();

  useEffect(() => {
    if (!rawInitData) return;

    localStorage.removeItem('session_token');
    doLogin(rawInitData);
  }, [rawInitData]);

  async function doLogin(initData: string) {
    try {
      const result = await login(initData);

      if (result.success && result.session_token) {
        localStorage.setItem('session_token', result.session_token);
        const res = await getCurrentUser();
        setUser(res.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
