import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOnboarding } from './OnboardingContext';

import './OnboardingOverlay.css';

export function OnboardingOverlay() {
  const {
    isActive,
    currentStep,
    steps,
    isAutoTriggered,
    nextStep,
    prevStep,
    dismissOnboarding,
    completeOnboarding,
    totalSteps,
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  const step = steps[currentStep];

  const observeTarget = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const selector = step.targetSelector;
    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector) as HTMLElement;
        if (found) {
          setTargetRect(found.getBoundingClientRect());
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 3000);
    }
  }, [step]);

  useEffect(() => {
    if (isActive) {
      observeTarget();
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isActive, observeTarget]);

  useEffect(() => {
    if (!isActive) return;

    observeTarget();

    const handleScroll = () => {
      if (step?.targetSelector) {
        const el = document.querySelector(step.targetSelector) as HTMLElement;
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isActive, currentStep, step, observeTarget]);

  useEffect(() => {
    if (!isActive) return;
    const recheck = setInterval(() => {
      if (step?.targetSelector) {
        const el = document.querySelector(step.targetSelector) as HTMLElement;
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        }
      }
    }, 500);
    return () => clearInterval(recheck);
  }, [isActive, step, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const nextStepData = steps[currentStep + 1];
      if (nextStepData?.beforeStep) {
        nextStepData.beforeStep();
      }
    }
    nextStep();
  }, [currentStep, totalSteps, steps, nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isCenter = step?.placement === 'center';

  const tooltipStyle = useMemo(() => {
    if (isCenter || !targetRect) return {};

    const gap = 12;
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
      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - gap;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + gap;
        break;
    }

    return { top, left };
  }, [isCenter, targetRect, step]);

  if (!isActive || !step) return null;

  return (
    <div className={`onboarding-overlay ${visible ? 'onboarding-overlay--visible' : ''}`}>
      {/* Full dim layer */}
      <div className="onboarding-dim" onClick={dismissOnboarding} />

      {/* Spotlight cutout */}
      {targetRect && !isCenter && (
        <div
          className="onboarding-spotlight"
          style={{
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            top: targetRect.top - 8,
            left: targetRect.left - 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`onboarding-tooltip onboarding-tooltip--${step.placement || 'center'}`}
        style={isCenter ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        } : tooltipStyle}
      >
        {/* Step dots */}
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
          {!isFirst && !isCenter && (
            <button className="onboarding-btn onboarding-btn--ghost" onClick={handlePrev}>
              قبلی
            </button>
          )}
          <div className="onboarding-actions-right">
            {isAutoTriggered && isLast && (
              <button className="onboarding-btn onboarding-btn--primary" onClick={completeOnboarding}>
                شروع کن!
              </button>
            )}
            {!isAutoTriggered && isLast && (
              <button className="onboarding-btn onboarding-btn--primary" onClick={dismissOnboarding}>
                بستن
              </button>
            )}
            {isCenter && !isLast && (
              <button className="onboarding-btn onboarding-btn--primary" onClick={handleNext}>
                {isFirst ? 'شروع کن' : 'بعدی'}
              </button>
            )}
            {!isCenter && !isLast && (
              <button className="onboarding-btn onboarding-btn--primary" onClick={handleNext}>
                بعدی
              </button>
            )}
          </div>
        </div>

        {/* Skip button */}
        <button className="onboarding-skip" onClick={dismissOnboarding}>
          رد کردن
        </button>
      </div>
    </div>
  );
}