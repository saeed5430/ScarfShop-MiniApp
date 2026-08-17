import { type FC, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext.tsx';

import './Header.css';

export const Header: FC = () => {
  const { customer } = useAuth();

  const customerName = useMemo(() => {
    return customer?.last_name ?? 'کاربر';
  }, [customer]);

  const customerAvatar = useMemo(() => {
    const photoUrl = customer?.avatar_url;
    if (photoUrl) {
      return photoUrl;
    }
    const firstName = customer?.first_name ?? '';
    const firstChar = firstName.charAt(0) || 'S';
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#7C3AED"/><text x="20" y="20" text-anchor="middle" dy=".35em" font-family="Vazirmatn,sans-serif" font-size="18" font-weight="600" fill="white">${firstChar}</text></svg>`)}`;
  }, [customer]);

  return (
    <header className="app-header">
      <div className="header-left">
        <img
          src={customerAvatar}
          alt={customerName}
          className="header-user-avatar"
        />
      </div>

      <div className="header-center">
        <div className="header-greeting">
          <span className="header-hello">سلام،</span>
          <span className="header-name">{customerName}!</span>
        </div>
      </div>

      <div className="header-right" aria-hidden="true" />
    </header>
  );
};