import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  baleGetCategories,
  baleGetProducts,
  baleGetProductColors,
  baleGetProductSizes,
  baleGetSizes,
  baleCreateOrder,
  BALE_DELIVERY_LABELS,
  type BaleCategory,
  type BaleProduct,
  type BaleColor,
  type BaleDeliveryMethod,
  type BaleSize,
} from '../bale-client';
import { BaleFilterBar } from './BaleFilterBar';
import { BaleProductCard } from './BaleProductCard';
import './BaleShopPage.css';

export interface BaleProductWithRelations {
  product: BaleProduct;
  category: BaleCategory | null;
  colors: BaleColor[];
  sizes: BaleSize[];
}

export interface BaleSelectedItem {
  productId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
}

export interface BaleDisplayItem {
  pwr: BaleProductWithRelations;
  displaySize: BaleSize | null;
}

function sizeValue(size: BaleSize): number {
  const n = parseFloat(size.dimensions);
  return Number.isNaN(n) ? -Infinity : n;
}

function buildDisplayItems(products: BaleProductWithRelations[]): BaleDisplayItem[] {
  if (products.length === 0) return [];
  let maxVal = -Infinity;
  for (const pwr of products) {
    for (const s of pwr.sizes) {
      const v = sizeValue(s);
      if (v > maxVal) maxVal = v;
    }
  }
  const result: BaleDisplayItem[] = [];
  for (const pwr of products) {
    const big = pwr.sizes.find((s) => sizeValue(s) === maxVal);
    if (big) result.push({ pwr, displaySize: big });
    else result.push({ pwr, displaySize: pwr.sizes[0] ?? null });
  }
  const otherVals = Array.from(new Set(products.flatMap((pwr) => pwr.sizes.map((s) => sizeValue(s)))))
    .filter((v) => v !== maxVal)
    .sort((a, b) => b - a);
  for (const v of otherVals) {
    for (const pwr of products) {
      const big = pwr.sizes.find((s) => sizeValue(s) === maxVal);
      if (!big) continue;
      const match = pwr.sizes.find((s) => sizeValue(s) === v);
      if (match) result.push({ pwr, displaySize: match });
    }
  }
  return result;
}

