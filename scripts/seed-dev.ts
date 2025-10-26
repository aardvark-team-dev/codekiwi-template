#!/usr/bin/env tsx
/**
 * 개발 환경 데이터베이스 시드 스크립트
 * 
 * DB를 삭제하거나 초기화한 후 테스트 데이터를 생성합니다.
 * 
 * 사용법:
 * npm run db:seed
 * 또는
 * npx tsx scripts/seed-dev.ts
 */

import { UserService } from '../src/domain/user/backend/UserService'
import { getDatabase } from '../src/lib/shared/database/sqlite'
import { SqliteUserRepo } from '../src/domain/user/backend/SqliteUserRepo'

interface SeedUser {
  email: string
  password: string
  name: string
  isAdmin?: boolean
}

// 테스트용 시드 데이터
const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: '0000',
    name: '관리자',
    isAdmin: true
  },
  {
    email: 'test@example.com',
    password: '0000',
    name: '테스트 유저',
    isAdmin: false
  }
]

async function seedDatabase() {
  console.log('🌱 데이터베이스 시드 시작...\n')

  try {
    // getDatabase()를 호출하면 테이블이 자동으로 생성됨
    const db = getDatabase()
    
    console.log('📊 현재 데이터 확인...')
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
    console.log(`   기존 사용자: ${existingUsers.count}명\n`)

    const userService = new UserService(new SqliteUserRepo())

    // 시드 유저 생성
    console.log('👤 테스트 사용자 생성 중...')
    for (const seedUser of SEED_USERS) {
      try {
        // 이미 존재하는지 확인
        const existing = userService.getUserByEmail(seedUser.email)
        
        if (existing) {
          console.log(`   ⏭️  ${seedUser.email} - 이미 존재 (건너뜀)`)
          
          // 관리자 권한 확인 및 부여
          if (seedUser.isAdmin && !userService.isAdmin(existing.id)) {
            userService.grantAdminRole(existing.id)
            console.log(`      👑 관리자 권한 부여됨`)
          }
          continue
        }

        // 새 사용자 생성
        const user = await userService.registerUser({
          email: seedUser.email,
          password: seedUser.password,
          name: seedUser.name
        })

        console.log(`   ✅ ${seedUser.email} - 생성 완료 (ID: ${user.id})`)

        // 관리자 권한 부여
        if (seedUser.isAdmin) {
          userService.grantAdminRole(user.id)
          console.log(`      👑 관리자 권한 부여됨`)
        }

      } catch (error: any) {
        console.error(`   ❌ ${seedUser.email} - 실패:`, error.message)
      }
    }

    console.log('\n📊 최종 데이터 확인...')
    const finalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any
    const admins = db.prepare('SELECT COUNT(*) as count FROM admins').get() as any
    console.log(`   전체 사용자: ${finalUsers.count}명`)
    console.log(`   관리자: ${admins.count}명`)

    console.log('\n✅ 데이터베이스 시드 완료!')
    console.log('\n🔐 테스트 계정:')
    SEED_USERS.forEach(u => {
      console.log(`   ${u.isAdmin ? '👑 관리자' : '👤 일반'}: ${u.email} / ${u.password}`)
    })

  } catch (error: any) {
    console.error('\n❌ 데이터베이스 시드 실패:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedDatabase }

