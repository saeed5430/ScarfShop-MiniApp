import { type FC, useRef, useCallback } from 'react';
import type { Category, Size } from '@/api/client.ts';

import './FilterBar.css';

interface FilterBarProps {
  categories: Category[];
  sizes?: Size[];
  selectedCategory: number | null;
  selectedSize?: number | null;
  onSelectCategory: (categoryId: number | null, sizeId?: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const FilterBar: FC<FilterBarProps> = ({
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

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  const clearSearch = useCallback(() => {
    onSearchChange('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onSearchChange]);

  // پیدا کردن دسته «روسری»
  const scarfCategory = categories.find(
    (cat) => cat.name.trim() === 'روسری'
  );

  // فقط سایزهایی که مقدارشان کاملاً عددی است
  const numericSizes = sizes.filter((size) => {
    const value = size.dimensions.trim();

    return /^\d+$/.test(value);
  });

  // اگر روسری وجود داشته باشد و حداقل یک سایز عددی داشته باشیم،
  // دکمه روسری معمولی حذف می‌شود و دکمه‌های ترکیبی ساخته می‌شوند.
  const shouldCreateScarfFilters =
    !!scarfCategory && numericSizes.length > 0;

  const normalCategories = categories.filter(
    (cat) =>
      !(
        shouldCreateScarfFilters &&
        scarfCategory &&
        cat.id === scarfCategory.id
      )
  );

  // برای مثال:
  // 100
  // 130
  //
  // تبدیل می‌شود به:
  // روسری130
  // روسری100
  //
  // بنابراین سایزها را برعکس نمایش می‌دهیم.
  const scarfSizeFilters = shouldCreateScarfFilters
    ? [...numericSizes].reverse()
    : [];

  return (
    <div className="filter-bar">
      <div className="filter-tabs">
        {/* همه */}
        <button
          className={`filter-tab ${
            selectedCategory === null && selectedSize === null ? 'active' : ''
          }`}
          onClick={() => onSelectCategory(null, null)}
        >
          همه
        </button>

        {/* دسته‌بندی‌های عادی */}
        {normalCategories.map((cat) => (
          <button
            key={`category-${cat.id}`}
            className={`filter-tab ${
              selectedCategory === cat.id && selectedSize === null
                ? 'active'
                : ''
            }`}
            onClick={() => onSelectCategory(cat.id, null)}
          >
            {cat.name}
          </button>
        ))}

        {/* فیلترهای ترکیبی روسری + سایز */}
        {scarfSizeFilters.map((size) => (
          <button
            key={`scarf-size-${size.id}`}
            className={`filter-tab ${
              selectedCategory === scarfCategory?.id &&
              selectedSize === size.id
                ? 'active'
                : ''
            }`}
            onClick={() =>
              scarfCategory &&
              onSelectCategory(scarfCategory.id, size.id)
            }
          >
            {scarfCategory?.name}
            {size.dimensions}
          </button>
        ))}
      </div>

      <div className="filter-search">
        <svg
          className="filter-search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className="filter-search-input"
          placeholder="جستجوی محصول..."
          defaultValue={searchQuery}
          onChange={handleChange}
        />

        {searchQuery && (
          <button
            className="filter-search-clear"
            onClick={clearSearch}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
