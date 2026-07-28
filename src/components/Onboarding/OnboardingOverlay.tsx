import { useState, useEffect, useCallback, useMemo } from 'react';
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
    if (!isActive) {
      setTargetRect(null);
      return;
    }
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

  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isCenter = step?.placement === 'center';

  const tooltipStyle = useMemo(() => {
    if (isCenter || !targetRect) return {};

    const gap = 14;
    let top = 0;
    let left = 0;

    switch (step?.placement) {
      case 'top':
        top = targetRect.top - gap;
        left = targetRect.left + targetRect.width / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2;
        break;
    }

    return { top, left };
  }, [isCenter, targetRect, step]);

  if (!isActive || !step) return null;

  return (
    <>
      {/* Full-page dim backdrop — only catches clicks outside spotlight */}
      <div className="onboarding-backdrop" onClick={dismissOnboarding} />

      {/* Spotlight — the "hole" that shows the target clearly */}
      {targetRect && !isCenter && (
        <div
          className="onboarding-spotlight"
          style={{
            width: targetRect.width + 20,
            height: targetRect.height + 20,
            top: targetRect.top - 10,
            left: targetRect.left - 10,
          }}
        >
          {/* Pulse ring */}
          <div className="onboarding-pulse" />
          {/* Animated pointer arrow */}
          {step?.placement === 'bottom' && <div className="onboarding-arrow onboarding-arrow--up" />}
          {step?.placement === 'top' && <div className="onboarding-arrow onboarding-arrow--down" />}
        </div>
      )}

      {/* Tooltip card */}
      <div
        className={`onboarding-tooltip onboarding-tooltip--${step.placement || 'center'}`}
        style={isCenter ? undefined : tooltipStyle}
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
              <button
                className="onboarding-btn onboarding-btn--primary"
                onClick={completeOnboarding}
              >
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