/**
 * Auth Helper Functions
 * 
 * 서버 컴포넌트에서 권한 확인을 위한 유틸리티 함수들
 */

import { auth } from "@/auth"
import { redirect } from "next/navigation"

/**
 * 관리자 권한을 확인하고, 권한이 없으면 리다이렉트
 * 
 * @param redirectTo - 권한이 없을 때 리다이렉트할 경로 (기본: '/unauthorized')
 * @returns 세션 정보
 * 
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   const session = await requireAdmin()
 *   return <AdminDashboard user={session.user} />
 * }
 * ```
 */
export async function requireAdmin(redirectTo: string = '/unauthorized') {
  const session = await auth()
  
  if (!session?.user?.isAdmin) {
    redirect(redirectTo)
  }
  
  return session
}

/**
 * 인증된 사용자인지 확인하고, 인증되지 않았으면 리다이렉트
 * 
 * @param redirectTo - 인증되지 않았을 때 리다이렉트할 경로 (기본: '/login')
 * @returns 세션 정보
 * 
 * @example
 * ```tsx
 * export default async function ProfilePage() {
 *   const session = await requireAuth()
 *   return <Profile user={session.user} />
 * }
 * ```
 */
export async function requireAuth(redirectTo: string = '/login') {
  const session = await auth()
  
  if (!session?.user) {
    redirect(redirectTo)
  }
  
  return session
}

/**
 * 현재 사용자가 관리자인지 확인 (리다이렉트 없음)
 * 
 * @returns 관리자 여부
 * 
 * @example
 * ```tsx
 * export default async function DashboardPage() {
 *   const isAdmin = await checkIsAdmin()
 *   
 *   return (
 *     <div>
 *       {isAdmin && <AdminPanel />}
 *       <UserContent />
 *     </div>
 *   )
 * }
 * ```
 */
export async function checkIsAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.isAdmin ?? false
}

