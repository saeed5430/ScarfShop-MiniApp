import { type FC, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext.tsx';

import './Header.css';

export const Header: FC = () => {
  const { user } = useAuth();

  const userName = useMemo(() => {
    return user?.first_name ?? 'کاربر';
  }, [user]);

  const userAvatar = useMemo(() => {
    const photoUrl = user?.avatar_url;
    if (photoUrl) {
      return photoUrl;
    }
    const firstName = user?.first_name ?? '';
    const firstChar = firstName.charAt(0) || 'S';
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#7C3AED"/><text x="20" y="20" text-anchor="middle" dy=".35em" font-family="Vazirmatn,sans-serif" font-size="18" font-weight="600" fill="white">${firstChar}</text></svg>`)}`;
  }, [user]);

  return (
    <header className="app-header">
      <div className="header-shop">
        <img
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%237C3AED'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-family='Vazirmatn,sans-serif' font-size='16' font-weight='700' fill='white'%3ES%3C/text%3E%3C/svg%3E"
          alt="Scarf Store"
          className="header-shop-logo"
        />
      </div>

      <div className="header-greeting">
        <span className="header-hello">سلام،</span>
        <span className="header-name">{userName}!</span>
      </div>

      <div className="header-user">
        <img
          src={userAvatar}
          alt={userName}
          className="header-user-avatar"
        />
      </div>
    </header>
  );
};
