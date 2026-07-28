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
  isAutoTriggered: boolean;
  startOnboarding: (page?: PageName, auto?: boolean) => void;
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
  const [isAutoTriggered, setIsAutoTriggered] = useState(false);

  const autoShownRef = useRef(false);
  const pageRef = useRef<PageName>('home');

  const getStepsForPage = useCallback((page: PageName): OnboardingStep[] => {
    const tour = pageTours.find((t) => t.page === page);
    return tour?.steps ?? [];
  }, []);

  const startOnboarding = useCallback((page?: PageName, auto = false) => {
    const targetPage = page || getPageFromHash();
    const pageSteps = getStepsForPage(targetPage);
    if (pageSteps.length === 0) return;

    pageRef.current = targetPage;
    setCurrentPage(targetPage);
    setSteps(pageSteps);
    setCurrentStep(0);
    setIsAutoTriggered(auto);
    setIsActive(true);
  }, [getStepsForPage]);

  const completeOnboarding = useCallback(async () => {
    const completedPage = pageRef.current;

    // Mark this page as completed in localStorage
    markPageCompleted(completedPage);

    // Close overlay
    autoShownRef.current = true;
    setIsActive(false);
    setCurrentStep(0);
    setCurrentPage(null);
    setSteps([]);

    // If all pages are now completed, save to DB
    if (allPagesCompleted()) {
      try {
        await updateOnboardingVersion(ONBOARDING_VERSION);
        await refreshCustomer();
      } catch {
        // Silently fail
      }
    }
  }, [refreshCustomer]);

  const dismissOnboarding = useCallback(() => {
    autoShownRef.current = true;
    setIsActive(false);
    setCurrentStep(0);
    setCurrentPage(null);
    setSteps([]);
  }, []);

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

    const timer = setTimeout(() => {
      startOnboarding(undefined, true);
    }, 600);

    return () => clearTimeout(timer);
  }, [customer, startOnboarding]);

  // Watch hash changes to sync currentPage
  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      pageRef.current = page;
      if (!isActive) {
        setCurrentPage(page);
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
        isAutoTriggered,
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