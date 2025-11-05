'use client'

import Image from "next/image";
import { updateTasksYaml, checkTasksYamlExists } from './actions/_updateTasks';
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PexelsImage from "@/components/PexelsImage";

// ⚠️ 임시 개발용 컴포넌트 - 제거 필요
export default function Home() {
  const [input, setInput] = useState('')
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkInit() {
      const result = await checkTasksYamlExists()
      setDialogOpen(!result.exists)
      setIsChecking(false)
    }
    checkInit()
  }, [])

  const handleSubmit = async () => {
    if (!input.trim()) {
      alert('기능 설명을 입력해주세요!')
      return
    }

    setIsSubmitting(true)
    try {
      // 사용자 입력을 그대로 전달 (YAML 유효성만 검사)
      const result = await updateTasksYaml(input)
      if (result.success) {
        alert('초기 설정이 완료되었습니다! ✅')
        setDialogOpen(false)
      } else {
        alert('저장 실패: ' + result.error)
      }
    } catch (error) {
      alert('오류 발생: ' + String(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }
  
  return (
    <>
      {/* ⚠️ 임시 개발용 Dialog - 제거 필요 */}
      <Dialog open={dialogOpen}>
        <DialogContent 
          className="max-w-3xl max-h-[80vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()} // 외부 클릭 차단
          onEscapeKeyDown={(e) => e.preventDefault()} // ESC 키 차단
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">🥝 초기 설정</DialogTitle>
            <DialogDescription>
              코드키위 프로젝트 페이지에서 복사한 기능 설명을 붙여넣으세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                기능 설명
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예시:&#10;- title: 로그인 기능&#10;  status: 개발 전&#10;  priority: 높음"
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex items-center gap-3">
          <Image
            className="dark:invert"
            src="/codekiwi_logo.ico"
            alt="CodeKiwi logo"
            width={90}
            height={19}
            priority
          />
          <span className="font-serif text-4xl font-medium text-gray-700 dark:text-gray-300">Codekiwi</span>
        </div>
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            왼쪽 검은 화면을 클릭하고 <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">/init</code>을 입력한 뒤 엔터를 두 번! 눌러주세요.
          </li>
          <li className="mb-2 tracking-[-.01em]">
            첫 번째 프로토타입이 나올 때까지 기다리세요.
          </li>
          <li className="tracking-[-.01em]">
            우측 하단의 &apos;🥝&apos;를 클릭해 기능별 진행률을 실시간으로 확인하세요.
          </li>
        </ol>

        <p className="font-mono text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
          <span className="font-semibold">TIP:</span> 채팅창은 방향키(↑, ↓)로 스크롤할 수 있습니다.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://www.codekiwi.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            더 알아보기
          </a>
          <button
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px] opacity-50 cursor-not-allowed"
            disabled
          >
            Read our docs
          </button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <button
          className="flex items-center gap-2 opacity-50 cursor-not-allowed"
          disabled
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </button>
        <button
          className="flex items-center gap-2 opacity-50 cursor-not-allowed"
          disabled
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </button>
      </footer>
    </div>
    </>
  );
}
