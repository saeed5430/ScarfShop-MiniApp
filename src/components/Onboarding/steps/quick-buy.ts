import type { OnboardingStep } from '../types';

export const quickBuySteps: OnboardingStep[] = [
  {
    targetSelector: null,
    title: 'سفارش سریع',
    description: 'در این صفحه می‌توانید محصولات را مشاهده کرده و سفارش خود را ثبت کنید.',
    placement: 'center',
  },
  {
    targetSelector: '.filter-bar',
    title: 'جستجو و دسته‌بندی',
    description: 'با استفاده از نوار جستجو و فیلتر دسته‌بندی، محصول مورد نظر خود را پیدا کنید.',
    placement: 'bottom',
  },
  {
    targetSelector: '.quickbuy-list',
    title: 'محصولات',
    description: 'محصولات به همراه رنگ‌های موجود نمایش داده می‌شوند.',
    placement: 'top',
  },
  {
    targetSelector: '.product-card-v-color-grid',
    title: 'انتخاب رنگ',
    description: 'روی رنگ مورد نظر کلیک کنید تا به سبد خرید اضافه شود.',
    placement: 'top',
  },
  {
    targetSelector: null,
    title: 'تنظیم تعداد',
    description: 'پس از انتخاب رنگ، دکمه‌های + و − برای تنظیم تعداد ظاهر می‌شوند.',
    placement: 'center',
  },
  {
    targetSelector: null,
    title: 'ثبت سفارش',
    description: 'پس از انتخاب محصولات، خلاصه سفارش را در پایین صفحه بررسی کرده و دکمه ثبت را بزنید.',
    placement: 'center',
  },
];