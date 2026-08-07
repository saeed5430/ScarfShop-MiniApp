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
              <div>
                <strong>سفارش #{order.id}</strong>
                <span>{order.payment_status === 'paid' ? '✅ پرداخت شده' : '❌ پرداخت نشده'}</span>
              </div>
              {order.invoice_uploaded_at && (
                <button type="button" onClick={() => void openReceipt(order.id, 'invoice')}>
                  مشاهده فیش
                </button>
              )}
              {order.voice_uploaded_at && (
                <button type="button" onClick={() => void openReceipt(order.id, 'voice')}>
                  پخش توضیح صوتی
                </button>
              )}
            </article>
          ))}
        </div>
      </main>
    </Page>
  );
};
