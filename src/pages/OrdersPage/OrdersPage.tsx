import { type FC, useEffect, useState } from 'react';
import { Page } from '@/components/Page.tsx';
import { getMyOrders, getOrderReceipt, type Order } from '@/api/client.ts';
import './OrdersPage.css';

export const OrdersPage: FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders().then((result) => setOrders(result.orders)).finally(() => setLoading(false));
  }, []);

  const openReceipt = async (orderId: number, type: 'invoice' | 'voice') => {
    const url = await getOrderReceipt(orderId, type);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <Page>
      <main className="orders-page">
        <h1>سفارش‌های من</h1>
        {loading && <p>در حال دریافت سفارش‌ها...</p>}
        {!loading && orders.length === 0 && <p>هنوز سفارشی ثبت نکرده‌اید.</p>}
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-item" key={order.id}>
              <div className="order-item-info">
                <strong>خرید شماره {order.customer_order_number ?? order.id}</strong>
                <small>کد سفارش #{order.id}</small>
                <span>{order.payment_status === 'paid' ? '✅ پرداخت شده' : '❌ پرداخت نشده'}</span>
                <span>{order.invoice_uploaded_at ? '✅ فیش ثبت شده' : '❌ فیش ثبت نشده'}</span>
                <span>{order.voice_uploaded_at ? '✅ توضیح صوتی ثبت شده' : '❌ توضیح صوتی ثبت نشده'}</span>
              </div>
              <div className="order-item-actions">
                <button type="button" disabled={!order.invoice_uploaded_at} onClick={() => void openReceipt(order.id, 'invoice')}>
                  {order.invoice_uploaded_at ? 'مشاهده فیش' : 'فیش موجود نیست'}
                </button>
                <button type="button" disabled={!order.voice_uploaded_at} onClick={() => void openReceipt(order.id, 'voice')}>
                  {order.voice_uploaded_at ? 'پخش توضیح صوتی' : 'صوت موجود نیست'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </Page>
  );
};
