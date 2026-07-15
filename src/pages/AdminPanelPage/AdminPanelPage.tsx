import { type FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { apiRequest } from '@/api/client';

import './AdminPanelPage.css';

interface Admin {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Stats {
  users: number;
  products: number;
  orders: number;
}

export const AdminPanelPage: FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, orders: 0 });

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin_user');
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && admin) {
      loadStats();
    }
  }, [isLoggedIn, admin]);

  const loadStats = async () => {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        apiRequest<{ total: number }>('/api/users?limit=1'),
        apiRequest<{ total: number }>('/api/products?limit=1'),
        apiRequest<{ total: number }>('/api/orders?limit=1'),
      ]);

      setStats({
        users: usersRes.total || 0,
        products: productsRes.total || 0,
        orders: ordersRes.total || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiRequest<{ success: boolean; token: string; admin: Admin; error?: string }>(
        '/api/admin-auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      if (result.success && result.token) {
        localStorage.setItem('admin_token', result.token);
        localStorage.setItem('admin_user', JSON.stringify(result.admin));
        setAdmin(result.admin);
        setIsLoggedIn(true);
      } else {
        setError(result.error || 'خطا در ورود');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsLoggedIn(false);
    setAdmin(null);
    setEmail('');
    setPassword('');
  };

  // Show login form if not logged in
  if (!isLoggedIn) {
    return (
      <Page back={true}>
        <div className="admin-panel-page">
          <div className="admin-login-header">
            <div className="admin-login-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="admin-login-title">ورود به پنل ادمین</h1>
            <p className="admin-login-subtitle">ایمیل و رمز عبور را وارد کنید</p>
          </div>

          {error && (
            <div className="admin-login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleLogin}>
            <div className="admin-login-field">
              <label className="admin-login-label">ایمیل</label>
              <input
                type="email"
                className="admin-login-input"
                placeholder="admin@armana.ir"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="admin-login-field">
              <label className="admin-login-label">رمز عبور</label>
              <input
                type="password"
                className="admin-login-input"
                placeholder="رمز عبور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
          </form>
        </div>
      </Page>
    );
  }

  // Show admin panel if logged in
  return (
    <Page back={true}>
      <div className="admin-panel-page">
        <div className="admin-panel-header">
          <div className="admin-panel-avatar">
            {admin?.first_name?.charAt(0) || 'A'}
          </div>
          <h2 className="admin-panel-name">{admin?.first_name} {admin?.last_name}</h2>
          <p className="admin-panel-email">{admin?.email}</p>
        </div>

        <div className="admin-panel-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-number">{stats.users}</div>
            <div className="admin-stat-label">کاربران</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-number">{stats.products}</div>
            <div className="admin-stat-label">محصولات</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-number">{stats.orders}</div>
            <div className="admin-stat-label">سفارشات</div>
          </div>
        </div>

        <div className="admin-panel-actions">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-action-card"
          >
            <div className="admin-action-icon admin-action-icon-panel">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className="admin-action-content">
              <h3 className="admin-action-title">مدیریت محصولات</h3>
              <p className="admin-action-desc">افزودن، ویرایش و حذف محصولات</p>
            </div>
          </a>

          <div className="admin-action-card" onClick={() => navigate('/')}>
            <div className="admin-action-icon admin-action-icon-home">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="admin-action-content">
              <h3 className="admin-action-title">بازگشت به خانه</h3>
              <p className="admin-action-desc">رفتن به صفحه اصلی مینی‌اپ</p>
            </div>
          </div>
        </div>

        <button className="admin-panel-logout" onClick={handleLogout}>
          خروج از پنل ادمین
        </button>
      </div>
    </Page>
  );
};
