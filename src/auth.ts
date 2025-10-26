import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { object, string, ZodError } from "zod"
import { UserService } from "@/domain/user/backend/UserService"
import authConfig from "./auth.config"
import { SqliteUserRepo } from "@/domain/user/backend/SqliteUserRepo"

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

// UserService는 여기서만 사용 (Edge Runtime 아님)
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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})