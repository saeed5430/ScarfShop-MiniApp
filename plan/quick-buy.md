# Quick Buy — پلن طراحی فرانت‌اند

## 1. هدف
صفحه‌ای سریع و حرفه‌ای برای مشاهده و انتخاب محصولات شال/روسری/مقنعه با قابلیت انتخاب رنگ و سایز و تعداد.

---

## 2. معماری کامپوننت‌ها

```
QuickBuyPage
├── Header (ثابت - فروشگاه، نام کاربر، آواتار)
├── FilterBar (ثابت بالا)
│   ├── CategoryTabs (شال | روسری | مقنعه)
│   └── SearchInput (آیکون جستجو)
├── ProductList (اسکرول عمودی)
│   ├── SizeGroupCard (یک کادر به ازای هر سایز)
│   │   ├── ProductInfo (نام محصول + سایز)
│   │   ├── ColorGrid (شبکه رنگ‌ها با انتخاب تعداد)
│   │   └── ConfirmButton (تایید تعداد این سایز)
│   └── ... (تکرار برای هر سایز)
└── FooterBar (ثابت پایین)
    ├── BackButton (بازگشت)
    └── ContinueButton (ادامه خرید)
```

---

## 3. فیلتر حرفه‌ای

### 3.1 Category Tabs
- **نوع**: Horizontal pill tabs
- **موقعیت**: ثابت زیر هدر
- **آیتم‌ها**: `همه` | `شال` | `روسری` | `مقنعه`
- **ظاهر**:
  - فعال: پس‌زمینه Primary، متن سفید
  - غیرفعال: پس‌زمینه Surface، متن Text Secondary
  - Border: 1px
  - Border Radius: 100px (کاملاً گرد)
  - Height: 36px
  - Font: 13px, weight 500
- **رفتار**:
  - Tap: تغییر فوری لیست
  - Animate: smooth transition 200ms

### 3.2 Search Input
- **نوع**: Compact search bar
- **ظاهر**:
  - آیکون جستجو (سمت راست در RTL)
  - Placeholder: "جستجوی محصول..."
  - Height: 36px
  - Border Radius: 10px
  - Background: var(--color-bg)
  - Border: 1px solid var(--color-border)
- **رفتار**:
  - Debounce 300ms
  - Clear button (X) وقتی متن دارد

### 3.3 لایوت فیلتر
```
┌─────────────────────────────────┐
│ [همه] [شال] [روسری] [مقنعه]    │
│ ┌─────────────────────────────┐ │
│ │ 🔍 جستجوی محصول...         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```
- Padding: 12px 16px
- Gap بین tabs و search: 8px
- Background: var(--color-surface)
- Border-bottom: 1px solid var(--color-border)

---

## 4. Product Card (Size Group)

### 4.1 ساختار هر کادر
هر کادر = یک محصول مادر + یک سایز خاص

```
┌─────────────────────────────────┐
│ 🟣 روسری الیزه — سایز کوچک     │
│                                 │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │
│ │🔴│ │🔵│ │🟢│ │🟡│ │⚪│ │🟤│ │
│ │+2│ │ 0│ │+1│ │ 0│ │+3│ │ 0│ │
│ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ │
│                                 │
│ [✓ تایید انتخاب]                │
└─────────────────────────────────┘
```

### 4.2 Product Info Section
- **نام محصول + سایز**: `روسری الیزه — سایز کوچک`
- Font: 15px, weight 600
- Color: var(--color-text-primary)
- Padding-bottom: 12px

### 4.3 Color Grid
- **نوع**: CSS Grid
- **تعداد ستون**: 6 (برای 7 رنگ در یک ردیف + 1 ردیف دوم)
- **اندازه هر سلول**: ~52px
- **Gap**: 8px
- **هر سلول شامل**:
  - رنگ (دایره 32px یا مربع گرد 8px)
  - نام رنگ (زیر رنگ، 10px)
  - دکمه + و - (بالا و پایین)
  - تعداد انتخابی (وسط)

### 4.4 Color Cell Design
```
┌─────────┐
│  ┌───┐  │  ← رنگ (32px circle)
│  │ 🔴│  │
│  └───┘  │
│   قرمز   │  ← نام رنگ (10px)
│  ┌─┬─┐  │
│  │-│2│+  │  ← کنترل تعداد
│  └─┴─┘  │
└─────────┘
```

