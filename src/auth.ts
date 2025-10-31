import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { object, string, ZodError } from "zod"
import { UserService } from "@/domain/user/backend/UserService"
import authConfig from "./auth.config"
import { SqliteUserRepo } from "@/domain/user/backend/SqliteUserRepo"
import { SessionUser, toSessionUser } from "@/domain/user/types"

// NextAuth 타입 확장 - User 도메인의 SessionUser 재사용
declare module "next-auth" {
  interface User extends SessionUser {}
  
  interface Session {
    user: SessionUser
  }
  
  interface JWT extends SessionUser {}
}

// Zod 스키마 정의
const signInSchema = object({
  email: string({ message: "이메일을 입력해주세요" })
    .min(1, "이메일을 입력해주세요")
    .email("올바른 이메일 형식이 아닙니다"),
  password: string({ message: "비밀번호를 입력해주세요" })
    .min(1, "비밀번호를 입력해주세요")
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .max(32, "비밀번호는 32자 이하여야 합니다"),
})

const userService = new UserService(new SqliteUserRepo())

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials)

          const user = userService.getUserByEmail(email)
          
          if (!user) {
            throw new Error("Invalid credentials.")
          }

          const isValidPassword = await userService.verifyPassword(
            password,
            user.password || ''
          )

          if (!isValidPassword) {
            throw new Error("Invalid credentials.")
          }

          // 관리자 여부 확인
          const isAdmin = userService.isAdmin(user.id)

          // User -> SessionUser 변환 (헬퍼 함수 사용)
          return toSessionUser(user, isAdmin)
        } catch (error) {
          if (error instanceof ZodError) {
            return null
          }
          return null
        }
      },
    }),
  ],
  callbacks: {
    // 공식 문서 권장: user의 모든 속성을 token에 복사
    async jwt({ token, user }) {
      if (user) {
        // user가 있으면 (첫 로그인 시) 모든 정보를 token에 저장
        return { ...token, ...user }
      }
      return token
    },
    // 공식 문서 권장: token의 모든 속성을 session에 복사
    async session({ session, token }) {
      // JWT 인터페이스를 SessionUser로 확장했으므로 안전하게 캐스팅
      const user = token as unknown as SessionUser
      session.user = user
      return session
    },
  },
})