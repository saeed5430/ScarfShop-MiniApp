import type { OnboardingStep } from '../types';

export const quickBuySteps: OnboardingStep[] = [
  {
    targetSelector: '.product-card:first-child',
    title: 'لیست محصولات',
    description: 'محصولات به همراه رنگ‌ها و سایزهای مختلف در این بخش نمایش داده می‌شوند.',
    placement: 'top',
  },
  {
    targetSelector: '.product-card-color-btn',
    title: 'انتخاب رنگ',
    description: 'روی دکمه هر رنگ کلیک کنید تا آن رنگ برای محصول انتخاب شود. توجه کنید که باید روی خود رنگ کلیک کنید، نه روی محصول.',
    placement: 'top',
  },
  {
    targetSelector: '.product-card-qty-controls, .product-card-qty-btn--plus',
    title: 'تنظیم تعداد',
    description: 'با دکمه + تعداد را افزایش دهید. با دکمه − تعداد را کاهش دهید. این کنترل‌ها پس از انتخاب رنگ ظاهر می‌شوند.',
    placement: 'top',
  },
  {
    targetSelector: '.quickbuy-order-summary',
    title: 'خلاصه سفارش',
    description: 'پس از انتخاب محصولات، خلاصه سفارش شامل رنگ، سایز و تعداد را بررسی کنید.',
    placement: 'top',
  },
  {
    targetSelector: '.quickbuy-submit-btn',
    title: 'ثبت سفارش',
    description: 'پس از بررسی نهایی، این دکمه را بزنید تا سفارش شما ثبت شود.',
    placement: 'top',
  },
];