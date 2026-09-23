import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { baleGetMyOrders, BALE_DELIVERY_LABELS, type BaleDeliveryMethod, type BaleOrder } from '../bale-client';
import './BaleOrdersPage.css';

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

function formatFaDateTime(unixSec: number | null | undefined): string | null {
  if (!unixSec) return null;
  const d = new Date(unixSec * 1000);
  const fmt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
  return fmt.format(d);
}

function deliveryLabel(method: string | null): string {
  if (!method) return 'نامشخص';
  const labels = BALE_DELIVERY_LABELS as Record<string, string>;
  return labels[method] ?? method;
}

function orderImage(order: BaleOrder): string | null {
  for (const it of order.items ?? []) {
    const img = it.product_images?.[0];
    if (typeof img === 'string' && img) return img;
  }
  return null;
}

const BaleOrderDetail: FC<{ order: BaleOrder; onBack: () => void }> = ({ order, onBack }) => {
  const image = orderImage(order);
  const receiptTime = formatFaDateTime(order.invoice_uploaded_at ?? order.receipt_uploaded_at);
  const totalQty = useMemo(
    () => (order.items ?? []).reduce((sum, it) => sum + (it.quantity || 0), 0),
    [order]
  );

  return (
    <div className="bale-order-detail">
      <div className="bale-order-detail-topbar">
        <h1 className="bale-order-detail-title">خرید شماره {toFa(totalQty)}</h1>
        <span className="bale-order-detail-code">کد سفارش #{toFa(order.id)}</span>
      </div>

      <div className="bale-order-delivery-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
        <span>{deliveryLabel(order.delivery_method as BaleDeliveryMethod | null)}</span>
      </div>

      <div className="bale-order-items-box">
        {(order.items ?? []).map((it, i) => (
          <div key={i} className="bale-order-detail-row">
            <span className="bale-order-detail-product">{it.product_name ?? 'محصول'}</span>
            <span className="bale-order-detail-color">
              {it.color_hex && <span className="bale-order-detail-dot" style={{ backgroundColor: it.color_hex }} />}
              {[it.color_name, it.size_dimensions ? `${it.size_dimensions} سایز` : null].filter(Boolean).join(' ')}
            </span>
            <span className="bale-order-detail-qty">{toFa(it.quantity)} x</span>
          </div>
        ))}
        {(order.items ?? []).length === 0 && (
          <div className="bale-order-detail-row">
            <span className="bale-order-detail-product">بدون قلم</span>
          </div>
        )}
      </div>

      {receiptTime && (
        <div className="bale-order-receipt-box">
          فیش ثبت شده {receiptTime}
        </div>
      )}

      {image && (
        <div className="bale-order-image-wrap">
          <img src={image} alt="تصویر محصول" className="bale-order-image" loading="lazy" />
        </div>
      )}

      <button type="button" className="bale-order-back-btn" onClick={onBack}>
        بازگشت به سفارش‌ها
      </button>
    </div>
  );
};

export const BaleOrdersPage: FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<BaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    baleGetMyOrders().then((r) => setOrders(r.orders)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selected = selectedId !== null ? orders.find((o) => o.id === selectedId) ?? null : null;

  if (selected) {
    return (
      <main className="bale-orders">
        <BaleOrderDetail order={selected} onBack={() => setSelectedId(null)} />
      </main>
    );
  }

  return (
    <main className="bale-orders">
      <div className="bale-orders-topbar">
        <h1>سفارش‌های من</h1>
        <button type="button" className="bale-orders-home-btn" onClick={() => navigate('/')}>بازگشت</button>
      </div>
      {loading && <p className="bale-orders-empty">در حال دریافت سفارش‌ها...</p>}
      {!loading && orders.length === 0 && <p className="bale-orders-empty">هنوز سفارشی ثبت نکرده‌اید.</p>}
      {!loading && orders.length > 0 && (
        <div className="bale-orders-list">
          {orders.map((o) => (
            <button key={o.id} type="button" className="bale-order-card bale-order-card--clickable" onClick={() => setSelectedId(o.id)}>
              <div className="bale-order-header">
                <strong>سفارش #{toFa(o.id)}</strong>
                <span className={`bale-order-status ${o.payment_status === 'paid' ? 'bale-order-status-paid' : 'bale-order-status-pending'}`}>
                  {o.payment_status === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                </span>
              </div>
              {(o.items ?? []).length > 0 && (
                <ul className="bale-order-items">
                  {(o.items ?? []).slice(0, 3).map((it, i) => (
                    <li key={i} className="bale-order-item">
                      <span>{it.product_name ?? 'محصول'}{it.color_name ? ` — ${it.color_name}` : ''}{it.size_dimensions ? ` — ${it.size_dimensions}` : ''}</span>
                      <span className="bale-order-qty">×{toFa(it.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="bale-order-more">مشاهده جزئیات</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
};
