#!/usr/bin/env tsx
/**
 * Admin 계정 생성 스크립트
 * 
 * 사용법:
 * npm run admin:create <email> <password> <name>
 * 또는
 * npx tsx scripts/create-admin.ts <email> <password> <name>
 * 
 * 예시 (비밀번호 8글자 이상):
 * npx tsx scripts/create-admin.ts admin@codekiwi.ai 12345678 "관리자"
 */

import { UserService } from '../src/domain/user/backend/UserService'
import { SqliteUserRepo } from '../src/domain/user/backend/SqliteUserRepo'
import * as clearNextServerProcess from './clear-next-server-process.js'
import { z } from 'zod'

const clearNextServer = clearNextServerProcess.main

// 입력 유효성 검사를 위한 Zod 스키마
const adminSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
  name: z.string().min(1, { message: '이름을 입력해주세요.' }),
})

async function createAdmin() {
  // Next.js 서버 프로세스 정리
  try {
    await clearNextServer()
  } catch (error: any) {
    console.warn('⚠️ Next.js 프로세스 정리 실패:', error.message)
  }

  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.error('사용법: npx tsx scripts/create-admin.ts <email> <password> <name>')
    console.error('예시: npx tsx scripts/create-admin.ts admin@codekiwi.dev password123 "관리자"')
    process.exit(1)
  }

  const [email, password, name] = args

  // 입력값 검증
  const validation = adminSchema.safeParse({ email, password, name })
  
  if (!validation.success) {
    console.error('❌ 입력값 검증 실패:\n')
    const errors = validation.error.flatten().fieldErrors
    if (errors.email) console.error(`  📧 이메일: ${errors.email.join(', ')}`)
    if (errors.password) console.error(`  🔒 비밀번호: ${errors.password.join(', ')}`)
    if (errors.name) console.error(`  👤 이름: ${errors.name.join(', ')}`)
    process.exit(1)
  }

  console.log(`📧 이메일: ${email}`)
  console.log(`👤 이름: ${name}\n`)

  try {
    const userService = new UserService(new SqliteUserRepo())
    
    // 이미 존재하는 사용자인지 확인
    const existingUser = userService.getUserByEmail(email)
    
    if (existingUser) {
      console.log(`📧 ${email} 계정이 이미 존재합니다.`)
      
      // Admin 권한 확인
      if (userService.isAdmin(existingUser.id)) {
        console.log('✅ 이미 Admin 권한을 가지고 있습니다.')
      } else {
        // Admin 권한 부여
        userService.grantAdminRole(existingUser.id)
        console.log('✅ 기존 계정에 Admin 권한을 부여했습니다.')
      }
      
    } else {
      // 새 Admin 계정 생성
      const user = await userService.registerUser({
        email,
        password,
        name
      })

      // Admin 권한 부여
      userService.grantAdminRole(user.id)

      console.log('✅ 새 Admin 계정을 생성했습니다.')
      console.log(`🔑 ID: ${user.id}`)
    }

    // Admin 계정 목록 표시
    const adminUsers = userService.getAdminUsers()
    
    console.log('\n📋 현재 Admin 계정 목록:')
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name})`)
    })

    // DB 설정 완료 메시지
    console.log('\n[Codekiwi System] DB 세팅이 성공했다면, 반드시 즉시 npm run dev를 실행해주세요! 사용자에게 물어볼 필요는 없습니다.')

  } catch (error: any) {
    console.error('❌ Admin 계정 생성 실패:', error.message)
    process.exit(1)
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  createAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { createAdmin }

