'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardFloatingButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(false);
  const isDashboardPage = pathname === '/codekiwi-dashboard';

  // localStorage에서 숨김 상태 복원
  useEffect(() => {
    const hidden = localStorage.getItem('dashboard-button-hidden') === 'true';
    setIsHidden(hidden);
  }, []);

  // Production 환경에서는 표시하지 않음
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleToggleVisibility = () => {
    const newHiddenState = !isHidden;
    setIsHidden(newHiddenState);
    localStorage.setItem('dashboard-button-hidden', String(newHiddenState));
  };

  const handleNavigate = () => {
    if (isDashboardPage) {
      router.push('/');
    } else {
      router.push('/codekiwi-dashboard');
    }
  };

  const handleRestartTutorial = () => {
    localStorage.removeItem('tutorial-completed');
    window.location.reload();
  };

  if (isHidden && !isDashboardPage) {
    // 숨김 상태일 때 작은 버튼만 표시
    return (
      <button
        onClick={handleToggleVisibility}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#111827] text-white rounded-full shadow-lg hover:bg-[#1f2937] transition-all hover:scale-110 z-50 flex items-center justify-center"
        aria-label="대시보드 버튼 표시"
      >
        🥝
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      {!isDashboardPage && (
        <button
          onClick={handleToggleVisibility}
          className="w-8 h-8 bg-[#6b7280] text-white rounded-full shadow-md hover:bg-[#4b5563] transition-all flex items-center justify-center text-xs"
          aria-label="대시보드 버튼 숨기기"
        >
          ✕
        </button>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="bg-[#111827] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#1f2937] transition-all hover:scale-105 font-medium text-sm flex items-center gap-2"
          >
            {isDashboardPage ? (
              <>
                <span>←</span>
                <span>나가기</span>
              </>
            ) : (
              <>
                <span>🥝</span>
                <span>키위</span>
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          side="top"
          className="mb-2 backdrop-blur-lg bg-white/95 border border-gray-200 shadow-xl"
        >
          <DropdownMenuItem 
            onClick={handleNavigate}
            className="cursor-pointer"
          >
            {isDashboardPage ? '홈으로 돌아가기' : '기능 목록 보기'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleRestartTutorial}
            className="cursor-pointer"
          >
            튜토리얼 다시보기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

