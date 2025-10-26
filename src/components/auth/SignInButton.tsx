'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

export function SignInButton({ children }: { children: ReactNode }) {
  // children을 Link로 감싸서 클릭 가능한 요소로 만듭니다.
  // Clerk의 SignInButton처럼 mode="modal" 기능은 없으므로, 페이지 이동으로 처리합니다.
  return (
    <Link href="/login">
      {children}
    </Link>
  )
}
