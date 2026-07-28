import type { OnboardingStep } from '../types';

export const profileSteps: OnboardingStep[] = [
  {
    targetSelector: null,
    title: 'تکمیل اطلاعات',
    description: 'برای ثبت سفارش باید اطلاعات خود را تکمیل کنید.',
    placement: 'center',
  },
  {
    targetSelector: '.profile-form',
    title: 'فیلدهای ضروری',
    description: 'نام، نام‌خانوادگی و شماره تلفن الزامی هستند. پس از تکمیل، دکمه ذخیره را بزنید.',
    placement: 'top',
  },
  {
    targetSelector: '.profile-submit',
    title: 'ذخیره اطلاعات',
    description: 'پس از تکمیل اطلاعات روی این دکمه کلیک کنید.',
    placement: 'top',
  },
];