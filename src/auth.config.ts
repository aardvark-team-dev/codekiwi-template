import type { NextAuthConfig } from "next-auth"

/**
 * Edge-compatible Auth 설정
 * 
 * ⚠️ 주의: 이 파일은 Edge Runtime에서 실행됩니다
 * - Database adapter를 포함하면 안 됩니다
 * - DB 접근 코드를 포함하면 안 됩니다
 * - middleware.ts에서 import하여 사용됩니다
 * 
 * 전체 Auth 설정은 auth.ts를 참고하세요
 */
export default {
  providers: [], // providers는 auth.ts에서 추가
  pages: {
    signIn: '/login',
  },
  callbacks: {
    /**
     * authorized callback - 경로별 접근 권한 제어
     * 
     * ✅ 이 함수는 middleware에서 모든 요청마다 실행됩니다
     * ✅ true를 반환하면 접근 허용
     * ✅ false를 반환하면 자동으로 signIn 페이지로 리다이렉트
     * 
     * @param auth - 현재 사용자의 세션 정보 (로그인하지 않았으면 null)
     * @param request - Next.js Request 객체
     */
    authorized: async ({ auth, request }) => {
      const { pathname } = request.nextUrl
      
      // 공개 경로 정의 - 로그인 없이 접근 가능
      const publicPaths = [
        '/',
        '/login',
        '/signup',
        '/codekiwi-dashboard',
      ]
      
      // 공개 경로는 항상 허용
      if (publicPaths.includes(pathname)) {
        return true
      }
      
      // 나머지 경로는 로그인 필요
      // false를 반환하면 Auth.js가 자동으로 /login으로 리다이렉트
      return !!auth
    }
  }
} satisfies NextAuthConfig

