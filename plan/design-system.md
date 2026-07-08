# Scarf Mini App — Design System

## 1. Design Style
- Minimal, Modern, Clean, Premium
- Mobile First
- Rounded Design
- Soft Shadows

### Minimal Design Principles
- White space is a feature, not wasted space
- Every element must justify its presence
- Reduce before adding
- One clear action per screen
- Content over chrome
- Typography hierarchy over decoration
- Subtle color usage — one accent per view
- No visual noise (gradients, patterns, shadows) unless functional

Inspiration:
- Telegram Mini Apps
- Apple iOS
- Material 3

## 2. Colors

| Token | Light | Dark |
|-------|-------|------|
| **Primary** | `#7C3AED` or `#6D28D9` | — |
| **Secondary** | `#A78BFA` | — |
| **Background** | `#FAFAFA` or `#FFFFFF` | — |
| **Surface (Cards)** | `#FFFFFF` | — |
| **Text Primary** | `#111827` | — |
| **Text Secondary** | `#6B7280` | — |
| **Success** | `#10B981` | — |
| **Error** | `#EF4444` | — |
| **Warning** | `#F59E0B` | — |
| **Border** | `#E5E7EB` | — |

> Dark mode values to be defined using CSS variables; all components must support both themes from the start.

## 3. Font (Persian)
- `Vazirmatn` or `Estedad`
- Weights: 400, 500, 600, 700

## 4. Font Sizes
| Style | Size |
|-------|------|
| Title (large) | 28px |
| Heading | 22px |
| Sub Heading | 18px |
| Body | 16px |
| Caption | 14px |
| Hint | 12px |

## 5. Border Radius
| Component | Radius |
|-----------|--------|
| Buttons | 14px |
| Cards | 20px |
| Input | 14px |
| Bottom Sheet | 28px |

## 6. Spacing (8px system)
4, 8, 16, 24, 32, 40, 48, 64

Defaults:
- Card padding: 16px
- Card gap: 16px
- Page margin: 20px

## 7. Component Heights
| Component | Height |
|-----------|--------|
| Button | 52px |
| Input | 52px |
| Search | 52px |
| Bottom Navigation | 72px |
| Navbar | 64px |

## 8. Shadows
- Very subtle: `0 4px 12px rgba(0,0,0,.08)` or `0 2px 8px rgba(0,0,0,.05)`

## 9. Icons
- Style: Outlined or Rounded
- Size: 24px

## 10. Buttons
| Variant | Style |
|---------|-------|
| Primary | Filled (Primary color) |
| Secondary | Outline |
| Ghost | No background |
| Danger | Red |

All buttons: Height 52px, Radius 14px.

## 11. Input
- Height: 52px
- Radius: 14px
- Gray placeholder
- Very thin border

## 12. Cards
- Radius: 20px
- Padding: 16px
- Subtle shadow
- Very thin border

## 13. Images
- Aspect ratio: 4:5 or 3:4
- Border radius: 16px

## 14. Animation
- Duration: 150ms–250ms
- Types: Fade, Scale, Slide
- No heavy animations

## 15. Bottom Navigation
- Max 5 items
- Height: 72px
- Icon: 24px
- Label: 12px

## 16. Grid
- 2 columns in most pages

## 17. Loading
- Skeleton loading instead of spinners

## 18. Dark Mode
- Design with CSS variables from the start
- All colors must switch seamlessly between light and dark

## 19. RTL Support
- Default direction: RTL (Right-to-Left) for Persian/Farsi language
- Set `dir="rtl"` on `<html>` element
- Use `direction: rtl` in CSS for all containers
- Use logical properties instead of physical ones:
  - Use `margin-inline-start` instead of `margin-left`
  - Use `margin-inline-end` instead of `margin-right`
  - Use `padding-inline-start` instead of `padding-left`
  - Use `padding-inline-end` instead of `padding-right`
  - Use `inset-inline-start` instead of `left`
  - Use `inset-inline-end` instead of `right`
- Font: Vazirmatn (weights: 400, 500, 600, 700)
- All text should be right-aligned by default
- Icons with directional meaning (arrows, chevrons) should be mirrored in RTL
- Use CSS `flip` for icons if needed

