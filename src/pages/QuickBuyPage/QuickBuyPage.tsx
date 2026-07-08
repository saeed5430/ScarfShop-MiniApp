import { type FC, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import {
  getCategories,
  getProducts,
  getVariants,
  getDesigns,
  getColors,
  getSizes,
  type Category,
  type Product,
  type Variant,
  type Design,
  type Color,
  type Size,
} from '@/api/client.ts';
import { FilterBar } from './FilterBar.tsx';
import { ProductCard } from './ProductCard.tsx';

import './QuickBuyPage.css';

export interface ProductWithVariants {
  product: Product;
  category: Category | null;
  design: Design | null;
  variants: Variant[];
  colors: Color[];
  sizes: Size[];
}

export interface SelectedItem {
  variantId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
}

export const QuickBuyPage: FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [loading, setLoading] = useState(true);

  // Refs for parallel fetching
  const [allDesigns, setAllDesigns] = useState<Design[]>([]);
  const [allColors, setAllColors] = useState<Color[]>([]);
  const [allSizes, setAllSizes] = useState<Size[]>([]);

  useEffect(() => {
    Promise.all([
      getCategories().then((res) => setCategories(res.categories)),
      getDesigns().then((res) => setAllDesigns(res.items)),
      getColors().then((res) => setAllColors(res.items)),
      getSizes().then((res) => setAllSizes(res.items)),
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts(selectedCategory ?? undefined, searchQuery || undefined)
      .then(async (res) => {
        const enriched: ProductWithVariants[] = await Promise.all(
          res.items.map(async (product) => {
            const varRes = await getVariants(product.id);
            const variants = varRes.items;

            // Get unique design IDs from variants
            const designIds = [...new Set(variants.map((v) => v.design_id).filter(Boolean))];

            // Get colors and sizes for each variant
            const variantsWithRelations = await Promise.all(
              variants.map(async (v) => {
                const [colorsRes, sizesRes] = await Promise.all([
                  fetch(`/api/variants/${v.id}/colors`).then((r) => r.json()),
                  fetch(`/api/variants/${v.id}/sizes`).then((r) => r.json()),
                ]);
                return {
                  ...v,
                  colorIds: colorsRes.colors?.map((c: Color) => c.id) || [],
                  sizeIds: sizesRes.sizes?.map((s: Size) => s.id) || [],
                };
              })
            );

            const category = categories.find((c) => c.id === product.category_id) || null;
            const design = designIds.length > 0 ? allDesigns.find((d) => d.id === designIds[0]) || null : null;

            // Get unique colors and sizes for this product
            const colorIds = [...new Set(variantsWithRelations.flatMap((v) => v.colorIds))];
            const sizeIds = [...new Set(variantsWithRelations.flatMap((v) => v.sizeIds))];

            const colors = allColors.filter((c) => colorIds.includes(c.id));
            const sizes = allSizes.filter((s) => sizeIds.includes(s.id));

            return {
              product,
              category,
              design,
              variants: variantsWithRelations,
              colors,
              sizes,
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
  }, [selectedCategory, searchQuery, categories, allDesigns, allColors, allSizes]);

  const toggleColor = useCallback((variantId: number, colorId: number, sizeId: number) => {
    const key = `${variantId}-${colorId}`;
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { variantId, colorId, sizeId, quantity: 1 });
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

  const totalSelected = useMemo(() => {
    let count = 0;
    selectedItems.forEach((item) => { count += item.quantity; });
    return count;
  }, [selectedItems]);

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

          {!loading && products.map((pwv) => (
            <ProductCard
              key={pwv.product.id}
              productWithVariants={pwv}
              selectedItems={selectedItems}
              onToggleColor={toggleColor}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>

        <div className="quickbuy-footer">
          <button className="quickbuy-back-btn" onClick={() => navigate('/')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            بازگشت
          </button>
          <button
            className="quickbuy-continue-btn"
            disabled={totalSelected === 0}
          >
            ادامه خرید
            {totalSelected > 0 && (
              <span className="quickbuy-badge">{totalSelected}</span>
            )}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </Page>
  );
};
