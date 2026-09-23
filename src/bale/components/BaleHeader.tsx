import type { FC } from 'react';
import { useBaleAuth } from '../BaleAuthContext';
import { getBaleInitUser } from '../bale-webapp';
import './BaleHeader.css';

export const BaleHeader: FC = () => {
  const { user } = useBaleAuth();
  const initUser = getBaleInitUser();
  const avatar = user?.avatar_url || initUser?.photo_url || null;
  const firstName = user?.first_name || initUser?.first_name || '';
  const lastName = user?.last_name || initUser?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initial = firstName.charAt(0) || 'ک';

  return (
    <header className="bale-header">
      <div className="bale-header-avatar">
        {avatar ? (
          <img src={avatar} alt={fullName} />
        ) : (
          <div className="bale-header-avatar-ph">{initial}</div>
        )}
      </div>
      <div className="bale-header-text">
        <span className="bale-header-hello">سلام {fullName || 'دوست عزیز'}!</span>
        <span className="bale-header-sub">به فروشگاه آرمانا خوش آمدید</span>
      </div>
    </header>
  );
};
