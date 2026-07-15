import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRawInitData } from '@tma.js/sdk-react';
import { login, getCurrentCustomer, checkIsAdmin, type Customer } from '@/api/client';

interface AuthContextType {
  customer: Customer | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({
  customer: null,
  isAdmin: false,
  loading: true,
  error: null,
  isDemo: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

// Demo customer for local testing
const DEMO_CUSTOMER: Customer = {
  id: 'demo_123456789',
  user_type: 'regular',
  first_name: 'سعید',
  last_name: 'احمدی',
  username: 'saeed54300',
  language_code: 'fa',
  avatar_url: null,
  phone: '09121234567',
  address: 'تهران، خیابان ولیعصر',
  postal_code: '1234567890',
  invite_code: null,
  is_premium: false,
  created_at: String(Math.floor(Date.now() / 1000)),
  last_active: String(Math.floor(Date.now() / 1000)),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const rawInitData = useRawInitData();

  useEffect(() => {
    // Check if we're in a real Telegram environment
    const isInTelegram = !!(window as any).Telegram?.WebApp?.initData;

    if (!isInTelegram) {
      // Not in Telegram - use demo mode
      const storedCustomer = localStorage.getItem('demo_customer');

      if (storedCustomer) {
        try {
          const parsedCustomer = JSON.parse(storedCustomer) as Customer;
          setCustomer(parsedCustomer);
          setIsDemo(true);
          setIsAdmin(parsedCustomer.username === 'saeed54300');
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem('demo_customer');
        }
      }

      // First time - create demo customer
      localStorage.setItem('demo_customer', JSON.stringify(DEMO_CUSTOMER));
      setCustomer(DEMO_CUSTOMER);
      setIsDemo(true);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Real Telegram environment - do login
    localStorage.removeItem('demo_customer');
    if (rawInitData) {
      doLogin(rawInitData);
    } else {
      setLoading(false);
    }
  }, [rawInitData]);

  async function doLogin(initData: string) {
    try {
      const result = await login(initData);

      if (result.success && result.session_token) {
        localStorage.setItem('session_token', result.session_token);
        const res = await getCurrentCustomer();
        setCustomer(res.customer);

        const adminCheck = await checkIsAdmin();
        setIsAdmin(adminCheck.is_admin);
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
    <AuthContext.Provider value={{ customer, isAdmin, loading, error, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}
