'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { tutorialSteps } from '@/lib/tutorial-config';

export function Tutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 튜토리얼 완료 여부 확인
    const completed = localStorage.getItem('tutorial-completed');
    if (!completed && tutorialSteps.length > 0) {
      setIsActive(true);
    }
  }, []);

  useEffect(() => {
    if (!isActive || currentStep >= tutorialSteps.length) return;

    const step = tutorialSteps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      
      // 요소로 스크롤
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 클릭 이벤트 리스너
      const handleClick = () => {
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // 튜토리얼 완료
          localStorage.setItem('tutorial-completed', 'true');
          setIsActive(false);
        }
      };

      element.addEventListener('click', handleClick);
      return () => element.removeEventListener('click', handleClick);
    }
  }, [isActive, currentStep]);

  if (!isActive || !targetElement) return null;

  const step = tutorialSteps[currentStep];
  const rect = targetElement.getBoundingClientRect();

  // 말풍선 위치 계산
  const getTooltipPosition = () => {
    const tooltipOffset = 20;
    const position = step.position || 'bottom';

    switch (position) {
      case 'top':
        return {
          left: rect.left + rect.width / 2,
          top: rect.top - tooltipOffset,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          left: rect.left + rect.width / 2,
          top: rect.bottom + tooltipOffset,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          left: rect.left - tooltipOffset,
          top: rect.top + rect.height / 2,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          left: rect.right + tooltipOffset,
          top: rect.top + rect.height / 2,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          left: rect.left + rect.width / 2,
          top: rect.bottom + tooltipOffset,
          transform: 'translateX(-50%)',
        };
    }
  };

  const tooltipPos = getTooltipPosition();

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] pointer-events-none"
        style={{
          // 스포트라이트 효과: 해당 요소만 구멍 뚫기
          WebkitMaskImage: `radial-gradient(circle at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent ${Math.max(rect.width, rect.height) / 2 + 20}px, black ${Math.max(rect.width, rect.height) / 2 + 40}px)`,
          maskImage: `radial-gradient(circle at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px, transparent ${Math.max(rect.width, rect.height) / 2 + 20}px, black ${Math.max(rect.width, rect.height) / 2 + 40}px)`,
        }}
      />

      {/* 하이라이트 링 */}
      <div
        className="fixed ring-4 ring-blue-500 shadow-2xl rounded-lg pointer-events-none z-[9999] transition-all duration-300"
        style={{
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        }}
      />

      {/* 설명 말풍선 */}
      <div
        className="fixed z-[10000] pointer-events-none"
        style={{
          left: tooltipPos.left,
          top: tooltipPos.top,
          transform: tooltipPos.transform,
        }}
      >
        <Card className="backdrop-blur-lg bg-white/95 border-2 border-blue-500/20 shadow-2xl max-w-xs pointer-events-auto animate-in fade-in duration-300">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-900">
              {step.content}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {currentStep + 1} / {tutorialSteps.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

