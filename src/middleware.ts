/**
 * Next.js Middleware - Auth.js v5 인증 처리
 * 
 * 이 middleware는 Edge Runtime에서 실행됩니다.
 * 
 * 📖 동작 방식:
 * 1. Auth.js가 자동으로 auth.config.ts의 authorized callback을 호출합니다
 * 2. authorized callback이 false를 반환하면 자동으로 /login으로 리다이렉트됩니다
 * 
 * 📝 경로 제어:
 * - 공개/비공개 경로 설정: auth.config.ts의 authorized callback 수정
 * 
 * 🔗 관련 파일:
 * - auth.config.ts: Edge-compatible 설정 (경로별 권한 제어)
 * - auth.ts: 전체 Auth 설정 (Credentials provider, DB 접근)
 * 
 */

export { auth as middleware } from "@/auth"

/**
 * Middleware가 실행될 경로 패턴 정의
 * 
 * 현재 설정: 정적 리소스와 API 경로를 제외한 모든 경로
 * 
 * ⚠️ 주의: 
 * 공개/비공개 경로 제어는 여기가 아닌 auth.config.ts에서 합니다!
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)',
  ],
}
