'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Task = {
  title: string;
  userStoryId: string;
  userStory: string;
  acceptanceCriteria?: Array<{ description: string }>;
  uncertainties?: string[];
  priority: string;
  dependencies?: string[];
  risk?: number;
  status: string;
  questions?: string[];
};

type TasksByStatus = {
  '구체화 필요': Task[];
  '개발 준비 완료': Task[];
  '개발 중': Task[];
  '개발 완료': Task[];
};

export default function DashboardClient({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ header: '', body: '' });

  function mapStatus(task: Task): keyof TasksByStatus {
    const status = task.status;
    const risk = task.risk;

    if (status === '개발 전') {
      if (risk === undefined || risk === null) {
        return '구체화 필요';
      }
      return risk < 0.4 ? '개발 준비 완료' : '구체화 필요';
    }

    return status as keyof TasksByStatus;
  }

  function calculatePrototypeAvgRisk(tasks: Task[]): number {
    let totalRisk = 0;
    let validRiskCount = 0;

    tasks.forEach(task => {
      const mappedStatus = mapStatus(task);
      if (mappedStatus !== '개발 완료' && task.risk !== undefined && task.risk !== null) {
        totalRisk += task.risk;
        validRiskCount++;
      }
    });

    return validRiskCount > 0 ? totalRisk / validRiskCount : 0;
  }

  function getBugRiskLevel(risk: number): string {
    if (risk >= 0.6) return '높음';
    if (risk >= 0.3) return '중간';
    return '낮음';
  }

  function getStatusMessage(status: string) {
    const messages: Record<string, { header: string; body: string }> = {
      '구체화 필요': {
        header: '버그 확률이 너무 높아 개발할 수 없습니다!',
        body: '채팅창에 /ask-me를 입력해서 버그 확률을 낮춰주세요.'
      },
      '개발 준비 완료': {
        header: '이제 개발할 수 있습니다!',
        body: '채팅창에 /dev를 입력해 개발을 요청하세요.\n더 구체화하려면 /ask-me를 입력하세요.'
      },
      '개발 중': {
        header: '개발 진행 중입니다.',
        body: 'AI가 개발 중입니다.'
      },
      '개발 완료': {
        header: '개발이 완료되었습니다.',
        body: '버그가 있는 경우, 채팅창에 /debug를 입력해 해결해주세요.'
      }
    };
    return messages[status] || { header: '알림', body: '상태 정보가 없습니다.' };
  }

  function showModal(status: string) {
    const message = getStatusMessage(status);
    setModalContent(message);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleRefresh() {
    router.refresh();
  }

  const tasksByStatus: TasksByStatus = {
    '구체화 필요': [],
    '개발 준비 완료': [],
    '개발 중': [],
    '개발 완료': []
  };

  tasks.forEach(task => {
    const mappedStatus = mapStatus(task);
    tasksByStatus[mappedStatus].push(task);
  });

  const avgRisk = calculatePrototypeAvgRisk(tasks);

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] p-6 flex items-center justify-center">
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 max-w-[600px] text-center">
          <div className="text-[1.5rem] font-semibold text-[#111827] mb-4">
            📋 작업 데이터가 없습니다
          </div>
          <div className="text-[#6b7280] mb-6">
            <code className="bg-[#f3f4f6] px-2 py-1 rounded">.codekiwi/tasks.yaml</code> 파일을 확인해주세요.
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-[#111827] text-white px-5 py-2.5 rounded-lg text-[0.9rem] font-medium transition-all hover:bg-[#1f2937]"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-[1.75rem] font-semibold text-[#111827] mb-2">
              🥝 코드키위 대시보드
            </h1>
            <p className="text-[#6b7280] text-[0.95rem]">
              프로젝트 작업 현황을 한눈에 확인하세요
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-[#111827] text-white px-5 py-2.5 rounded-lg text-[0.9rem] font-medium transition-all hover:bg-[#1f2937] hover:-translate-y-px hover:shadow-lg"
          >
            🔄 새로고침
          </button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {/* 프로토타입 섹션 */}
          <div className="flex-[2] min-w-[700px] bg-white rounded-xl border border-[#e5e7eb]">
            <div className="p-5 border-b border-[#e5e7eb]">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-semibold text-[1.125rem] text-[#111827]">
                    프로토타입
                  </div>
                  <div className="text-[#6b7280] text-[0.875rem] mt-1">
                    디자인만 있고 실제 동작하지 않아요
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[2rem] font-semibold text-[#f59e0b]">
                    {(avgRisk * 100).toFixed(0)}%
                  </div>
                  <div className="text-[0.75rem] text-[#6b7280]">
                    평균 버그 확률
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-px bg-[#e5e7eb]">
              {(['구체화 필요', '개발 준비 완료', '개발 중'] as const).map((status) => (
                <div key={status} className="flex-1 min-w-[200px] bg-white flex flex-col">
                  <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center">
                    <div className="font-semibold text-[0.95rem] text-[#111827]">
                      {status}
                    </div>
                    <div className="bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded-xl text-[0.8rem] font-medium">
                      {tasksByStatus[status].length}
                    </div>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[400px]">
                    {tasksByStatus[status].map((task) => (
                      <TaskCard
                        key={task.userStoryId}
                        task={task}
                        onShowModal={showModal}
                        getBugRiskLevel={getBugRiskLevel}
                        mapStatus={mapStatus}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 개발 완료 섹션 */}
          <div className="flex-1 min-w-[320px] bg-white rounded-xl border border-[#e5e7eb]">
            <div className="p-5 border-b border-[#e5e7eb]">
              <div className="font-semibold text-[1.125rem] text-[#111827]">
                개발 완료
              </div>
              <div className="text-[#6b7280] text-[0.875rem] mt-1">
                실제 동작하는 기능들이에요
              </div>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {tasksByStatus['개발 완료'].map((task) => (
                <TaskCard
                  key={task.userStoryId}
                  task={task}
                  onShowModal={showModal}
                  getBugRiskLevel={getBugRiskLevel}
                  mapStatus={mapStatus}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-[500px] w-[90%] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[1.25rem] font-semibold text-[#111827] mb-4">
              {modalContent.header}
            </div>
            <div className="text-[#4b5563] leading-relaxed mb-6 whitespace-pre-line">
              {modalContent.body.split('/').map((part, i) =>
                i === 0 ? (
                  part
                ) : (
                  <span key={i}>
                    <code className="bg-[#f3f4f6] text-[#111827] px-3 py-2 rounded-md font-mono text-[0.95rem] inline-block my-1">
                      /{part.split('를')[0]}
                    </code>
                    {part.includes('를') ? '를' + part.split('를')[1] : ''}
                  </span>
                )
              )}
            </div>
            <button
              className="bg-[#111827] text-white border-none px-6 py-2.5 rounded-lg text-[0.9rem] font-medium cursor-pointer transition-all hover:bg-[#1f2937]"
              onClick={closeModal}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onShowModal,
  getBugRiskLevel,
  mapStatus
}: {
  task: Task;
  onShowModal: (status: string) => void;
  getBugRiskLevel: (risk: number) => string;
  mapStatus: (task: Task) => string;
}) {
  const hasRisk = task.risk !== undefined && task.risk !== null;
  const riskValue = task.risk ?? 0;
  const bugRiskLevel = hasRisk ? getBugRiskLevel(riskValue) : '미정';
  const mappedStatus = mapStatus(task);
  const isCompleted = mappedStatus === '개발 완료';

  const riskColors: Record<string, string> = {
    높음: 'bg-[#fef2f2] text-[#991b1b]',
    중간: 'bg-[#fef3c7] text-[#92400e]',
    낮음: 'bg-[#f0fdf4] text-[#166534]'
  };

  const fillColors: Record<string, string> = {
    높음: 'bg-[#dc2626]',
    중간: 'bg-[#f59e0b]',
    낮음: 'bg-[#16a34a]'
  };

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-lg p-4 cursor-pointer transition-all hover:border-[#d1d5db] hover:shadow-md hover:-translate-y-0.5"
      onClick={() => onShowModal(mappedStatus)}
    >
      <div className="mb-3">
        <div className="text-[0.95rem] font-semibold text-[#111827] mb-1.5">
          {task.title}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.75rem] text-[#6b7280] font-mono">
            {task.userStoryId}
          </span>
          {!isCompleted &&
            (hasRisk ? (
              <span
                className={`${riskColors[bugRiskLevel]} px-2 py-0.5 rounded text-[0.75rem] font-medium`}
              >
                버그 확률 {bugRiskLevel}
              </span>
            ) : (
              <span className="bg-[#f3f4f6] text-[#6b7280] px-2 py-0.5 rounded text-[0.75rem] font-medium">
                평가 필요
              </span>
            ))}
        </div>
      </div>

      {!isCompleted && hasRisk && (
        <div className="mb-3">
          <div className="text-[0.75rem] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
            버그 확률
          </div>
          <div className="flex items-center gap-2 text-[0.85rem]">
            <span>{(riskValue * 100).toFixed(0)}%</span>
            <div className="flex-1 h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
              <div
                className={`h-full ${fillColors[bugRiskLevel]} transition-all`}
                style={{ width: `${riskValue * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-[0.875rem] text-[#6b7280] leading-relaxed mb-3">
        {task.userStory}
      </div>

      <div className="border-t border-[#f3f4f6] pt-3 mt-3">
        {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
          <div className="mb-3">
            <div className="text-[0.75rem] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
              세부 요구사항
            </div>
            <ul className="list-none">
              {task.acceptanceCriteria.map((criteria, i) => (
                <li
                  key={i}
                  className="text-[0.85rem] text-[#4b5563] py-1 leading-snug before:content-['•'] before:text-[#9ca3af] before:mr-2"
                >
                  {criteria.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {task.dependencies && task.dependencies.length > 0 && (
          <div className="mb-3">
            <div className="text-[0.75rem] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
              의존성
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {task.dependencies.map((dep, i) => (
                <span
                  key={i}
                  className="bg-[#f3f4f6] text-[#4b5563] px-2 py-1 rounded text-[0.75rem] font-mono"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {task.questions && task.questions.length > 0 && (
          <div>
            <div className="text-[0.75rem] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
              남은 질문
            </div>
            <ul className="list-none">
              {task.questions.map((question, i) => (
                <li
                  key={i}
                  className="text-[0.85rem] text-[#4b5563] py-1 leading-snug before:content-['•'] before:text-[#9ca3af] before:mr-2"
                >
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

