import { type FC, useEffect, useState } from 'react';
import { Page } from '@/components/Page.tsx';
import { getMyOrders, type Order } from '@/api/client.ts';
import { OrderCard } from './OrderCard';
import './OrdersPage.css';

export const OrdersPage: FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMyOrders()
      .then((result) => setOrders(result.orders))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Page>
      <main className="orders-page">
        <h1>سفارش‌های من</h1>
        {loading && <p>در حال دریافت سفارش‌ها...</p>}
        {!loading && error && <p>دریافت سفارش‌ها ممکن نشد.</p>}
        {!loading && !error && orders.length === 0 && <p>هنوز سفارشی ثبت نکرده‌اید.</p>}
        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </Page>
  );
};
