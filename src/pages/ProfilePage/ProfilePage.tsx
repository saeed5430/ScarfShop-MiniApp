import { type FC, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useAuth } from '@/context/AuthContext.tsx';
import { updateProfile } from '@/api/client';

import './ProfilePage.css';

type FormField = 'first_name' | 'last_name' | 'phone' | 'postal_code' | 'address';

export const ProfilePage: FC = () => {
  const navigate = useNavigate();
  const { customer, isAdmin, refreshCustomer } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorField, setErrorField] = useState<FormField | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    postal_code: '',
  });

  const fieldRefs = useRef<Record<FormField, HTMLInputElement | HTMLTextAreaElement | null>>({
    first_name: null,
    last_name: null,
    phone: null,
    postal_code: null,
    address: null,
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

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  const validate = (): { field: FormField; message: string } | null => {
    if (!formData.first_name.trim()) return { field: 'first_name', message: 'لطفاً نام را وارد کنید.' };
    if (!formData.last_name.trim()) return { field: 'last_name', message: 'لطفاً نام خانوادگی را وارد کنید.' };
    if (!formData.phone.trim()) return { field: 'phone', message: 'لطفاً شماره تلفن را وارد کنید.' };
    if (!/^\d{11}$/.test(formData.phone)) return { field: 'phone', message: 'شماره تلفن باید دقیقاً ۱۱ رقم باشد.' };
    if (formData.postal_code.trim() && !/^\d{10}$/.test(formData.postal_code)) return { field: 'postal_code', message: 'کد پستی باید دقیقاً ۱۰ رقم باشد.' };
    if (!formData.address.trim()) return { field: 'address', message: 'لطفاً آدرس را وارد کنید.' };
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'phone') next = value.replace(/\D/g, '').slice(0, 11);
    if (name === 'postal_code') next = value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, [name]: next }));
    if (errorField === name) setErrorField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const error = validate();
    if (error) {
      setErrorField(error.field);
      setErrorMessage(error.message);
      fieldRefs.current[error.field]?.focus();
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        postal_code: formData.postal_code,
      });

      await refreshCustomer();
      setSuccess(true);

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const needsAddress = customer ? !customer.address : false;

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

        {/* Error Toast */}
        {errorMessage && (
          <div className="profile-toast" role="alert">{errorMessage}</div>
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

        {/* Address completion prompt for customers without address */}
        {needsAddress && (
          <div className="profile-address-prompt">
            لطفاً آدرس خود را تکمیل کنید تا بتوانید سفارش ثبت کنید.
          </div>
        )}

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          {/* Required Fields */}
          <div className="profile-field">
            <label className="profile-label">
              نام <span className="profile-required">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              ref={(el) => { fieldRefs.current.first_name = el; }}
              className={`profile-input ${errorField === 'first_name' ? 'profile-input-error' : ''}`}
              placeholder="نام"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">
              نام خانوادگی <span className="profile-required">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              ref={(el) => { fieldRefs.current.last_name = el; }}
              className={`profile-input ${errorField === 'last_name' ? 'profile-input-error' : ''}`}
              placeholder="نام خانوادگی"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          {/* Phone Field - Required, 11 digits */}
          <div className="profile-field">
            <label className="profile-label">
              شماره تلفن <span className="profile-required">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              ref={(el) => { fieldRefs.current.phone = el; }}
              className={`profile-input ${errorField === 'phone' ? 'profile-input-error' : ''}`}
              placeholder="09121234567"
              value={formData.phone}
              onChange={handleChange}
              dir="ltr"
              inputMode="numeric"
            />
          </div>

          {/* Address Field - Required */}
          <div className="profile-field">
            <label className="profile-label">
              آدرس <span className="profile-required">*</span>
            </label>
            <textarea
              name="address"
              ref={(el) => { fieldRefs.current.address = el; }}
              className={`profile-input profile-textarea ${errorField === 'address' ? 'profile-input-error' : ''}`}
              placeholder="آدرس کامل خود را وارد کنید"
              value={formData.address}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {/* Postal Code - Optional, 10 digits when filled */}
          <div className="profile-field">
            <label className="profile-label">
              کد پستی <span className="profile-optional">(اختیاری)</span>
            </label>
            <input
              type="text"
              name="postal_code"
              ref={(el) => { fieldRefs.current.postal_code = el; }}
              className={`profile-input ${errorField === 'postal_code' ? 'profile-input-error' : ''}`}
              placeholder="1234567890"
              value={formData.postal_code}
              onChange={handleChange}
              dir="ltr"
              inputMode="numeric"
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
