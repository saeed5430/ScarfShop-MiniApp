import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateOnboardingVersion } from '@/api/client';
import { pageTours } from './steps';
import { ONBOARDING_VERSION } from './types';
import type { PageName, OnboardingStep } from './types';

export type { PageName, OnboardingStep };
export { ONBOARDING_VERSION };

const LS_PREFIX = 'onboard_page_';
const ALL_PAGES: PageName[] = ['home', 'profile', 'quickBuy'];

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  currentPage: PageName | null;
  startOnboarding: (page?: PageName) => void;
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
  currentPage: null,
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

function getPageFromHash(): PageName {
  const hash = window.location.hash.slice(1) || '/';
  if (hash === '/') return 'home';
  if (hash.startsWith('/profile')) return 'profile';
  if (hash.startsWith('/quick-buy')) return 'quickBuy';
  return 'home';
}

function isPageCompleted(page: PageName): boolean {
  return localStorage.getItem(LS_PREFIX + page) === '1';
}

function markPageCompleted(page: PageName): void {
  localStorage.setItem(LS_PREFIX + page, '1');
}

function allPagesCompleted(): boolean {
  return ALL_PAGES.every((p) => isPageCompleted(p));
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { customer, refreshCustomer } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentPage, setCurrentPage] = useState<PageName | null>(null);

  const autoShownRef = useRef(false);
  const pageRef = useRef<PageName>('home');

  const getStepsForPage = useCallback((page: PageName): OnboardingStep[] => {
    const tour = pageTours.find((t) => t.page === page);
    return tour?.steps ?? [];
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    setCurrentPage(null);
  }, []);

  const startOnboarding = useCallback((page?: PageName) => {
    const targetPage = page || getPageFromHash();
    const pageSteps = getStepsForPage(targetPage);
    if (pageSteps.length === 0) return;

    pageRef.current = targetPage;
    setCurrentPage(targetPage);
    setSteps(pageSteps);
    setCurrentStep(0);
    setIsActive(true);
  }, [getStepsForPage]);

  const completeOnboarding = useCallback(async () => {
    const completedPage = pageRef.current;
    markPageCompleted(completedPage);
    autoShownRef.current = true;
    stop();

    if (allPagesCompleted()) {
      try {
        await updateOnboardingVersion(ONBOARDING_VERSION);
        await refreshCustomer();
      } catch { /* ignore */ }
    }
  }, [refreshCustomer, stop]);

  const dismissOnboarding = useCallback(() => {
    autoShownRef.current = true;
    stop();
  }, [stop]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Call beforeStep when entering a new step
  useEffect(() => {
    if (!isActive) return;
    const s = steps[currentStep];
    if (s?.beforeStep) {
      s.beforeStep();
    }
  }, [currentStep, isActive, steps]);

  // Auto-trigger: once per session, only if onboarding_version === 0
  useEffect(() => {
    if (!customer || autoShownRef.current) return;
    if (customer.onboarding_version !== 0) {
      autoShownRef.current = true;
      return;
    }
    if (isActive) return;

    const timer = setTimeout(() => {
      if (!isActive) {
        startOnboarding();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [customer, startOnboarding, isActive]);

  // Watch hash changes to sync currentPage
  useEffect(() => {
    const handleHashChange = () => {
      pageRef.current = getPageFromHash();
      if (!isActive) {
        setCurrentPage(getPageFromHash());
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isActive]);

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        currentPage,
        startOnboarding,
        completeOnboarding,
        dismissOnboarding,
        nextStep,
        prevStep,
        totalSteps: steps.length,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}