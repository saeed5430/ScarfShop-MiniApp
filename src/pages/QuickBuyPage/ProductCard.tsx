import { type FC, useMemo, useCallback } from 'react';
import type { ProductWithRelations, SelectedItem } from './QuickBuyPage.tsx';
import type { Size } from '@/api/client.ts';

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

  const colorCells = useMemo(() => {
    if (!selectedSize) return [];
    return colors.map((color) => {
      const key = `${product.id}-${color.id}-${selectedSize.id}`;
      const item = selectedItems.get(key);
      const isSelected = item !== undefined && item.quantity > 0;
      const qty = item?.quantity ?? 0;

      return {
        key,
        color,
        isSelected,
        qty,
      };
    });
  }, [colors, product.id, selectedSize, selectedItems]);

  const rows = useMemo(() => {
    const result: typeof colorCells[] = [];
    for (let i = 0; i < colorCells.length; i += 7) {
      result.push(colorCells.slice(i, i + 7));
    }
    return result;
  }, [colorCells]);

  return (
    <div className="product-card">
      <div className="product-card-header">
        <h3 className="product-card-name">{displayName}</h3>
        {selectedSize && (
          <span className="product-card-size-badge">{selectedSize.dimensions}</span>
        )}
      </div>

      <div className="product-card-image-wrap">
        {firstImage ? (
          <img src={firstImage} alt={displayName} className="product-card-image" />
        ) : (
          <div className="product-card-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="product-card-color-section">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="product-card-color-row">
            {row.map((cell) => (
              <div key={cell.color.id} className="product-card-color-cell">
                <button
                  className={`product-card-color-btn ${cell.isSelected ? 'product-card-color-btn--selected' : ''}`}
                  onClick={() => handleColorSelect(cell.color.id, selectedSize!.id)}
                >
                  <div
                    className="product-card-color-dot"
                    style={{ backgroundColor: cell.color.hex }}
                  />
                </button>
                <span className="product-card-color-name">{cell.color.name}</span>
                {cell.isSelected && (
                  <div className="product-card-qty-controls">
                    <button
                      className="product-card-qty-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(cell.key, -1);
                      }}
                      disabled={cell.qty <= 1}
                    >
                      −
                    </button>
                    <span className="product-card-qty-value">{cell.qty}</span>
                    <button
                      className="product-card-qty-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(cell.key, 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};