- **رنگ**: Dots به اندازه 32px
- **نام رنگ**: Font 10px, color Text Secondary
- **کنترل تعداد**:
  - دکمه‌ها: 24x24px
  - عدد وسط: 14px, weight 600
  - رنگ دکمه‌ها: Primary
  - Border-radius: 6px
  - Background: var(--color-bg)
- **حالت انتخاب شده**: Border 2px Primary
- **حالت ناموجود**: Opacity 0.4، غیرقابل انتخاب

### 4.5 Confirm Button (هر کادر)
- **متن**: "تایید انتخاب"
- **ظاهر**:
  - Height: 40px
  - Border-radius: 10px
  - Background: var(--color-success) یا Primary
  - Color: white
  - Font: 14px, weight 600
- **رفتار**:
  - Disabled وقتی هیچ رنگی انتخاب نشده
  - After confirm: تغییر رنگ به success + آیکون ✓

---

## 5. Footer Bar

### 5.1 ساختار
```
┌─────────────────────────────────┐
│ [بازگشت]          [ادامه خرید]  │
└─────────────────────────────────┘
```

### 5.2 Back Button
- **متن**: "بازگشت"
- **آیکون**: ← (فلش چپ در RTL)
- **ظاهر**:
  - Height: 52px
  - Border-radius: 14px
  - Background: transparent
  - Border: 1px solid var(--color-border)
  - Color: var(--color-text-primary)

