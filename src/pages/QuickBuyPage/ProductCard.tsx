import { type FC, useMemo, useCallback } from 'react';
import type { ProductWithRelations, SelectedItem } from './QuickBuyPage.tsx';
import type { Color, Size } from '@/api/client.ts';

import './ProductCard.css';

interface ProductCardProps {
  productWithRelations: ProductWithRelations;
  selectedSize: Size | null;
  selectedItems: Map<string, SelectedItem>;
  onToggleColor: (productId: number, colorId: number, sizeId: number) => void;
  onUpdateQuantity: (key: string, delta: number) => void;
}

export const ProductCard: FC<ProductCardProps> = ({
  productWithRelations,
  selectedSize,
  selectedItems,
  onToggleColor,
  onUpdateQuantity,
}) => {
  const { product, category, colors } = productWithRelations;

  const handleColorSelect = useCallback((colorId: number, sizeId: number) => {
    onToggleColor(product.id, colorId, sizeId);
  }, [product.id, onToggleColor]);

  const handleQuantityChange = useCallback((key: string, delta: number) => {
    onUpdateQuantity(key, delta);
  }, [onUpdateQuantity]);

  const firstImage = useMemo(() => {
    const img = product.images?.[0];
    if (!img) return null;
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && 'url' in img) return (img as { url: string }).url;
    return null;
  }, [product.images]);

  const displayName = [category?.name, product.name].filter(Boolean).join(' ');

  const selectedItemsForCard = useMemo(() => {
    const items: Array<{ key: string; item: SelectedItem; color: Color | undefined; size: Size | undefined }> = [];
    if (!selectedSize) return items;

    selectedItems.forEach((item, key) => {
      if (key.startsWith(`${product.id}-`) && item.sizeId === selectedSize.id) {
        items.push({
          key,
          item,
          color: colors.find((c) => c.id === item.colorId),
          size: selectedSize,
        });
      }
    });
    return items;
  }, [selectedItems, product.id, colors, selectedSize]);

  return (
    <div className="product-card-v">
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
      </div>

      <div className="product-card-v-info">
        <div className="product-card-v-header">
          <h3 className="product-card-v-name">{displayName}</h3>
          <div className="product-card-v-meta">
            {product.material && (
              <span className="product-card-v-material">{product.material}</span>
            )}
            {selectedSize && (
              <span className="product-card-v-size-badge">{selectedSize.dimensions}</span>
            )}
          </div>
        </div>

        {product.short_description && (
          <p className="product-card-v-desc">{product.short_description}</p>
        )}

        <div className="product-card-v-color-grid">
          {colors.map((color) => {
            const key = selectedSize
              ? `${product.id}-${color.id}-${selectedSize.id}`
              : `${product.id}-${color.id}-0`;
            const item = selectedItems.get(key);
            const isSelected = item !== undefined && item.quantity > 0;

            return (
              <div key={color.id} className="product-card-v-color-item">
                <button
                  className={`product-card-v-color-btn ${isSelected ? 'product-card-v-color-btn--selected' : ''}`}
                  onClick={() => selectedSize && handleColorSelect(color.id, selectedSize.id)}
                >
                  <div
                    className="product-card-v-color-dot"
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
                <span className="product-card-v-color-name">{color.name}</span>
              </div>
            );
          })}
        </div>

        {selectedItemsForCard.length > 0 && (
          <div className="product-card-v-selected-summary">
            {selectedItemsForCard.map(({ key, item, color, size }) => {
              if (!color || !size) return null;
              return (
                <div key={key} className="product-card-v-selected-item">
                  <div className="product-card-v-selected-left">
                    <div
                      className="product-card-v-selected-dot"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="product-card-v-selected-text">
                      {color.name} — {size.dimensions}
                    </span>
                  </div>
                  <div className="product-card-v-selected-controls">
                    <button
                      className="product-card-v-qty-btn"
                      onClick={() => handleQuantityChange(key, -1)}
                    >
                      −
                    </button>
                    <span className="product-card-v-qty-value">{item.quantity}</span>
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
          </div>
        )}
      </div>
    </div>
  );
};
