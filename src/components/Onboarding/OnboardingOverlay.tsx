import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnboarding } from './OnboardingContext';

import './OnboardingOverlay.css';

export function OnboardingOverlay() {
  const {
    isActive,
    currentStep,
    steps,
    nextStep,
    prevStep,
    dismissOnboarding,
    completeOnboarding,
    totalSteps,
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const step = steps[currentStep];

  // Observe target element and update rect
  const updateTargetRect = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.targetSelector) as HTMLElement;
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // Full reset when deactivated
  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isActive]);

  // Track page scroll / resize + poll for dynamic elements
  useEffect(() => {
    if (!isActive) return;

    updateTargetRect();

    const handleMove = () => updateTargetRect();
    window.addEventListener('scroll', handleMove, { passive: true });
    window.addEventListener('resize', handleMove, { passive: true });
    intervalRef.current = window.setInterval(updateTargetRect, 500);

    return () => {
      window.removeEventListener('scroll', handleMove);
      window.removeEventListener('resize', handleMove);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentStep, updateTargetRect]);

  // Auto-scroll to target when step changes
  useEffect(() => {
    if (!isActive || !step?.targetSelector) return;

    const el = document.querySelector(step.targetSelector) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = window.setTimeout(() => {
        updateTargetRect();
      }, 350);
    }

    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [isActive, currentStep, step?.targetSelector, updateTargetRect]);

  const handleNext = useCallback(() => { nextStep(); }, [nextStep]);
  const handlePrev = useCallback(() => { prevStep(); }, [prevStep]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const hasTarget = step?.targetSelector != null && targetRect != null;

  // Compute tooltip position clamped to viewport
  const tooltipStyle: Record<string, number | string> = {};
  if (hasTarget && targetRect && step?.placement && step.placement !== 'center') {
    const tooltipW = 320;
    const gap = 14;
    let top = 0;
    let left = targetRect.left + targetRect.width / 2;

    if (step.placement === 'top') {
      top = targetRect.top - gap;
    } else {
      top = targetRect.bottom + gap;
    }

    left = Math.max(tooltipW / 2 + 8, Math.min(left, window.innerWidth - tooltipW / 2 - 8));
    tooltipStyle.top = top;
    tooltipStyle.left = left;
    tooltipStyle.transform = step.placement === 'top' ? 'translate(-50%, -100%)' : 'translateX(-50%)';
  }

  if (!isActive || !step) return null;

  return (
    <>
      {hasTarget && targetRect && step.placement !== 'center' && (
        <div
          className="onboarding-frame"
          style={{
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            top: targetRect.top - 6,
            left: targetRect.left - 6,
          }}
        >
          <div className="onboarding-frame-pulse" />
        </div>
      )}

      <div
        ref={tooltipRef}
        className="onboarding-tooltip"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i === currentStep ? 'onboarding-dot--active' : ''}`}
            />
          ))}
        </div>

        <div className="onboarding-content">
          <h3 className="onboarding-title">{step.title}</h3>
          <p className="onboarding-desc">{step.description}</p>
        </div>

        <div className="onboarding-actions">
          {!isFirst && (
            <button className="onboarding-btn onboarding-btn--ghost" onClick={handlePrev}>
              قبلی
            </button>
          )}
          <div className="onboarding-actions-right">
            {isLast ? (
              <button className="onboarding-btn onboarding-btn--primary" onClick={completeOnboarding}>
                متوجه شدم
              </button>
            ) : (
              <button className="onboarding-btn onboarding-btn--primary" onClick={handleNext}>
                {isFirst ? 'ادامه' : 'بعدی'}
              </button>
            )}
          </div>
        </div>

        <button className="onboarding-skip" onClick={dismissOnboarding}>
          رد کردن
        </button>
      </div>
    </>
  );
}