### 5.3 Continue Button
- **متن**: "ادامه خرید"
- **آیکون**: → (فلش راست در RTL)
- **ظاهر**:
  - Height: 52px
  - Border-radius: 14px
  - Background: linear-gradient(135deg, #7C3AED, #6D28D9)
  - Color: white
  - Font: 16px, weight 600
- **رفتار**:
  - Badge نشان‌دهنده تعداد کل انتخاب‌ها
  - disabled وقتی هیچ چیزی انتخاب نشده

### 5.3 لایوت Footer
- Position: fixed bottom
- Padding: 12px 16px
- Background: var(--color-surface)
- Border-top: 1px solid var(--color-border)
- Gap: 12px
- Flex: 1 (بازگشت) + 2 (ادامه خرید)

---

## 6. صفحه اصلی (IndexPage)

### 6.1 Action Card خرید سریع
فعلی:
```tsx
<div className="action-card">
  ...خرید سریع...
</div>
```

تغییر: اضافه کردن `onClick` برای ناوبری به `/quick-buy`

```tsx
<div className="action-card" onClick={() => navigate('/quick-buy')}>
  ...خرید سریع...
</div>
```

---

## 7. داده و API

### 7.1 API Calls
```typescript
// لیست دسته‌بندی‌ها
GET /api/categories

// لیست محصولات (با فیلتر)
GET /api/products?category_id=1

// لیست متغیرهای یک محصول
GET /api/variants?product_id=1
```

### 7.2 TypeScript Types
```typescript
interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  category_id: number;
  description: string;
  short_description: string;
  material: string;
}

interface Variant {
  id: number;
  product_id: number;
  slug: string;
  color: string;
  size: string;
  is_stock: boolean;
  images: string[];
}

// برای نمایش در UI
interface ProductWithVariants {
  product: Product;
  variants: Variant[];
  sizes: string[];
  colors: string[];
}

// برای انتخاب کاربر
interface SelectedItem {
  variantId: number;
  color: string;
  size: string;
  quantity: number;
}
```

### 7.3 Data Transformation
```typescript
// تبدیل API به ساختار UI
function groupBySize(variants: Variant[]): Map<string, Variant[]> {
  const map = new Map<string, Variant[]>();
  for (const v of variants) {
    const key = v.size || 'standard';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return map;
}

function getUniqueColors(variants: Variant[]): string[] {
  return [...new Set(variants.map(v => v.color).filter(Boolean))];
}
```

---

## 8. State Management

### 8.1 State اصلی
```typescript
const [categories, setCategories] = useState<Category[]>([]);
const [products, setProducts] = useState<ProductWithVariants[]>([]);
const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [selectedItems, setSelectedItems] = useState<Map<number, SelectedItem>>(new Map());
const [loading, setLoading] = useState(true);
```

### 8.2 Selection Logic
```typescript
// انتخاب/لغو انتخاب رنگ
const toggleColor = (variantId: number, color: string, size: string) => {
  setSelectedItems(prev => {
    const next = new Map(prev);
    if (next.has(variantId)) {
      next.delete(variantId);
    } else {
      next.set(variantId, { variantId, color, size, quantity: 1 });
    }
    return next;
  });
};

// تغییر تعداد
const updateQuantity = (variantId: number, delta: number) => {
  setSelectedItems(prev => {
    const next = new Map(prev);
    const item = next.get(variantId);
    if (item) {
      const newQty = Math.max(0, item.quantity + delta);
      if (newQty === 0) {
        next.delete(variantId);
      } else {
        next.set(variantId, { ...item, quantity: newQty });
      }
    }
    return next;
  });
};
```

---

## 9. انیمیشن‌ها

| عنصر | انیمیشن | مدت |
|------|---------|-----|
| Product Card | Fade-in + Slide-up | 200ms |
| Color Cell Tap | Scale(0.95) | 100ms |
| Quantity Change | Number counter animation | 150ms |
| Category Tab | Background color transition | 200ms |
| Button Press | Scale(0.95) | 100ms |
| Confirm Success | Color flash + ✓ icon | 300ms |

---

## 10. RTL Support
- تمام padding/margin با logical properties
- فلش‌ها و آیکون‌ها معکوس شوند
- Grid: direction خودکار
- Text alignment: RTL

---

## 11. Dark Mode
- تمام رنگ‌ها از CSS variables
- کارت‌ها: Surface color
- Border: Border color
- Shadow: Adjusted for dark

---

## 12. Responsive
- **Min width**: 320px
- **Max width**: 430px
- **Grid columns**: 6 (برای رنگ‌ها)
- **سایز سلول**: flex-wrap با محاسبه خودکار

---

## 13. فایل‌های مورد نیاز

### جدید
```
src/pages/QuickBuyPage/
├── QuickBuyPage.tsx
├── QuickBuyPage.css
├── FilterBar.tsx
├── FilterBar.css
├── ProductCard.tsx
├── ProductCard.css
├── ColorCell.tsx
├── ColorCell.css
├── QuantityControl.tsx
└── QuantityControl.css
```

### تغییر
```
src/navigation/routes.tsx     — اضافه کردن مسیر /quick-buy
src/pages/IndexPage/IndexPage.tsx — اضافه کردن onClick به Action Card
src/api/client.ts             — اضافه کردن API functions
```

---

## 14. API Functions جدید

```typescript
// src/api/client.ts

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  description: string;
  short_description: string;
  is_active: boolean;
  material: string;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: number;
  product_id: number;
  slug: string;
  color: string;
  size: string;
  is_stock: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export async function getCategories(): Promise<{ categories: Category[] }> {
  return apiRequest('/api/categories');
}

export async function getProducts(categoryId?: number, search?: string): Promise<{ items: Product[]; total: number }> {
  const params = new URLSearchParams();
  if (categoryId) params.set('category_id', String(categoryId));
  if (search) params.set('search', search);
  return apiRequest(`/api/products?${params}`);
}

export async function getVariants(productId?: number, inStock?: boolean): Promise<{ items: Variant[]; total: number }> {
  const params = new URLSearchParams();
  if (productId) params.set('product_id', String(productId));
  if (inStock) params.set('in_stock', 'true');
  return apiRequest(`/api/variants?${params}`);
}
```

---

## 15. ترتیب اجرا
1. API functions در `client.ts`
2. QuickBuyPage (ساختار اصلی)
3. FilterBar
4. ProductCard
5. ColorCell + QuantityControl
6. روت و ناوبری

---

## 16. چک‌لیست نهایی
- [ ] هدر ثابت با اطلاعات کاربر
- [ ] فیلتر دسته‌بندی (pill tabs)
- [ ] فیلتر جستجو (debounce)
- [ ] لیست محصولات گروه‌بندی شده بر اساس سایز
- [ ] Grid رنگ‌ها (6 ستون)
- [ ] کنترل تعداد (+/-) برای هر رنگ
- [ ] دکمه تایید هر کادر
- [ ] Footer با دکمه بازگشت و ادامه خرید
- [ ] RTL کامل
- [ ] Dark mode
- [ ] Loading skeleton
- [ ] Empty state
- [ ] انیمیشن‌های نرم
