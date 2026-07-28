export interface OnboardingStep {
  targetSelector: string | null;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  beforeStep?: () => void;
}