## 20. Responsive
- Min width: 320px
- Max width: 430px
- All pages optimized for 320–430px displays

## 22. Minimal Design Checklist
Before deploying, ensure:
- [ ] No unnecessary elements on screen
- [ ] Clear visual hierarchy (max 3 levels per page)
- [ ] One primary action visible at a time
- [ ] Consistent spacing (8px grid)
- [ ] No orphaned labels or icons
- [ ] Text contrast meets accessibility (4.5:1 min)
- [ ] Loading states for async content
- [ ] Empty states with helpful messages
- [ ] No broken links or dead ends

## 21. Required Components
- App Bar
- Bottom Navigation
- Search Bar
- Product Card
- Category Chip
- Button (Primary / Secondary / Ghost / Danger)
- Text Field
- Text Area
- Dropdown
- Badge
- Tag
- Status Chip
- Avatar
- Floating Action Button
- Modal
- Bottom Sheet
- Dialog
- Toast
- Snackbar
- Loading Skeleton
- Empty State
- Error State
- Divider
- Carousel
- Banner
- Notification Card
- Stepper (for order registration)
- Quantity Selector (+ / -)
- Product Image Gallery
- Cart Item
- Coupon Card
- Referral Card
- Chat Bubble
- Typing Indicator
- Pagination
- Pull to Refresh
- Shimmer Loading
- Action Card

## 23. Action Card Component
Main action entry points on homepage. Horizontal card with icon + text.

### Structure
```
┌─────────────────────────────────┐
│ ┌──────┐  Title                  │
│ │ Icon │  Description            │
│ └──────┘                         │
└─────────────────────────────────┘
```

### Specs
| Property | Value |
|----------|-------|
| Layout | Flex row, gap: 16px |
| Padding | 16px |
| Border Radius | 20px |
| Background | Surface color |
| Border | 1px solid Border |
| Shadow | Subtle (0 4px 12px rgba(0,0,0,0.08)) |

### Icon Block
| Property | Value |
|----------|-------|
| Size | 52x52px |
| Border Radius | 14px |
| Style | Gradient background |
| Example colors | Green: `#10B981 → #34D399` |
| | Purple: `#7C3AED → #A78BFA` |
| | Orange: `#F59E0B → #FBBF24` |

### Text
| Element | Font Size | Weight | Color |
|---------|-----------|--------|-------|
| Title | 16px | 600 | Text Primary |
| Description | 14px | 400 | Text Secondary |

### Usage Examples
- **Chat**: "چت با ما" + "سفارش و مشاوره رایگان" (green icon)
- **Quick Buy**: "خرید سریع" + "مشاهده محصولات جدید" (purple icon)
- **Categories**: "دسته‌بندی‌ها" + "مشاهده همه محصولات" (orange icon)
- **New Arrivals**: "محصولات جدید" + "جدیدترین انتخاب‌ها" (blue icon)

### Notes
- Max 2-3 action cards per page
- Full width, stacked vertically
- Cursor pointer for clickable cards
- Hover/active state: slight scale or opacity change

## 24. Database Schema — Products

### ساختار
```
categories → products
                ↓
             designs (مستقل)
                ↓
             variants → variant_colors → colors
             variants → variant_sizes  → sizes
```

### Table: `categories`
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | نام دسته‌بندی |
| `created_at` | TEXT | تاریخ ایجاد (شمسی) |
| `updated_at` | TEXT | تاریخ بروزرسانی (شمسی) |

### Table: `products`
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | نام محصول |
| `category_id` | INTEGER FK | ارجاع به categories |
| `description` | TEXT | توضیحات کامل |
| `short_description` | TEXT | توضیحات کوتاه |
| `is_active` | INTEGER | 1=فعال، 0=غیرفعال |
| `material` | TEXT | جنس پارچه |
| `created_at` | TEXT | تاریخ ایجاد (شمسی) |
| `updated_at` | TEXT | تاریخ بروزرسانی (شمسی) |

### Table: `designs` (standalone - no FK)
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | نام طرح |
| `created_at` | TEXT | تاریخ ایجاد (شمسی) |
| `updated_at` | TEXT | تاریخ بروزرسانی (شمسی) |

