/**
 * 튜토리얼 설정
 * 
 * 각 프로젝트의 핵심 User Journey를 3-5단계로 구성합니다.
 * 사용자가 해당 요소를 클릭하면 다음 단계로 진행됩니다.
 */

export interface TutorialStep {
  target: string; // CSS selector (예: '#login-button', '.signup-form')
  content: string; // 설명 텍스트
  position?: 'top' | 'bottom' | 'left' | 'right'; // 말풍선 위치
}

export const tutorialSteps: TutorialStep[] = [
  // 예시: 로그인 플로우
  // {
  //   target: '#sign-in-button',
  //   content: '여기를 클릭해서 로그인하세요',
  //   position: 'bottom',
  // },
  // {
  //   target: '#dashboard-link',
  //   content: '로그인 후 대시보드로 이동합니다',
  //   position: 'right',
  // },
  // {
  //   target: '#main-feature',
  //   content: '여기서 핵심 기능을 사용할 수 있습니다',
  //   position: 'bottom',
  // },
];

