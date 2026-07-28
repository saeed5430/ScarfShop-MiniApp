import { type FC, useCallback } from 'react';
import { useOnboarding } from './OnboardingContext';

export const HelpButton: FC = () => {
  const { startOnboarding } = useOnboarding();

  const handleClick = useCallback(() => {
    startOnboarding(false);
  }, [startOnboarding]);

  return (
    <button
      className="onboarding-help-btn"
      onClick={handleClick}
      aria-label="راهنما"
      title="راهنما"
      type="button"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>
  );
};