import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from 'next/server'

// Edge-compatible NextAuth instance
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const publicPaths = ['/login', '/signup', '/', '/codekiwi-dashboard']
  
  // 공개 경로는 인증 없이 접근 가능
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // 인증되지 않은 사용자 처리
  if (!req.auth) {
    // API 요청은 401 JSON 응답
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }
    
    // 페이지 요청은 로그인 페이지로 리다이렉트
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 인증된 사용자는 요청 진행
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/|[^?]*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)',
  ],
}
