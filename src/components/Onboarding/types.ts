export type PageName = 'home' | 'profile' | 'quickBuy';

export interface OnboardingStep {
  targetSelector: string | null;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  beforeStep?: () => void;
}

export interface PageTour {
  page: PageName;
  condition?: () => boolean;
  steps: OnboardingStep[];
}

export const ONBOARDING_VERSION = 1;