import { type FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useAuth } from '@/context/AuthContext.tsx';
import { updateProfile } from '@/api/client';

import './ProfilePage.css';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        requestContact?: () => Promise<{
          responseUnsafe?: {
            contact?: {
              phone_number?: string;
            };
          };
        }>;
      };
    };
  }
}

export const ProfilePage: FC = () => {
  const navigate = useNavigate();
  const { customer, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    postal_code: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        postal_code: customer.postal_code || '',
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestPhone = async () => {
    setPhoneLoading(true);
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp as any;
        if (tg.requestContact) {
          const result = await tg.requestContact();
          if (result && result.responseUnsafe && result.responseUnsafe.contact) {
            const contact = result.responseUnsafe.contact;
            if (contact.phone_number) {
              setFormData(prev => ({ ...prev, phone: contact.phone_number }));
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to request contact:', err);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        postal_code: formData.postal_code,
      });
      setSuccess(true);

      // Navigate to home after 1.5 seconds
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page back={true}>
      <div className="profile-page">
        {/* Success Overlay */}
        {success && (
          <div className="profile-success-overlay">
            <div className="profile-success-card">
              <div className="profile-success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="profile-success-title">اطلاعات با موفقیت ذخیره شد!</h3>
              <p className="profile-success-text">در حال انتقال به صفحه اصلی...</p>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button className="profile-back-btn" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          بازگشت
        </button>

        <div className="profile-header">
          <div className="profile-avatar">
            {customer?.avatar_url ? (
              <img src={customer.avatar_url} alt={customer.first_name} />
            ) : (
              <div className="profile-avatar-placeholder">
                {customer?.first_name?.charAt(0) || 'ک'}
              </div>
            )}
          </div>
          <h2 className="profile-name">{customer?.first_name} {customer?.last_name}</h2>
          {customer?.username && <p className="profile-username">@{customer.username}</p>}
          {isAdmin && <span className="profile-admin-badge">ادمین</span>}
        </div>

        <div className="profile-info-card">
          <div className="profile-info-row">
            <span className="profile-info-label">شناسه تلگرام</span>
            <span className="profile-info-value">{customer?.id}</span>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div className="profile-field">
            <label className="profile-label">نام</label>
            <input
              type="text"
              name="first_name"
              className="profile-input"
              placeholder="نام"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">نام خانوادگی</label>
            <input
              type="text"
              name="last_name"
              className="profile-input"
              placeholder="نام خانوادگی"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone Field */}
          <div className="profile-field">
            <label className="profile-label">شماره تلفن</label>
            <div className="profile-phone-row">
              <input
                type="tel"
                name="phone"
                className="profile-input profile-input-phone"
                placeholder="شماره تلفن"
                value={formData.phone}
                onChange={handleChange}
                dir="ltr"
                required
              />
              <button
                type="button"
                className="profile-phone-btn"
                onClick={handleRequestPhone}
                disabled={phoneLoading}
              >
                {phoneLoading ? '...' : 'دریافت شماره تلفن'}
              </button>
            </div>
          </div>

          {/* Address Field */}
          <div className="profile-field">
            <label className="profile-label">آدرس</label>
            <textarea
              name="address"
              className="profile-input profile-textarea"
              placeholder="آدرس کامل..."
              value={formData.address}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          {/* Postal Code Field */}
          <div className="profile-field">
            <label className="profile-label">کد پستی</label>
            <input
              type="text"
              name="postal_code"
              className="profile-input"
              placeholder="1234567890"
              value={formData.postal_code}
              onChange={handleChange}
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            className="profile-submit"
            disabled={loading}
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
          </button>
        </form>
      </div>
    </Page>
  );
};
