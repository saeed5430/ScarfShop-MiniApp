import { type FC, useMemo, useCallback } from 'react';
import type { ProductWithVariants, SelectedItem } from './QuickBuyPage.tsx';
import type { Color, Size, Variant } from '@/api/client.ts';

import './ProductCard.css';

interface ExtendedVariant extends Variant {
  colorIds: number[];
  sizeIds: number[];
}

interface ProductCardProps {
  productWithVariants: ProductWithVariants;
  selectedItems: Map<string, SelectedItem>;
  onToggleColor: (variantId: number, colorId: number, sizeId: number) => void;
  onUpdateQuantity: (key: string, delta: number) => void;
}

export const ProductCard: FC<ProductCardProps> = ({
  productWithVariants,
  selectedItems,
  onToggleColor,
  onUpdateQuantity,
}) => {
  const { product, category, design, variants, colors, sizes } = productWithVariants;

  const groupedBySize = useMemo(() => {
    const map = new Map<string, { size: Size; variants: ExtendedVariant[] }>();
    for (const v of variants as ExtendedVariant[]) {
      const sizeId = v.sizeIds[0];
      const size = sizes.find((s) => s.id === sizeId);
      const key = size?.dimensions || 'standard';
      if (!map.has(key)) {
        map.set(key, { size: size || { id: 0, dimensions: key, created_at: '', updated_at: '' }, variants: [] });
      }
      map.get(key)!.variants.push(v);
    }
    return map;
  }, [variants, sizes]);

  const getShortName = useCallback((name: string) => {
    if (name.length <= 4) return name;
    return name.slice(0, 4);
  }, []);

  const handleColorSelect = useCallback((variantId: number, colorId: number) => {
    const key = `${variantId}-${colorId}`;
    const existing = selectedItems.get(key);
    if (!existing) {
      const sizeId = (variants.find((v) => v.id === variantId) as ExtendedVariant)?.sizeIds[0] || 0;
      onToggleColor(variantId, colorId, sizeId);
    }
  }, [variants, selectedItems, onToggleColor]);

  const handleQuantityChange = useCallback((key: string, delta: number) => {
    onUpdateQuantity(key, delta);
  }, [onUpdateQuantity]);

  const firstImage = product.images?.[0] || null;
  const displayName = [category?.name, product.name, design?.name].filter(Boolean).join(' ');

  return (
    <>
      {Array.from(groupedBySize.entries()).map(([sizeKey, { size, variants: sizeVariants }]) => {
        return (
          <div key={sizeKey} className="product-card-v">
            <div className="product-card-v-image-wrap">
              {firstImage ? (
                <img src={firstImage} alt={displayName} className="product-card-v-image" />
              ) : (
                <div className="product-card-v-image-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
              <div className="product-card-v-image-overlay">
                <span className="product-card-v-image-name">{displayName}</span>
              </div>
            </div>

            <div className="product-card-v-info">
              <div className="product-card-v-header">
                <h3 className="product-card-v-name">{displayName}</h3>
                <div className="product-card-v-meta">
                  <span className={`product-card-v-size size-${size.dimensions}`}>
                    <span className="size-dot" />
                    سایز {size.dimensions}
                  </span>
                  {product.material && (
                    <span className="product-card-v-material">{product.material}</span>
                  )}
                </div>
                {product.short_description && (
                  <p className="product-card-v-desc">{product.short_description}</p>
                )}
              </div>

              <div className="product-card-v-colors">
                {sizeVariants.filter((v) => v.is_stock).map((variant) => {
                  const variantColors = (variant as ExtendedVariant).colorIds
                    .map((id) => colors.find((c) => c.id === id))
                    .filter(Boolean) as Color[];

                  return variantColors.map((color) => {
                    const key = `${variant.id}-${color.id}`;
                    const item = selectedItems.get(key);
                    const qty = item?.quantity ?? 0;
                    const isSelected = qty > 0;

                    return (
                      <div
                        key={key}
                        className={`color-dot-wrap ${isSelected ? 'color-dot-wrap--active' : ''}`}
                        onClick={() => handleColorSelect(variant.id, color.id)}
                      >
                        <div
                          className="color-dot-circle"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="color-dot-label">{getShortName(color.name)}</span>
                        {qty > 0 && <span className="color-dot-qty">{qty}</span>}
                      </div>
                    );
                  });
                })}
              </div>

              {Array.from(selectedItems.entries())
                .filter(([key]) => {
                  const variantId = parseInt(key.split('-')[0]);
                  return sizeVariants.some((v) => v.id === variantId);
                })
                .filter(([, item]) => item.quantity > 0)
                .map(([key, item]) => {
                  const variant = sizeVariants.find((v) => v.id === item.variantId);
                  if (!variant) return null;
                  const color = colors.find((c) => c.id === item.colorId);
                  if (!color) return null;

                  return (
                    <div key={key} className="product-card-v-qty-row">
                      <div className="product-card-v-qty-label">
                        <div
                          className="product-card-v-qty-dot"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                      </div>
                      <div className="product-card-v-qty-control">
                        <button
                          className="product-card-v-qty-btn"
                          onClick={() => handleQuantityChange(key, -1)}
                        >
                          −
                        </button>
                        <span className="product-card-v-qty-num">{item.quantity}</span>
                        <button
                          className="product-card-v-qty-btn"
                          onClick={() => handleQuantityChange(key, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}

              <button
                className="product-card-v-cart-btn"
                disabled={Array.from(selectedItems.values()).every((item) => item.quantity === 0)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                افزودن به سبد خرید
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};
