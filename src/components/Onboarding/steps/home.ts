import type { OnboardingStep } from '../types';

export const homeSteps: OnboardingStep[] = [
  {
    targetSelector: null,
    title: 'به فروشگاه آرمانا خوش آمدید!',
    description: 'از این صفحه می‌توانید به بخش‌های مختلف فروشگاه دسترسی داشته باشید.',
    placement: 'center',
  },
  {
    targetSelector: '.action-card:nth-child(3) .action-content',
    title: 'سفارش سریع',
    description: 'برای مشاهده محصولات و ثبت سفارش روی این کارت کلیک کنید.',
    placement: 'bottom',
  },
];