export const BaleShopPage: FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<BaleCategory[]>([]);
  const [products, setProducts] = useState<BaleProductWithRelations[]>([]);
  const [sizes, setSizes] = useState<BaleSize[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectCategory = useCallback((categoryId: number | null, sizeId?: number | null) => {
    setSelectedCategory(categoryId);
    setSelectedSize(sizeId ?? null);
  }, []);

  const [selectedItems, setSelectedItems] = useState<Map<string, BaleSelectedItem>>(new Map());
  const [deliveryMethod, setDeliveryMethod] = useState<BaleDeliveryMethod>('in_person');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    baleGetCategories().then((res) => setCategories(res.categories)).catch(() => {});
    baleGetSizes().then((res) => setSizes(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    baleGetProducts(selectedCategory ?? undefined, searchQuery || undefined)
      .then(async (res) => {
        const enriched: BaleProductWithRelations[] = await Promise.all(
          res.items.map(async (product) => {
            const [colorsRes, sizesRes] = await Promise.all([
              baleGetProductColors(product.id).catch(() => ({ colors: [] })),
              baleGetProductSizes(product.id).catch(() => ({ sizes: [] })),
            ]);
            const category = categories.find((c) => c.id === product.category_id) || null;
            return { product, category, colors: colorsRes.colors || [], sizes: sizesRes.sizes || [] };
          })
        );
        setProducts(enriched);
        setLoading(false);
      })
      .catch(() => { setProducts([]); setLoading(false); });
  }, [selectedCategory, searchQuery, categories]);

  const toggleColor = useCallback((productId: number, colorId: number, sizeId: number) => {
    const key = `${productId}-${colorId}-${sizeId}`;
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, { productId, colorId, sizeId, quantity: 1 });
      return next;
    });
  }, []);

  const updateQuantity = useCallback((key: string, delta: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const item = next.get(key);
      if (item) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty === 0) next.delete(key);
        else next.set(key, { ...item, quantity: newQty });
      }
      return next;
    });
  }, []);

  const orderSummary = useMemo(() => {
    const productMap = new Map<number, {
      product: BaleProduct;
      category: BaleCategory | null;
      items: Array<{ color: BaleColor; size: BaleSize; quantity: number }>;
    }>();
    selectedItems.forEach((item) => {
      const productData = products.find((p) => p.product.id === item.productId);
      if (!productData) return;
      const color = productData.colors.find((c) => c.id === item.colorId);
      const size = productData.sizes.find((s) => s.id === item.sizeId);
      if (!color || !size) return;
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, { product: productData.product, category: productData.category, items: [] });
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
    if (submitting || selectedItems.size === 0) return;
    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      const items = Array.from(selectedItems.values()).map((item) => ({
        product_id: item.productId,
        color_id: item.colorId,
        size_id: item.sizeId,
        quantity: item.quantity,
      }));
      await baleCreateOrder({ delivery_method: deliveryMethod, items });
      setSubmitSuccess(true);
      setSelectedItems(new Map());
      setDeliveryMethod('in_person');
      setTimeout(() => navigate('/'), 1500);
    } catch {
      setSubmitting(false);
    }
  }, [submitting, selectedItems, deliveryMethod, navigate]);

  return (
    <div className="bale-shop">
      <BaleFilterBar
        categories={categories}
        sizes={sizes}
        selectedCategory={selectedCategory}
        selectedSize={selectedSize}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="bale-shop-guide">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span>ترتیب محصولات بر اساس سایز است: ابتدا بزرگ‌ترین سایز، سپس سایزهای کوچک‌تر قرار داده شده‌اند.</span>
      </div>

      <div className="bale-shop-list">
        {loading && (<><div className="bale-shop-skeleton" /><div className="bale-shop-skeleton" /><div className="bale-shop-skeleton" /></>)}
        {!loading && products.length === 0 && (
          <div className="bale-shop-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p>محصولی یافت نشد</p>
          </div>
        )}
        {!loading && (() => {
          if (selectedSize) {
            const filtered = products.filter((pwr) => pwr.sizes.some((s) => s.id === selectedSize));
            return filtered.map((pwr) => {
              const size = pwr.sizes.find((s) => s.id === selectedSize) ?? null;
              return (
                <BaleProductCard
                  key={`${pwr.product.id}-${size?.id}`}
                  productWithRelations={pwr}
                  selectedSize={size}
                  selectedItems={selectedItems}
                  onToggleColor={toggleColor}
                  onUpdateQuantity={updateQuantity}
                />
              );
            });
          }
          const displayItems = buildDisplayItems(products);
          return displayItems.map((item) => (
            <BaleProductCard
              key={`${item.pwr.product.id}-${item.displaySize?.id ?? 'none'}`}
              productWithRelations={item.pwr}
              selectedSize={item.displaySize}
              selectedItems={selectedItems}
              onToggleColor={toggleColor}
              onUpdateQuantity={updateQuantity}
            />
          ));
        })()}
      </div>

      {submitSuccess && (
        <div className="bale-shop-success-overlay">
          <div className="bale-shop-success-card">
            <div className="bale-shop-success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="bale-shop-success-title">سفارش با موفقیت ثبت شد!</h3>
            <p className="bale-shop-success-text">در حال انتقال به صفحه اصلی...</p>
          </div>
        </div>
      )}

      {orderSummary.length > 0 && !submitSuccess && (
        <div className="bale-shop-order-summary">
          <div className="bale-shop-order-header">
            <h3 className="bale-shop-order-title">خلاصه سفارش</h3>
            <span className="bale-shop-order-total">{totalQuantity} کالا</span>
          </div>
          {orderSummary.map((group) => (
            <div key={group.product.id} className="bale-shop-order-group">
              <div className="bale-shop-order-product-name">
                {[group.category?.name, group.product.name].filter(Boolean).join(' ')}
              </div>
              {group.items.map((item, index) => (
                <div key={index} className="bale-shop-order-item">
                  <div className="bale-shop-order-item-left">
                    <span className="bale-shop-order-item-dot" style={{ backgroundColor: item.color.hex }} />
                    <span>{item.color.name}</span>
                    <span className="bale-shop-order-item-size">سایز {item.size.dimensions}</span>
                  </div>
                  <span className="bale-shop-order-item-qty">×{item.quantity}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="bale-shop-delivery">
            <div className="bale-shop-delivery-title">نحوه تحویل سفارش</div>
            <div className="bale-shop-delivery-options">
              {(Object.keys(BALE_DELIVERY_LABELS) as BaleDeliveryMethod[]).map((method) => (
                <button
                  type="button"
                  key={method}
                  className={`bale-shop-delivery-option ${deliveryMethod === method ? 'active' : ''}`}
                  onClick={() => setDeliveryMethod(method)}
                >
                  {BALE_DELIVERY_LABELS[method]}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="bale-shop-submit-btn" onClick={handleSubmit} disabled={submitting || selectedItems.size === 0}>
            {submitting ? 'در حال ثبت...' : 'ثبت سفارش'}
          </button>
        </div>
      )}
    </div>
  );
};
