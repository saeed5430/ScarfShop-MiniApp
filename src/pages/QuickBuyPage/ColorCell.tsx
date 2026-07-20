import { type FC, useCallback } from 'react';
import type { SelectedItem } from './QuickBuyPage.tsx';

import './ColorCell.css';

const COLOR_MAP: Record<string, string> = {
  'قرمز': '#EF4444',
  'سرمه‌ای': '#1E3A5F',
  'سبز': '#10B981',
  'زرد': '#F59E0B',
  'سفید': '#F9FAFB',
  'مشکی': '#111827',
  'صورتی': '#EC4899',
  'نارنجی': '#F97316',
  'بنفش': '#8B5CF6',
  'طوسی': '#6B7280',
  'کرمی': '#F5E6D3',
  'زرشکی': '#9B1B30',
  'یاسی': '#C084FC',
  'آبی': '#3B82F6',
  'لاجوردی': '#1D4ED8',
  'قالیی': '#B91C1C',
  'فیروزه‌ای': '#14B8A6',
  'نعناعی': '#34D399',
  'پسته‌ای': '#84CC16',
  'زیتونی': '#65A30D',
  'بژ': '#D4C5A9',
  'طوسی روشن': '#D1D5DB',
  'سرمه': '#1E3A5F',
};

interface ColorCellProps {
  colorName: string;
  isSelected: boolean;
  item: SelectedItem | undefined;
  onToggle: () => void;
  onUpdateQty: (delta: number) => void;
}

export const ColorCell: FC<ColorCellProps> = ({
  colorName,
  isSelected,
  item,
  onToggle,
  onUpdateQty,
}) => {
  const bgColor = COLOR_MAP[colorName] || '#9CA3AF';
  const isLight = ['سفید', 'کرمی', 'زرد', 'صورتی', 'نعناعی', 'طوسی روشن', 'بژ', 'یاسی'].includes(colorName);

  const handleMinus = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQty(-1);
  }, [onUpdateQty]);

  const handlePlus = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQty(1);
  }, [onUpdateQty]);

  const qty = item?.quantity ?? 0;

  return (
    <div
      className={`color-cell ${isSelected ? 'color-cell--selected' : ''}`}
      onClick={onToggle}
    >
      <div
        className={`color-dot ${isLight ? 'color-dot--light' : ''}`}
        style={{ backgroundColor: bgColor }}
      />
      <span className="color-name">{colorName}</span>
      {isSelected && (
        <div className="color-qty" onClick={(e) => e.stopPropagation()}>
          <button className="color-qty-btn" onClick={handleMinus}>−</button>
          <span className="color-qty-num">{qty}</span>
          <button className="color-qty-btn" onClick={handlePlus}>+</button>
        </div>
      )}
    </div>
  );
};
