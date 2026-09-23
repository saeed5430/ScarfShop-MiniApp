import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBaleAuth } from '../BaleAuthContext';
import { isBaleAdmin, openAdminPanel } from '../bale-webapp';
import { BaleHeader } from '../components/BaleHeader';
import './BaleHomePage.css';

export const BaleHomePage: FC = () => {
  const navigate = useNavigate();
  const { user } = useBaleAuth();
  const isProfileComplete = Boolean(user?.phone && user?.first_name && user?.last_name);
  const showAdmin = isBaleAdmin(user?.username);

  return (
    <div className="bale-home">
      <BaleHeader />
      <div className="bale-welcome">
        <div className="bale-shapes">
          <div className="bale-shape bale-shape-1" />
          <div className="bale-shape bale-shape-2" />
          <div className="bale-shape bale-shape-3" />
          <div className="bale-shape bale-shape-4" />
          <div className="bale-shape bale-shape-5" />
        </div>
        <div className="bale-welcome-content">
          <div className="bale-logo-wrap">
            <div className="bale-logo-circle" aria-label="لوگوی آرمانا">
              <img src="https://ik.imagekit.io/xl73l8llh/products/logoo.jpg" alt="آرمانا" />
            </div>
          </div>
          <h1 className="bale-welcome-title">به فروشگاه آرمانا خوش آمدید</h1>
          <p className="bale-welcome-sub">شال و روسری با کیفیت</p>
        </div>
      </div>

      <div className="bale-hints">
        <div className="bale-hint">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p>
            برای <b>سفارش آنلاین</b> ابتدا باید مشخصات خود را در قسمت <b>مشخصات مشتری</b> وارد کنید
          </p>
        </div>
        <div className="bale-hint">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <p>
            برای سفارش به قسمت <b>سفارش آنلاین</b> بروید
          </p>
        </div>
      </div>

      <div className="bale-actions">
        <button type="button" className="bale-card" onClick={() => navigate('/profile')}>
          <span className="bale-icon bale-icon-profile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span className="bale-card-body">
            <span className="bale-card-title">مشخصات مشتری</span>
            <p className="bale-card-desc">{isProfileComplete ? 'مشاهده و ویرایش اطلاعات' : 'تکمیل اطلاعات برای سفارش'}</p>
          </span>
          {!isProfileComplete && <span className="bale-badge">!</span>}
          <svg className="bale-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          className={`bale-card ${!isProfileComplete ? 'bale-card-disabled' : ''}`}
          onClick={() => navigate(isProfileComplete ? '/shop' : '/profile')}
        >
          <span className="bale-icon bale-icon-buy">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </span>
          <span className="bale-card-body">
            <span className="bale-card-title">سفارش آنلاین</span>
            <p className="bale-card-desc">{isProfileComplete ? 'مشاهده محصولات و ثبت سفارش' : 'ابتدا مشخصات مشتری خود را تکمیل کنید'}</p>
          </span>
          <svg className="bale-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button type="button" className="bale-card" onClick={() => navigate('/orders')}>
          <span className="bale-icon bale-icon-orders">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2h12v20H6z" />
              <path d="M9 6h6M9 10h6M9 14h4" />
            </svg>
          </span>
          <span className="bale-card-body">
            <span className="bale-card-title">پیگیری سفارش‌ها</span>
            <p className="bale-card-desc">مشاهده وضعیت سفارش‌ها</p>
          </span>
          <svg className="bale-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {showAdmin && (
          <button type="button" className="bale-card bale-card-admin" onClick={openAdminPanel}>
            <span className="bale-icon bale-icon-admin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="bale-card-body">
              <span className="bale-card-title">ورود به ادمین</span>
              <p className="bale-card-desc">مدیریت فروشگاه</p>
            </span>
            <svg className="bale-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
