import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserService } from '@/domain/user/backend/UserService'
import { SqliteUserRepo } from '@/domain/user/backend/SqliteUserRepo'
// 입력 유효성 검사를 위한 Zod 스키마
const registerSchema = z.object({
  email: z.email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ 
        message: '입력값이 유효하지 않습니다.', 
        errors: z.flattenError(validation.error).fieldErrors
      }, { status: 400 })
    }
    
    const { email, password, name } = validation.data
    const userService = new UserService(new SqliteUserRepo())

    // 사용자 등록
    await userService.registerUser({
      email,
      password,
      name: name ?? null,
    })

    return NextResponse.json({ message: '회원가입이 완료되었습니다.' }, { status: 201 })

  } catch (error) {
    console.error('Register API error:', error)
    
    if (error instanceof Error && error.message === '이미 사용중인 이메일입니다.') {
      return NextResponse.json({ message: error.message }, { status: 409 })
    }
    
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
