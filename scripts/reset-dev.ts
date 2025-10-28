#!/usr/bin/env tsx
/**
 * 개발 환경 데이터베이스 완전 리셋 스크립트
 * 
 * 데이터베이스 파일을 삭제하고 재생성한 후 시드 데이터를 넣습니다.
 * 
 * 사용법:
 * npm run db:reset
 * 또는
 * npx tsx scripts/reset-dev.ts
 */

import fs from 'fs'
import path from 'path'
import { seedDatabase } from './seed-dev'
import * as clearNextServerProcess from './clear-next-server-process.js'

const clearNextServer = clearNextServerProcess.main

async function resetDatabase() {
  // Next.js 서버 프로세스 정리
  try {
    await clearNextServer()
  } catch (error: any) {
    console.warn('⚠️ Next.js 프로세스 정리 실패:', error.message)
  }

  console.log('🔄 데이터베이스 완전 리셋 시작...\n')

  try {
    // 환경별 SQLite 디렉토리
    const sqliteDir = process.env.NODE_ENV === 'production' 
      ? (process.env.SQLITE_DIR_PROD || '.sqlite')
      : (process.env.SQLITE_DIR_DEV || '.sqlite-dev')
    
    const dbPath = path.join(process.cwd(), sqliteDir, 'codekiwi.db')
    const dbDir = path.dirname(dbPath)

    console.log(`📁 데이터베이스 경로: ${dbPath}`)

    // 데이터베이스 파일 삭제
    if (fs.existsSync(dbPath)) {
      console.log('🗑️  기존 데이터베이스 파일 삭제 중...')
      fs.unlinkSync(dbPath)
      console.log('   ✅ 삭제 완료')
    } else {
      console.log('   ℹ️  기존 데이터베이스 파일 없음')
    }

    // WAL 파일 삭제 (있다면)
    const walPath = `${dbPath}-wal`
    const shmPath = `${dbPath}-shm`
    
    if (fs.existsSync(walPath)) {
      fs.unlinkSync(walPath)
      console.log('   ✅ WAL 파일 삭제 완료')
    }
    
    if (fs.existsSync(shmPath)) {
      fs.unlinkSync(shmPath)
      console.log('   ✅ SHM 파일 삭제 완료')
    }

    // 디렉토리 생성 (없으면)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
      console.log(`   ✅ 디렉토리 생성: ${dbDir}`)
    }

    console.log('\n🌱 새로운 데이터베이스에 시드 데이터 추가 중...\n')
    
    // 시드 실행
    await seedDatabase()

    console.log('\n✅ 데이터베이스 리셋 완료!')
    console.log('\n[Codekiwi System] DB 세팅이 성공했다면, 반드시 즉시 npm run dev를 실행해주세요! 사용자에게 물어볼 필요는 없습니다.')

  } catch (error: any) {
    console.error('\n❌ 데이터베이스 리셋 실패:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { resetDatabase }

