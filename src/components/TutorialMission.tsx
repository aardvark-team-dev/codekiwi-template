'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Minimize2, Maximize2 } from 'lucide-react';

/**
 * 튜토리얼 미션 타입
 */
interface Mission {
  title: string;
  steps: string[];
  question: string | null;
}

/**
 * 튜토리얼 미션 설정
 * 
 * 프로젝트의 핵심 User Journey를 3-4단계 미션으로 구성하세요.
 * 각 미션은 친절한 단계별 지시사항으로 작성합니다.
 */
const missions: Mission[] = [
  // 예시: 학원 관리 시스템
  // {
  //   title: "1단계: 학생 등록하기",
  //   steps: [
  //     "왼쪽 메뉴 또는 카드에서 '학생 등록' 버튼을 찾아주세요.",
  //     "학생 이름을 입력해주세요. (예: 홍길동)",
  //     "전화번호를 입력해주세요. (예: 010-1234-5678)",
  //     "월 수강료를 입력해주세요. (예: 300000)",
  //     "모든 정보를 입력하셨나요? 하단의 '등록' 버튼을 눌러주세요.",
  //     "학생이 목록에 추가되면 대시보드로 돌아와주세요."
  //   ],
  //   question: "학생 등록을 완료하셨나요?"
  // },
  // {
  //   title: "2단계: 출결 입력하기",
  //   steps: [
  //     "대시보드에서 '출결 입력' 카드를 찾아서 눌러주세요.",
  //     "방금 등록한 학생의 이름이 목록에 보이시나요?",
  //     "달력에서 오늘 날짜를 찾아주세요.",
  //     "학생 이름 옆에 있는 상태 버튼을 눌러주세요.",
  //     "'유계결석'을 한 번 선택해봅시다. (차감 금액이 자동으로 계산돼요!)",
  //     "다른 날짜에도 출석, 결석 등을 자유롭게 입력해보세요."
  //   ],
  //   question: "출결 입력을 체험해보셨나요?"
  // },
  // {
  //   title: "3단계: 청구 관리하기",
  //   steps: [
  //     "대시보드로 돌아가서 '청구 관리' 카드를 찾아주세요.",
  //     "카드를 눌러서 청구 관리 페이지로 이동해주세요.",
  //     "방금 입력한 학생의 청구 내역이 표시되나요?",
  //     "월 수강료에서 유계결석 차감액이 빠진 '최종 청구 금액'을 확인해주세요.",
  //     "학생 옆의 '청구서 발행' 버튼을 눌러주세요.",
  //     "청구서 미리보기가 새 탭에서 열립니다!"
  //   ],
  //   question: "청구서까지 확인해보셨나요?"
  // },
  // {
  //   title: "🎉 튜토리얼 완료!",
  //   steps: [
  //     "축하합니다! 학원 관리 시스템의 핵심 기능을 모두 체험하셨어요.",
  //     "이제 실제 학생들을 등록하고 관리해보세요.",
  //     "유계결석을 입력하면 자동으로 차감 금액이 계산됩니다.",
  //     "매달 청구서를 발행해서 학부모님께 보내실 수 있어요.",
  //     "궁금한 점이 있으면 언제든 오른쪽 하단의 🥝 키위 버튼을 눌러주세요!"
  //   ],
  //   question: null
  // }
];

export function TutorialMission() {
  const [currentMission, setCurrentMission] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('tutorial-completed');
    // missions가 비어있으면 튜토리얼을 표시하지 않음
    if (!completed && missions.length > 0) {
      setIsVisible(true);
    }
  }, []);

  const handleYes = () => {
    if (currentMission < missions.length - 1) {
      setCurrentMission(currentMission + 1);
    } else {
      localStorage.setItem('tutorial-completed', 'true');
      setIsVisible(false);
    }
  };

  const handleNo = () => {
    // 같은 미션 반복 (사용자가 다시 읽을 수 있도록)
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial-completed', 'true');
    setIsVisible(false);
  };

  // missions가 비어있거나 표시하지 않을 때 null 반환
  if (!isVisible || missions.length === 0) return null;

  const mission = missions[currentMission];
  const isLastMission = currentMission === missions.length - 1;

  // 최소화된 상태
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 flex items-center gap-2 font-semibold"
      >
        📖 튜토리얼 진행중 ({currentMission + 1}/{missions.length})
      </button>
    );
  }

  // 전체 카드
  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <Card className="shadow-2xl border-2 border-blue-500 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900">
              {mission.title}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 hover:bg-gray-100"
                title="최소화"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-6 w-6 hover:bg-gray-100"
                title="튜토리얼 건너뛰기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {mission.steps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <span className="text-blue-600 font-bold text-sm flex-shrink-0 mt-0.5">
                  {index + 1}.
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {mission.question && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                {mission.question}
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleYes} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  네, 완료했어요! ✓
                </Button>
                <Button 
                  onClick={handleNo} 
                  variant="outline" 
                  className="flex-1 border-gray-300"
                >
                  아니요, 다시 볼게요
                </Button>
              </div>
            </div>
          )}

          {isLastMission && (
            <Button 
              onClick={handleYes} 
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700" 
              size="lg"
            >
              튜토리얼 종료하기 🎓
            </Button>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
            <span className="font-medium">
              {currentMission + 1} / {missions.length}
            </span>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              건너뛰기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

