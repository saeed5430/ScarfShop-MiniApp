import type { OnboardingStep } from './types';

export const onboardingSteps: OnboardingStep[] = [
  {
    targetSelector: null,
    title: 'به فروشگاه آرمانا خوش آمدید!',
    description: 'این راهنما شما را با مراحل ثبت سفارش در فروشگاه آشنا می‌کند. برای ادامه، دکمه «بعدی» را بزنید.',
    placement: 'center',
  },
  {
    targetSelector: '.action-card:first-child .action-content',
    title: 'مشخصات کاربری',
    description: 'ابتدا اطلاعات شخصی خود را تکمیل کنید. این اطلاعات برای ثبت سفارش ضروری است.',
    placement: 'bottom',
  },
  {
    targetSelector: '.action-card:nth-child(3) .action-content',
    title: 'سفارش سریع',
    description: 'این بخش تا زمانی که پروفایل خود را تکمیل نکرده‌اید غیرفعال است. پس از تکمیل اطلاعات، فعال می‌شود.',
    placement: 'bottom',
  },
  {
    targetSelector: '.product-card:first-child',
    title: 'محصولات و تنوع',
    description: 'در این صفحه محصولات به همراه رنگ‌ها و سایزهای مختلف نمایش داده می‌شوند. هر محصول ممکن است چندین رنگ و سایز داشته باشد.',
    placement: 'top',
    beforeStep: () => {
      window.location.hash = '#/quick-buy';
    },
  },
  {
    targetSelector: '.product-card-color-btn',
    title: 'انتخاب رنگ',
    description: 'روی دکمه هر رنگ کلیک کنید تا آن رنگ برای محصول انتخاب شود. با این کار محصول + رنگ مورد نظر به سبد اضافه می‌شود.',
    placement: 'top',
  },
  {
    targetSelector: '.product-card-qty-controls',
    title: 'تنظیم تعداد',
    description: 'پس از انتخاب رنگ، با دکمه‌های + و − می‌توانید تعداد را افزایش یا کاهش دهید.',
    placement: 'top',
  },
  {
    targetSelector: '.quickbuy-order-summary',
    title: 'خلاصه سفارش',
    description: 'در این بخش می‌توانید موارد انتخاب شده شامل محصول، رنگ، سایز و تعداد را مرور کنید.',
    placement: 'top',
  },
  {
    targetSelector: '.quickbuy-submit-btn',
    title: 'ثبت سفارش',
    description: 'پس از بررسی نهایی، این دکمه را بزنید تا سفارش شما ثبت شود.',
    placement: 'top',
  },
  {
    targetSelector: null,
    title: 'تبریک! 🎉',
    description: 'شما با مراحل ثبت سفارش آشنا شدید. در هر زمان می‌توانید با دکمه «? Help» این راهنما را دوباره باز کنید.',
    placement: 'center',
  },
];