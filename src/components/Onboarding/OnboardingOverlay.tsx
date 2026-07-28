import { useState, useEffect, useRef, useCallback } from 'react';
import { useOnboarding } from './OnboardingContext';
import './OnboardingOverlay.css';

export function OnboardingOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, dismissOnboarding, completeOnboarding, totalSteps } = useOnboarding();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const intervalRef = useRef<number>(0);

  const step = steps[currentStep];
  const sel = step?.targetSelector;

  // Poll for target element position
  useEffect(() => {
    if (!isActive || !sel) { setRect(null); return; }
    const poll = () => {
      const el = document.querySelector(sel) as HTMLElement | null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    poll();
    intervalRef.current = window.setInterval(poll, 300);
    return () => clearInterval(intervalRef.current);
  }, [isActive, currentStep, sel]);

  // Auto-scroll to target on step change
  useEffect(() => {
    if (!isActive || !sel) return;
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setRect(el.getBoundingClientRect()), 350);
    }
  }, [isActive, currentStep, sel]);

  const hNext = useCallback(() => nextStep(), [nextStep]);
  const hPrev = useCallback(() => prevStep(), [prevStep]);
  const first = currentStep === 0;
  const last = currentStep === totalSteps - 1;

  if (!isActive || !step) return null;

  const hasFrame = sel != null && rect != null;

  return (
    <div className="onboarding-wrapper" onClick={dismissOnboarding}>
      {hasFrame && (
        <div
          className="onboarding-frame"
          style={{
            width: rect!.width + 12,
            height: rect!.height + 12,
            top: rect!.top - 6,
            left: rect!.left - 6,
          }}
        >
          <div className="onboarding-frame-pulse" />
        </div>
      )}

      <div className="onboarding-tooltip" onClick={(e) => e.stopPropagation()}>
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === currentStep ? 'onboarding-dot--active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-content">
          <h3 className="onboarding-title">{step.title}</h3>
          <p className="onboarding-desc">{step.description}</p>
        </div>

        <div className="onboarding-actions">
          {!first && <button className="onboarding-btn onboarding-btn--ghost" onClick={hPrev}>قبلی</button>}
          <div className="onboarding-actions-right">
            {last ? (
              <button className="onboarding-btn onboarding-btn--primary" onClick={completeOnboarding}>متوجه شدم</button>
            ) : (
              <button className="onboarding-btn onboarding-btn--primary" onClick={hNext}>{first ? 'ادامه' : 'بعدی'}</button>
            )}
          </div>
        </div>

        <button className="onboarding-skip" onClick={dismissOnboarding}>رد کردن</button>
      </div>
    </div>
  );
}