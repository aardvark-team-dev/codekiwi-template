import Image from "next/image";

export default function Home() {
  return (
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
            채팅창에 <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">/init</code>을 입력하세요.
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
  );
}
