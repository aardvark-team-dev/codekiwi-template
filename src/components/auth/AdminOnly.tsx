/**
 * AdminOnly Component
 * 
 * 관리자만 볼 수 있는 컴포넌트 래퍼
 * 세션에 isAdmin 정보가 포함되어 있어 프론트엔드에서 관리자 여부를 확인할 수 있습니다.
 */

"use client"

import { useSession } from "next-auth/react"
import { ReactNode } from "react"

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * 클라이언트 컴포넌트에서 사용하는 관리자 전용 래퍼
 * 
 * @example
 * ```tsx
 * <AdminOnly fallback={<div>관리자 전용 기능입니다</div>}>
 *   <button>관리자 설정</button>
 * </AdminOnly>
 * ```
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return null
  }

  if (!session?.user?.isAdmin) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

