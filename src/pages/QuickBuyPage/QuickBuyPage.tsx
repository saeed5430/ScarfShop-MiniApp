import { type FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useAuth } from '@/context/AuthContext';
import {
  getCategories,
  getProducts,
  getProductColors,
  getProductSizes,
  createOrder,
  DELIVERY_LABELS,
  type Category,
  type Product,
  type Color,
  type DeliveryMethod,
  type Size,
} from '@/api/client.ts';
import { FilterBar } from './FilterBar.tsx';
import { ProductCard } from './ProductCard.tsx';

import './QuickBuyPage.css';

export interface ProductWithRelations {
  product: Product;
  category: Category | null;
  colors: Color[];
  sizes: Size[];
}

export interface SelectedItem {
  productId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
}

export const QuickBuyPage: FC = () => {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('in_person');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts(selectedCategory ?? undefined, searchQuery || undefined)
      .then(async (res) => {
        const enriched: ProductWithRelations[] = await Promise.all(
          res.items.map(async (product) => {
            const [colorsRes, sizesRes] = await Promise.all([
              getProductColors(product.id).catch(() => ({ colors: [] })),
              getProductSizes(product.id).catch(() => ({ sizes: [] })),
            ]);

            const category = categories.find((c) => c.id === product.category_id) || null;

            return {
              product,
              category,
              colors: colorsRes.colors || [],
              sizes: sizesRes.sizes || [],
            };
          })
        );
        setProducts(enriched);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [selectedCategory, searchQuery, categories]);

  const toggleColor = useCallback((productId: number, colorId: number, sizeId: number) => {
    const key = `${productId}-${colorId}-${sizeId}`;
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { productId, colorId, sizeId, quantity: 1 });
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback((key: string, delta: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const item = next.get(key);
      if (item) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty === 0) {
          next.delete(key);
        } else {
          next.set(key, { ...item, quantity: newQty });
        }
      }
      return next;
    });
  }, []);

  const orderSummary = useMemo(() => {
    const productMap = new Map<number, {
      product: Product;
      category: Category | null;
      items: Array<{ color: Color; size: Size; quantity: number }>;
    }>();

    selectedItems.forEach((item) => {
      const productData = products.find((p) => p.product.id === item.productId);
      if (!productData) return;

      const color = productData.colors.find((c) => c.id === item.colorId);
      const size = productData.sizes.find((s) => s.id === item.sizeId);
      if (!color || !size) return;

      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          product: productData.product,
          category: productData.category,
          items: [],
        });
      }

      productMap.get(item.productId)!.items.push({ color, size, quantity: item.quantity });
    });

    return Array.from(productMap.values());
  }, [selectedItems, products]);

  const totalQuantity = useMemo(() => {
    let total = 0;
    selectedItems.forEach((item) => { total += item.quantity; });
    return total;
  }, [selectedItems]);

  const handleSubmit = useCallback(async () => {
    if (!customer || submitting || selectedItems.size === 0) return;

    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const items = Array.from(selectedItems.values()).map((item) => ({
        product_id: item.productId,
        color_id: item.colorId,
        size_id: item.sizeId,
        quantity: item.quantity,
      }));

      await createOrder({
        user_id: customer.id,
        delivery_method: deliveryMethod,
        items,
      });

      setSubmitSuccess(true);
      setSelectedItems(new Map());
      setDeliveryMethod('in_person');

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Order submission failed:', err);
      setSubmitting(false);
    }
  }, [customer, submitting, selectedItems, deliveryMethod, navigate]);

  return (
    <Page back={true}>
      <div className="quickbuy-page">
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="quickbuy-guide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>ترتیب محصولات بر اساس سایز است: ابتدا محصولات سایز ۱۳۰، سپس سایز ۱۰۰ قرار داده شده‌اند.</span>
        </div>

        <div className="quickbuy-list">
          {loading && (
            <>
              <div className="quickbuy-skeleton" />
              <div className="quickbuy-skeleton" />
              <div className="quickbuy-skeleton" />
            </>
          )}

          {!loading && products.length === 0 && (
            <div className="quickbuy-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>محصولی یافت نشد</p>
            </div>
          )}

          {!loading && products.map((pwr) =>
            pwr.sizes.length > 0
              ? pwr.sizes.map((size) => (
                <ProductCard
                  key={`${pwr.product.id}-${size.id}`}
                  productWithRelations={pwr}
                  selectedSize={size}
                  selectedItems={selectedItems}
                  onToggleColor={toggleColor}
                  onUpdateQuantity={updateQuantity}
                />
              ))
              : (
                <ProductCard
                  key={pwr.product.id}
                  productWithRelations={pwr}
                  selectedSize={null}
                  selectedItems={selectedItems}
                  onToggleColor={toggleColor}
                  onUpdateQuantity={updateQuantity}
                />
              )
          )}
        </div>

        {submitSuccess && (
          <div className="quickbuy-success-overlay">
            <div className="quickbuy-success-card">
              <div className="quickbuy-success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="quickbuy-success-title">سفارش با موفقیت ثبت شد!</h3>
              <p className="quickbuy-success-text">در حال انتقال به صفحه اصلی...</p>
            </div>
          </div>
        )}

        {orderSummary.length > 0 && !submitSuccess && (
          <div className="quickbuy-order-summary">
            <div className="quickbuy-order-header">
              <h3 className="quickbuy-order-title">خلاصه سفارش</h3>
              <span className="quickbuy-order-total">{totalQuantity} کالا</span>
            </div>

            {orderSummary.map((group) => (
              <div key={group.product.id} className="quickbuy-order-group">
                <div className="quickbuy-order-product-name">
                  {[group.category?.name, group.product.name].filter(Boolean).join(' ')}
                </div>
                {group.items.map((item, index) => (
                  <div key={index} className="quickbuy-order-item">
                    <div className="quickbuy-order-item-left">
                      <div
                        className="quickbuy-order-item-dot"
                        style={{ backgroundColor: item.color.hex }}
                      />
                      <span>{item.color.name}</span>
                      <span className="quickbuy-order-item-size">سایز {item.size.dimensions}</span>
                    </div>
                    <span className="quickbuy-order-item-qty">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            ))}

            <div className="quickbuy-delivery">
              <div className="quickbuy-delivery-title">نحوه تحویل سفارش</div>
              <div className="quickbuy-delivery-options">
                {(Object.keys(DELIVERY_LABELS) as DeliveryMethod[]).map((method) => (
                  <button
                    type="button"
                    key={method}
                    className={`quickbuy-delivery-option ${deliveryMethod === method ? 'active' : ''}`}
                    onClick={() => setDeliveryMethod(method)}
                  >
                    {DELIVERY_LABELS[method]}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="quickbuy-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || selectedItems.size === 0}
            >
              {submitting ? 'در حال ثبت...' : 'ثبت سفارش'}
            </button>
          </div>
        )}
      </div>
    </Page>
  );
};
