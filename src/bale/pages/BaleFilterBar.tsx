import { useRef, useCallback, type FC } from 'react';
import type { BaleCategory, BaleSize } from '../bale-client';
import './BaleFilterBar.css';

interface BaleFilterBarProps {
  categories: BaleCategory[];
  sizes?: BaleSize[];
  selectedCategory: number | null;
  selectedSize?: number | null;
  onSelectCategory: (categoryId: number | null, sizeId?: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const BaleFilterBar: FC<BaleFilterBarProps> = ({
  categories,
  sizes = [],
  selectedCategory,
  selectedSize,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearchChange(value), 300);
    },
    [onSearchChange]
  );

  const clearSearch = useCallback(() => {
    onSearchChange('');
    if (inputRef.current) inputRef.current.value = '';
  }, [onSearchChange]);

  const scarfCategory = categories.find((c) => c.name.trim() === 'روسری');

  const extractNumericSizes = (dimensions: string): string[] =>
    dimensions.split('-').map((p) => p.trim()).filter((p) => /^\d+$/.test(p));

  const entries: { value: string; size: BaleSize }[] = [];
  sizes.forEach((size) => {
    extractNumericSizes(size.dimensions).forEach((v) => entries.push({ value: v, size }));
  });
  const uniqueScarfSizes = entries.filter(
    (entry, index, arr) => index === arr.findIndex((i) => i.value === entry.value)
  );
  const shouldCreateScarfSizeFilters = Boolean(scarfCategory) && uniqueScarfSizes.length > 0;
  const normalCategories = categories.filter(
    (c) => !(shouldCreateScarfSizeFilters && scarfCategory && c.id === scarfCategory.id)
  );
  const scarfSizeFilters = shouldCreateScarfSizeFilters
    ? [...uniqueScarfSizes].sort((a, b) => Number(b.value) - Number(a.value))
    : [];

  return (
    <div className="bale-filter-bar">
      <div className="bale-filter-tabs">
        <button
          type="button"
          className={`bale-filter-tab ${selectedCategory === null && selectedSize === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null, null)}
        >
          همه
        </button>
        {scarfSizeFilters.map((entry) => {
          const isSelected = selectedCategory === scarfCategory?.id && selectedSize === entry.size.id;
          return (
            <button
              type="button"
              key={`scarf-size-${entry.value}`}
              className={`bale-filter-tab ${isSelected ? 'active' : ''}`}
              onClick={() => { if (scarfCategory) onSelectCategory(scarfCategory.id, entry.size.id); }}
            >
              {scarfCategory?.name}{entry.value}
            </button>
          );
        })}
        {normalCategories.map((category) => (
          <button
            type="button"
            key={`category-${category.id}`}
            className={`bale-filter-tab ${selectedCategory === category.id && selectedSize === null ? 'active' : ''}`}
            onClick={() => onSelectCategory(category.id, null)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="bale-filter-search">
        <svg className="bale-filter-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="bale-filter-search-input"
          placeholder="جستجوی محصول..."
          defaultValue={searchQuery}
          onChange={handleChange}
        />
        {searchQuery && (
          <button type="button" className="bale-filter-search-clear" onClick={clearSearch}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
