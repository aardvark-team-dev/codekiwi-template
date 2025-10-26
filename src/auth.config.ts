import type { NextAuthConfig } from "next-auth"

// Edge-compatible 설정 (database adapter 제외)
// middleware에서 사용하기 위한 설정
export default {
  providers: [], // providers는 auth.ts에서 추가
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: async ({ auth }) => {
      // 로그인한 사용자만 접근 허용
      return !!auth
    }
  }
} satisfies NextAuthConfig

