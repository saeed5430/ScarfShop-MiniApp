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

// Extract user ID from initData
function extractUserId(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return String(user.id);
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rawInitData = useRawInitData();

  useEffect(() => {
    if (rawInitData) {
      doLogin(rawInitData);
    }
  }, [rawInitData]);

  async function doLogin(initData: string) {
    try {
      // Get current Telegram user ID
      const telegramUserId = extractUserId(initData);

      // Check if we have a stored session for THIS user
      const storedUserId = localStorage.getItem('telegram_user_id');
      const existingToken = localStorage.getItem('session_token');

      // If session exists but belongs to different user, clear it
      if (existingToken && storedUserId !== telegramUserId) {
        localStorage.removeItem('session_token');
        localStorage.removeItem('telegram_user_id');
      }

      // Create new session with Telegram
      const result = await login(initData);

      if (result.success && result.session_token) {
        localStorage.setItem('session_token', result.session_token);
        localStorage.setItem('telegram_user_id', telegramUserId || '');

        // Fetch customer data with the new session
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
