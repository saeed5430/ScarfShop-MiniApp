import { type FC, useRef, useCallback } from 'react';
import type { Category, Size } from '@/api/client.ts';

import './FilterBar.css';

interface FilterBarProps {
  categories: Category[];
  sizes?: Size[];

  selectedCategory: number | null;
  selectedSize?: number | null;

  onSelectCategory: (
    categoryId: number | null,
    sizeId?: number | null
  ) => void;

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

  // جستجو با debounce
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

  // پاک کردن جستجو
  const clearSearch = useCallback(() => {
    onSearchChange('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onSearchChange]);

  // پیدا کردن دسته روسری
  const scarfCategory = categories.find(
    (category) => category.name.trim() === 'روسری'
  );

  // استخراج سایزهای عددی
  //
  // مثال:
  // "100"     → ["100"]
  // "100-130" → ["100", "130"]
  // "130"     → ["130"]
  const extractNumericSizes = (
    dimensions: string
  ): string[] => {
    return dimensions
      .split('-')
      .map((part) => part.trim())
      .filter((part) => /^\d+$/.test(part));
  };

  // ساخت لیست سایزهای روسری
  const sizeEntries: {
    value: string;
    size: Size;
  }[] = [];

  sizes.forEach((size) => {
    const numericSizes = extractNumericSizes(size.dimensions);

    numericSizes.forEach((sizeValue) => {
      sizeEntries.push({
        value: sizeValue,
        size,
      });
    });
  });

  // حذف سایزهای تکراری
  const uniqueScarfSizes = sizeEntries.filter(
    (entry, index, entries) =>
      index ===
      entries.findIndex(
        (item) => item.value === entry.value
      )
  );

  // آیا فیلترهای روسری + سایز ساخته شوند؟
  const shouldCreateScarfSizeFilters =
    Boolean(scarfCategory) &&
    uniqueScarfSizes.length > 0;

  // دسته‌بندی‌های عادی
  //
  // خود «روسری» حذف می‌شود چون به‌صورت
  // روسری100، روسری130 و ... نمایش داده می‌شود.
  const normalCategories = categories.filter(
    (category) =>
      !(
        shouldCreateScarfSizeFilters &&
        scarfCategory &&
        category.id === scarfCategory.id
      )
  );

  // مرتب‌سازی سایزها از بزرگ به کوچک
  //
  // مثال:
  // روسری150
  // روسری130
  // روسری100
  const scarfSizeFilters = shouldCreateScarfSizeFilters
    ? [...uniqueScarfSizes].sort(
        (a, b) => Number(b.value) - Number(a.value)
      )
    : [];

  return (
    <div className="filter-bar">
      <div className="filter-tabs">

        {/* ================================
            1. همه
            ================================ */}

        <button
          className={`filter-tab ${
            selectedCategory === null &&
            selectedSize === null
              ? 'active'
              : ''
          }`}
          onClick={() =>
            onSelectCategory(null, null)
          }
        >
          همه
        </button>

        {/* ================================
            2. فیلترهای روسری + سایز
           
            این‌ها عمداً قبل از سایر
            دسته‌بندی‌ها نمایش داده می‌شوند.

            مثال:
            روسری130
            روسری100
            ================================ */}

        {scarfSizeFilters.map((entry) => {
          const isSelected =
            selectedCategory === scarfCategory?.id &&
            selectedSize === entry.size.id;

          return (
            <button
              key={`scarf-size-${entry.value}`}
              className={`filter-tab ${
                isSelected ? 'active' : ''
              }`}
              onClick={() => {
                if (!scarfCategory) return;

                onSelectCategory(
                  scarfCategory.id,
                  entry.size.id
                );
              }}
            >
              {scarfCategory?.name}
              {entry.value}
            </button>
          );
        })}

        {/* ================================
            3. سایر دسته‌بندی‌ها

            مثال:
            شال
            مقنعه
            ...
            ================================ */}

        {normalCategories.map((category) => (
          <button
            key={`category-${category.id}`}
            className={`filter-tab ${
              selectedCategory === category.id &&
              selectedSize === null
                ? 'active'
                : ''
            }`}
            onClick={() =>
              onSelectCategory(category.id, null)
            }
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* ================================
          جستجوی محصول
          ================================ */}

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
          <circle
            cx="11"
            cy="11"
            r="8"
          />

          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
          />
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
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              />

              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};