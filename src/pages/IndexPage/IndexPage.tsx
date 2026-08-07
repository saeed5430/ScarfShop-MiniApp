import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { Header } from '@/components/Header/Header.tsx';
import { useAuth } from '@/context/AuthContext.tsx';

import './IndexPage.css';

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const { customer, loading } = useAuth();

  // Profile must have: phone, first_name, last_name (username comes from Telegram)
  const isProfileComplete = Boolean(
    customer?.phone &&
    customer?.first_name &&
    customer?.last_name
  );

  return (
    <Page back={false}>
      <div className="home-page">
        <Header />

        <div className="home-welcome-section">
          <div className="welcome-bg-shapes">
            <div className="shape shape-1" />
            <div className="shape shape-2" />
            <div className="shape shape-3" />
            <div className="shape shape-4" />
            <div className="shape shape-5" />
          </div>
          <div className="home-welcome-content">
            <div className="home-logo-circle-section">
              <div className="home-logo-circle" aria-label="لوگوی آرمانا">
                <img
                  src="https://ik.imagekit.io/xl73l8llh/products/logoo.jpg"
                  alt="آرمانا"
                  className="home-logo-circle-img"
                />
              </div>
            </div>
            <h1 className="home-welcome-title">به فروشگاه آرمانا خوش آمدید</h1>
            <p className="home-welcome-sub">شال و روسری با کیفیت</p>
          </div>
        </div>

        {/* Hint Notes - between welcome and action cards */}
        <div className="home-hints-section">
          <div className="home-hints">
            <div className="hint-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <p className="hint-text">
                برای <span className="hint-highlight">سفارش آنلاین</span> ابتدا باید مشخصات خود را در قسمت <span className="hint-highlight">مشخصات مشتری</span> وارد کنید
              </p>
            </div>
            <div className="hint-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <p className="hint-text">
                برای سفارش به قسمت <span className="hint-highlight">سفارش آنلاین</span> بروید
              </p>
            </div>
          </div>
        </div>

        <div className="home-content">
          <div className="home-actions">
            {/* Profile Card */}
            <div className="action-card" onClick={() => navigate('/profile')}>
              <div className="action-icon action-icon-profile">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">مشخصات مشتری</h3>
                <p className="action-desc">
                  {isProfileComplete ? 'مشاهده و ویرایش اطلاعات' : 'تکمیل اطلاعات برای سفارش'}
                </p>
              </div>
              {!isProfileComplete && <div className="action-badge">!</div>}
              <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>

            {/* Online Order Card */}
            <div
              className={`action-card ${!isProfileComplete ? 'action-card-disabled' : ''}`}
              onClick={() => {
                if (isProfileComplete) {
                  navigate('/quick-buy');
                } else {
                  navigate('/profile');
                }
              }}
            >
              <div className="action-icon action-icon-buy">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">سفارش آنلاین</h3>
                <p className="action-desc">
                  {isProfileComplete ? 'مشاهده محصولات و ثبت سفارش' : 'ابتدا مشخصات مشتری خود را تکمیل کنید'}
                </p>
              </div>
              <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>

            <div className="action-card" onClick={() => navigate('/orders')}>
              <div className="action-icon action-icon-profile">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2h12v20H6z" />
                  <path d="M9 6h6M9 10h6M9 14h4" />
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">پیگیری سفارش‌ها</h3>
                <p className="action-desc">مشاهده وضعیت پرداخت و فیش</p>
              </div>
              <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>

            {/* Admin Panel Card - only for @saeed54300 (Telegram ID: 6451725218) */}
            {!loading && customer?.id === '6451725218' && (
              <div className="action-card" onClick={() => window.open('https://scarf-admin.pages.dev/login', '_blank')}>
                <div className="action-icon action-icon-admin">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="action-content">
                  <h3 className="action-title">ورود به پنل ادمین</h3>
                  <p className="action-desc">مدیریت فروشگاه</p>
                </div>
                <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};
