import { useEffect, useRef, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBaleAuth } from '../BaleAuthContext';
import { baleUpdateProfile } from '../bale-client';
import { getBaleInitUser } from '../bale-webapp';
import './BaleProfilePage.css';

type FormField = 'first_name' | 'last_name' | 'phone' | 'postal_code' | 'address';

export const BaleProfilePage: FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useBaleAuth();
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
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        postal_code: user.postal_code || '',
      });
    }
  }, [user]);

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
    if (!formData.address.trim()) return { field: 'address', message: 'لطفاً آدرس را وارد کنید.' };
    if (formData.postal_code.trim() && !/^\d{10}$/.test(formData.postal_code)) return { field: 'postal_code', message: 'کد پستی باید دقیقاً ۱۰ رقم باشد.' };
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
      await baleUpdateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        postal_code: formData.postal_code,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch {
      setErrorMessage('خطا در ذخیره اطلاعات.');
    } finally {
      setLoading(false);
    }
  };

  const baleInitUser = getBaleInitUser();
  const baleId = baleInitUser?.id ? String(baleInitUser.id) : user?.id ?? '—';
  const avatar = user?.avatar_url || baleInitUser?.photo_url || null;
  const displayFirst = user?.first_name || baleInitUser?.first_name || '';
  const displayLast = user?.last_name || baleInitUser?.last_name || '';
  const needsAddress = user ? !user.address : false;

  return (
    <div className="bale-profile">
      {success && (
        <div className="bale-profile-overlay">
          <div className="bale-profile-success">
            <div className="bale-profile-success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="bale-profile-success-title">اطلاعات با موفقیت ذخیره شد!</h3>
            <p className="bale-profile-success-text">در حال انتقال به صفحه اصلی...</p>
          </div>
        </div>
      )}

      {errorMessage && <div className="bale-profile-toast" role="alert">{errorMessage}</div>}

      <button className="bale-profile-back" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        بازگشت
      </button>

      <div className="bale-profile-header">
        <div className="bale-profile-avatar">
          {avatar ? (
            <img src={avatar} alt={`${displayFirst} ${displayLast}`.trim()} />
          ) : (
            <div className="bale-profile-avatar-ph">{displayFirst.charAt(0) || 'ک'}</div>
          )}
        </div>
        <h2 className="bale-profile-name">{displayFirst} {displayLast}</h2>
        {user?.username && <p className="bale-profile-username">@{user.username}</p>}
      </div>

      <div className="bale-profile-info">
        <div className="bale-profile-row">
          <span className="bale-profile-label">شناسه بله</span>
          <span className="bale-profile-value">{baleId}</span>
        </div>
      </div>

      {needsAddress && (
        <div className="bale-profile-prompt">
          لطفاً آدرس خود را تکمیل کنید تا بتوانید سفارش ثبت کنید.
        </div>
      )}

      <form className="bale-profile-form" onSubmit={handleSubmit} noValidate>
        <div className="bale-profile-field">
          <label className="bale-profile-flabel">نام <span className="bale-profile-req">*</span></label>
          <input
            type="text"
            name="first_name"
            ref={(el) => { fieldRefs.current.first_name = el; }}
            className={`bale-profile-input ${errorField === 'first_name' ? 'bale-profile-input-err' : ''}`}
            placeholder="نام"
            value={formData.first_name}
            onChange={handleChange}
          />
        </div>

        <div className="bale-profile-field">
          <label className="bale-profile-flabel">نام خانوادگی <span className="bale-profile-req">*</span></label>
          <input
            type="text"
            name="last_name"
            ref={(el) => { fieldRefs.current.last_name = el; }}
            className={`bale-profile-input ${errorField === 'last_name' ? 'bale-profile-input-err' : ''}`}
            placeholder="نام خانوادگی"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>

        <div className="bale-profile-field">
          <label className="bale-profile-flabel">شماره تلفن <span className="bale-profile-req">*</span></label>
          <input
            type="tel"
            name="phone"
            ref={(el) => { fieldRefs.current.phone = el; }}
            className={`bale-profile-input ${errorField === 'phone' ? 'bale-profile-input-err' : ''}`}
            placeholder="09121234567"
            value={formData.phone}
            onChange={handleChange}
            dir="ltr"
            inputMode="numeric"
          />
        </div>

        <div className="bale-profile-field">
          <label className="bale-profile-flabel">آدرس <span className="bale-profile-req">*</span></label>
          <textarea
            name="address"
            ref={(el) => { fieldRefs.current.address = el; }}
            className={`bale-profile-input bale-profile-textarea ${errorField === 'address' ? 'bale-profile-input-err' : ''}`}
            placeholder="آدرس کامل خود را وارد کنید"
            value={formData.address}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="bale-profile-field">
          <label className="bale-profile-flabel">کد پستی <span className="bale-profile-opt">(اختیاری)</span></label>
          <input
            type="text"
            name="postal_code"
            ref={(el) => { fieldRefs.current.postal_code = el; }}
            className={`bale-profile-input ${errorField === 'postal_code' ? 'bale-profile-input-err' : ''}`}
            placeholder="1234567890"
            value={formData.postal_code}
            onChange={handleChange}
            dir="ltr"
            inputMode="numeric"
          />
        </div>

        <button type="submit" className="bale-profile-submit" disabled={loading}>
          {loading ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
        </button>
      </form>
    </div>
  );
};
