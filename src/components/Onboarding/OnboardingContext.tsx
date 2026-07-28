import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateOnboardingVersion } from '@/api/client';
import { type OnboardingStep } from './types';
import { onboardingSteps } from './steps';

export { type OnboardingStep };

const CURRENT_VERSION = 1;

export const ONBOARDING_VERSION = CURRENT_VERSION;

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  isAutoTriggered: boolean;
  startOnboarding: (auto?: boolean) => void;
  completeOnboarding: () => Promise<void>;
  dismissOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  totalSteps: number;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isActive: false,
  currentStep: 0,
  steps: [],
  isAutoTriggered: false,
  startOnboarding: () => {},
  completeOnboarding: async () => {},
  dismissOnboarding: () => {},
  nextStep: () => {},
  prevStep: () => {},
  totalSteps: 0,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { customer, refreshCustomer } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoTriggered, setIsAutoTriggered] = useState(false);

  const startOnboarding = useCallback((auto = false) => {
    setCurrentStep(0);
    setIsAutoTriggered(auto);
    setIsActive(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await updateOnboardingVersion(CURRENT_VERSION);
      await refreshCustomer();
    } catch {
      // Silently fail — onboarding is already shown
    }
    setIsActive(false);
    setCurrentStep(0);
  }, [refreshCustomer]);

  const dismissOnboarding = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, onboardingSteps.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const shouldAutoShow = customer && customer.onboarding_version === 0;

  useEffect(() => {
    if (shouldAutoShow && !isActive) {
      const timer = setTimeout(() => {
        startOnboarding(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoShow, isActive, startOnboarding]);

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps: onboardingSteps,
        isAutoTriggered,
        startOnboarding,
        completeOnboarding,
        dismissOnboarding,
        nextStep,
        prevStep,
        totalSteps: onboardingSteps.length,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export { CURRENT_VERSION };