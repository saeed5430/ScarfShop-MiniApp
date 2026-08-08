import { type FC, useEffect, useState } from 'react';
import { getOrderReceipt, DELIVERY_LABELS, type Order } from '@/api/client.ts';

type MediaState = {
  url: string | null;
  loading: boolean;
  error: boolean;
};

const useOrderMedia = (orderId: number, type: 'invoice' | 'voice'): MediaState => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrderReceipt(orderId, type)
      .then((objectUrl) => { if (!cancelled) setUrl(objectUrl); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, type]);

  return { url, loading, error };
};

export const OrderCard: FC<{ order: Order }> = ({ order }) => {
  const invoiceMedia = useOrderMedia(order.id, 'invoice');
  const voiceMedia = useOrderMedia(order.id, 'voice');

  return (
    <article className="order-card">
      <div className="order-card-header">
        <strong>خرید شماره {order.customer_order_number ?? order.id}</strong>
        <span className="order-code">کد سفارش #{order.id}</span>
      </div>

      {order.delivery_method && (
        <div className="order-delivery">
          📦 {DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method}
        </div>
      )}

      {order.items && order.items.length > 0 && (
        <ul className="order-items">
          {order.items.map((item, index) => (
            <li key={index} className="order-item">
              <span className="order-item-name">{item.product_name ?? 'محصول'}</span>
              <span className="order-item-meta">
                {item.color_name && (
                  <span className="order-item-color">
                    <i className="order-color-dot" style={{ backgroundColor: item.color_hex || '#999' }} />
                    {item.color_name}
                  </span>
                )}
                {item.size_dimensions && <span className="order-item-size">سایز {item.size_dimensions}</span>}
              </span>
              <span className="order-item-qty">× {item.quantity}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={`order-receipt-status ${order.invoice_uploaded_at ? 'ok' : 'missing'}`}>
        {order.invoice_uploaded_at ? 'فیش ثبت شده' : 'فیش ثبت نشده'}
      </div>

      {order.invoice_uploaded_at && (
        <div className="order-media">
          {invoiceMedia.loading && <p className="order-media-hint">در حال دریافت فیش...</p>}
          {invoiceMedia.error && <p className="order-media-hint">دریافت فیش ممکن نشد.</p>}
          {invoiceMedia.url && <img className="order-invoice-image" src={invoiceMedia.url} alt="فیش واریز" />}
        </div>
      )}

      {order.voice_uploaded_at && (
        <div className="order-media">
          {voiceMedia.loading && <p className="order-media-hint">در حال دریافت صوت...</p>}
          {voiceMedia.error && <p className="order-media-hint">دریافت صوت ممکن نشد.</p>}
          {voiceMedia.url && <audio className="order-voice" controls src={voiceMedia.url} />}
        </div>
      )}
    </article>
  );
};
