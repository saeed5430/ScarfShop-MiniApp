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
    targetSelector: '.product-card-v-selected-controls',
    title: 'تنظیم تعداد',
    description: 'با دکمه‌های + و − تعداد مورد نظر خود را تنظیم کنید.',
    placement: 'top',
    beforeStep: () => {
      const btn = document.querySelector('.product-card-v-color-btn') as HTMLElement;
      if (btn) btn.click();
    },
  },
  {
    targetSelector: '.quickbuy-order-summary',
    title: 'ثبت سفارش',
    description: 'پس از بررسی نهایی، دکمه ثبت سفارش را بزنید.',
    placement: 'top',
  },
];