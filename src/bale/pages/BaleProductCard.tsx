import { useMemo, useCallback, type FC } from 'react';
import type { BaleSize, BaleColor } from '../bale-client';
import type { BaleProductWithRelations, BaleSelectedItem } from './BaleShopPage';
import './BaleProductCard.css';

interface BaleProductCardProps {
  productWithRelations: BaleProductWithRelations;
  selectedSize: BaleSize | null;
  selectedItems: Map<string, BaleSelectedItem>;
  onToggleColor: (productId: number, colorId: number, sizeId: number) => void;
  onUpdateQuantity: (key: string, delta: number) => void;
}

export const BaleProductCard: FC<BaleProductCardProps> = ({
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

  const handleQtyChangeWithAutoSelect = useCallback((key: string, colorId: number, delta: number) => {
    const item = selectedItems.get(key);
    const isSelected = item !== undefined && item.quantity > 0;
    if (!isSelected) handleColorSelect(colorId, selectedSize!.id);
    else handleQuantityChange(key, delta);
  }, [selectedItems, selectedSize, handleColorSelect, handleQuantityChange]);

  const firstImage = useMemo(() => {
    const img = product.images?.[0];
    if (!img) return null;
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && img !== null && 'url' in img) return String((img as { url: string }).url);
    return null;
  }, [product.images]);

  const displayName = [category?.name, product.name].filter(Boolean).join(' ');

  const colorCells = useMemo(() => {
    if (!selectedSize) return [];
    return colors.map((color: BaleColor) => {
      const key = `${product.id}-${color.id}-${selectedSize.id}`;
      const item = selectedItems.get(key);
      const isSelected = item !== undefined && item.quantity > 0;
      const qty = item?.quantity ?? 0;
      const nameLen = color.name.length;
      let nameFontSize = 11;
      if (nameLen > 8) nameFontSize = 9;
      else if (nameLen > 6) nameFontSize = 10;
      return { key, color, isSelected, qty, nameFontSize };
    });
  }, [colors, product.id, selectedSize, selectedItems]);

  const chunks = useMemo(() => {
    const result: typeof colorCells[] = [];
    for (let i = 0; i < colorCells.length; i += 5) result.push(colorCells.slice(i, i + 5));
    return result;
  }, [colorCells]);

  return (
    <div className="bale-product-card">
      <div className="bale-product-card-header">
        <h3 className="bale-product-card-name">{displayName}</h3>
        {selectedSize && <span className="bale-product-card-size-badge">سایز {selectedSize.dimensions}</span>}
      </div>
      <div className="bale-product-card-image-wrap">
        {firstImage ? (
          <img src={firstImage} alt={displayName} className="bale-product-card-image" loading="lazy" />
        ) : (
          <div className="bale-product-card-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {firstImage && colors.length > 0 && (
          <div className="bale-product-card-photo-tags">
            {colors.slice(0, 6).map((color) => (
              <button
                key={color.id}
                type="button"
                className="bale-product-card-photo-tag"
                onClick={() => selectedSize && handleColorSelect(color.id, selectedSize.id)}
              >
                {color.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="bale-product-card-color-section">
        {chunks.map((chunk, chunkIndex) => (
          <div key={chunkIndex} className="bale-product-card-color-table-wrap">
            <table className="bale-product-card-color-table" cellSpacing="0" cellPadding="0">
              <thead>
                <tr className="bale-product-card-color-row-colors">
                  {chunk.map((cell) => (
                    <th key={cell.color.id} className="bale-product-card-color-cell" scope="col">
                      <button
                        type="button"
                        className={`bale-product-card-color-btn ${cell.isSelected ? 'bale-product-card-color-btn--selected' : ''}`}
                        onClick={() => handleColorSelect(cell.color.id, selectedSize!.id)}
                        aria-label={cell.color.name}
                      >
                        <span className="bale-product-card-color-dot" style={{ backgroundColor: cell.color.hex }} />
                      </button>
                      <span className="bale-product-card-color-name" style={{ fontSize: cell.nameFontSize }}>{cell.color.name}</span>
                    </th>
                  ))}
                  {chunk.length < 5 && Array.from({ length: 5 - chunk.length }).map((_, i) => (
                    <th key={`empty-${i}`} className="bale-product-card-color-cell bale-product-card-color-cell--empty" />
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bale-product-card-qty-row">
                  {chunk.map((cell) => (
                    <td key={cell.color.id} className="bale-product-card-qty-cell">
                      <span className="bale-product-card-qty-value">{cell.qty}</span>
                    </td>
                  ))}
                  {chunk.length < 5 && Array.from({ length: 5 - chunk.length }).map((_, i) => (
                    <td key={`empty-qty-${i}`} className="bale-product-card-qty-cell bale-product-card-color-cell--empty" />
                  ))}
                </tr>
                <tr className="bale-product-card-action-row">
                  {chunk.map((cell) => (
                    <td key={cell.color.id} className="bale-product-card-action-cell">
                      <button
                        type="button"
                        className="bale-product-card-qty-btn bale-product-card-qty-btn--plus"
                        onClick={(e) => { e.stopPropagation(); handleQtyChangeWithAutoSelect(cell.key, cell.color.id, 1); }}
                        aria-label={`افزایش ${cell.color.name}`}
                      >
                        +
                      </button>
                    </td>
                  ))}
                  {chunk.length < 5 && Array.from({ length: 5 - chunk.length }).map((_, i) => (
                    <td key={`empty-plus-${i}`} className="bale-product-card-action-cell bale-product-card-color-cell--empty" />
                  ))}
                </tr>
                <tr className="bale-product-card-action-row">
                  {chunk.map((cell) => (
                    <td key={cell.color.id} className="bale-product-card-action-cell">
                      <button
                        type="button"
                        className="bale-product-card-qty-btn bale-product-card-qty-btn--minus"
                        onClick={(e) => { e.stopPropagation(); handleQtyChangeWithAutoSelect(cell.key, cell.color.id, -1); }}
                        disabled={cell.qty <= 0 && !cell.isSelected}
                        aria-label={`کاهش ${cell.color.name}`}
                      >
                        −
                      </button>
                    </td>
                  ))}
                  {chunk.length < 5 && Array.from({ length: 5 - chunk.length }).map((_, i) => (
                    <td key={`empty-minus-${i}`} className="bale-product-card-action-cell bale-product-card-color-cell--empty" />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};