### Table: `colors` (standalone)
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | نام فارسی رنگ |
| `name_en` | TEXT | نام انگلیسی رنگ |
| `hex` | TEXT | کد HEX رنگ |
| `created_at` | TEXT | تاریخ ایجاد (شمسی) |
| `updated_at` | TEXT | تاریخ بروزرسانی (شمسی) |

### Table: `sizes` (standalone)
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `dimensions` | TEXT | ابعاد (مثلاً 100-130) |
| `created_at` | TEXT | تاریخ ایجاد (شمسی) |
| `updated_at` | TEXT | تاریخ بروزرسانی (شمسی) |

### Table: `variants`
| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `product_id` | INTEGER FK | ارجاع به products |
| `design_id` | INTEGER FK | ارجاع به designs |
| `slug` | TEXT UNIQUE | ترکیب: دسته-محصول-رنگ-سایز |
| `color` | TEXT | رنگ (legacy) |
| `size` | TEXT | سایز (legacy) |
| `is_stock` | INTEGER | 1=موجود، 0=ناموجود |
| `images` | TEXT (JSON) | آرایه URL تصاویر |
| `created_at` | TEXT | تاریخ ایجاد (شمسی) |
| `updated_at` | TEXT | تاریخ بروزرسانی (شمسی) |

### Table: `variant_colors` (junction)
| Field | Type | Description |
|-------|------|-------------|
| `variant_id` | INTEGER FK | ارجاع به variants |
| `color_id` | INTEGER FK | ارجاع به colors |

### Table: `variant_sizes` (junction)
| Field | Type | Description |
|-------|------|-------------|
| `variant_id` | INTEGER FK | ارجاع به variants |
| `size_id` | INTEGER FK | ارجاع به sizes |

### Slug Generation
قالب slug: `{category_name}-{product_name}-{color}-{size}`
مثال: `scarf-mahina-red-m`

### API Endpoints — Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | لیست دسته‌بندی‌ها |
| POST | `/api/categories` | ایجاد دسته‌بندی |
| PUT | `/api/categories/:id` | بروزرسانی |
| DELETE | `/api/categories/:id` | حذف |

### API Endpoints — Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | لیست محصولات (filter: category_id, search) |
| GET | `/api/products/:id` | جزئیات محصول |
| POST | `/api/products` | ایجاد محصول |
| PUT | `/api/products/:id` | بروزرسانی |
| DELETE | `/api/products/:id` | حذف |

### API Endpoints — Designs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/designs` | لیست طرح‌ها |
| GET | `/api/designs/:id` | جزئیات طرح |
| POST | `/api/designs` | ایجاد طرح |
| PUT | `/api/designs/:id` | بروزرسانی |
| DELETE | `/api/designs/:id` | حذف |

### API Endpoints — Colors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/colors` | لیست رنگ‌ها |
| GET | `/api/colors/:id` | جزئیات رنگ |
| POST | `/api/colors` | ایجاد رنگ |
| PUT | `/api/colors/:id` | بروزرسانی |
| DELETE | `/api/colors/:id` | حذف |

### API Endpoints — Sizes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sizes` | لیست سایزها |
| GET | `/api/sizes/:id` | جزئیات سایز |
| POST | `/api/sizes` | ایجاد سایز |
| PUT | `/api/sizes/:id` | بروزرسانی |
| DELETE | `/api/sizes/:id` | حذف |

### API Endpoints — Variants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/variants` | لیست متغیرها (filter: product_id, in_stock) |
| GET | `/api/variants/:slug` | جزئیات با slug |
| POST | `/api/variants` | ایجاد متغیر (slug خودکار) |
| PUT | `/api/variants/:id` | بروزرسانی (slug بازتولید) |
| DELETE | `/api/variants/:id` | حذف |

### API Endpoints — Variant Relations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/variants/:id/colors` | رنگ‌های یک متغیر |
| PUT | `/api/variants/:id/colors` | تنظیم رنگ‌ها (array of color_ids) |
| GET | `/api/variants/:id/sizes` | سایزهای یک متغیر |
| PUT | `/api/variants/:id/sizes` | تنظیم سایزها (array of size_ids) |
