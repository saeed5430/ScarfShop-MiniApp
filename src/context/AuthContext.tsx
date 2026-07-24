import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRawInitData } from '@tma.js/sdk-react';
import { login, getCurrentCustomer, checkIsAdmin, type Customer } from '@/api/client';

interface AuthContextType {
  customer: Customer | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  customer: null,
  isAdmin: false,
  loading: true,
  error: null,
  refreshCustomer: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawInitData = useRawInitData();

  useEffect(() => {
    // Clear any old session
    localStorage.removeItem('session_token');
    localStorage.removeItem('demo_customer');

    if (rawInitData) {
      doLogin(rawInitData);
    } else {
      setLoading(false);
    }
  }, [rawInitData]);

  async function doLogin(initData: string) {
    try {
      localStorage.removeItem('session_token');

      const result = await login(initData);

      if (result.success && result.session_token) {
        localStorage.setItem('session_token', result.session_token);

        const res = await getCurrentCustomer();
        setCustomer(res.customer);

        const adminCheck = await checkIsAdmin();
        setIsAdmin(adminCheck.is_admin);
      } else {
        setError(result.error || 'خطا در ورود');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  }

  // Refresh customer data from server
  async function refreshCustomer() {
    try {
      const res = await getCurrentCustomer();
      setCustomer(res.customer);
    } catch (err) {
      console.error('Failed to refresh customer:', err);
    }
  }

  return (
    <AuthContext.Provider value={{ customer, isAdmin, loading, error, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}
