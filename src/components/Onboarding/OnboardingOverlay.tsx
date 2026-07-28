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

  const step = steps[currentStep];

  const observeTarget = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const selector = step.targetSelector;
    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector) as HTMLElement;
        if (found) {
          setTargetRect(found.getBoundingClientRect());
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 4000);
    }
  }, [step]);

  useEffect(() => {
    if (!isActive) { setTargetRect(null); return; }
    observeTarget();
  }, [isActive, observeTarget]);

  useEffect(() => {
    if (!isActive) return;
    observeTarget();

    const handleScroll = () => {
      if (step?.targetSelector) {
        const el = document.querySelector(step.targetSelector) as HTMLElement;
        if (el) setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    const interval = setInterval(() => {
      if (step?.targetSelector) {
        const el = document.querySelector(step.targetSelector) as HTMLElement;
        if (el) setTargetRect(el.getBoundingClientRect());
      }
    }, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearInterval(interval);
    };
  }, [isActive, currentStep, step, observeTarget]);

  // Auto-scroll to target
  useEffect(() => {
    if (!isActive || !step?.targetSelector) return;
    const el = document.querySelector(step.targetSelector) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
      }, 400);
    }
  }, [isActive, currentStep, step]);

  const handleNext = useCallback(() => { nextStep(); }, [nextStep]);
  const handlePrev = useCallback(() => { prevStep(); }, [prevStep]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const hasTarget = step?.targetSelector != null && targetRect != null;

  // Compute tooltip position clamped to viewport
  const tooltipStyle: Record<string, number | string> = {};
  if (hasTarget && targetRect && step?.placement !== 'center') {
    const tooltipW = 320;
    const gap = 14;
    let top = 0, left = 0;

    if (step.placement === 'top') {
      top = targetRect.top - gap;
      left = targetRect.left + targetRect.width / 2;
      // Clamp
      left = Math.max(tooltipW / 2 + 8, Math.min(left, window.innerWidth - tooltipW / 2 - 8));
      tooltipStyle.top = top;
      tooltipStyle.left = left;
      tooltipStyle.transform = 'translate(-50%, -100%)';
    } else {
      top = targetRect.bottom + gap;
      left = targetRect.left + targetRect.width / 2;
      // Clamp
      left = Math.max(tooltipW / 2 + 8, Math.min(left, window.innerWidth - tooltipW / 2 - 8));
      tooltipStyle.top = top;
      tooltipStyle.left = left;
      tooltipStyle.transform = 'translateX(-50%)';
    }
  }

  if (!isActive || !step) return null;

  return (
    <>
      {/* Purple frame around target */}
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

      {/* Tooltip card */}
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