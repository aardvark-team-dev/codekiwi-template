/**
 * SQLite Database Connection
 * 
 * Better-sqlite3를 사용한 데이터베이스 연결 및 초기화
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

/**
 * 데이터베이스 연결 싱글톤
 */
export function getDatabase(): Database.Database {
  if (db) {
    return db
  }

  // 환경별 SQLite 디렉토리 지정
  const sqliteDir = process.env.NODE_ENV === 'production' 
    ? (process.env.SQLITE_DIR_PROD || '.sqlite')
    : (process.env.SQLITE_DIR_DEV || '.sqlite-dev')
  
  const dbPath = path.join(process.cwd(), sqliteDir, 'codekiwi.db')

  // 데이터베이스 디렉토리가 존재하지 않으면 생성
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
    console.log(`📁 Created database directory: ${dbDir}`)
  }

  db = new Database(dbPath)
  
  // WAL 모드 활성화 (성능 향상)
  db.pragma('journal_mode = WAL')
  
  // 외래 키 제약 조건 활성화
  db.pragma('foreign_keys = ON')

  // 테이블 초기화
  initializeTables(db)

  console.log(`✅ SQLite database connected: ${dbPath}`)
  
  return db
}

/**
 * 테이블 초기화
 */
function initializeTables(database: Database.Database) {
  // Users 테이블 생성 - Auth.js 호환, 스키마 고정, 절대 변경 금지
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Admins 테이블 - 관리자 권한 관리
  const createAdminsTable = `
    CREATE TABLE IF NOT EXISTS admins (
      user_id TEXT PRIMARY KEY,
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `

  // 인덱스 생성
  const createUsersIndexes = [
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)'
  ]

  try {
    database.exec(createUsersTable)
    database.exec(createAdminsTable)
    
    createUsersIndexes.forEach(sql => database.exec(sql))

    console.log('✅ Database tables initialized')
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error)
    throw error
  }
}

/**
 * 데이터베이스 연결 종료
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('✅ Database connection closed')
  }
}

// 프로세스 종료 시 데이터베이스 연결 정리
process.on('exit', closeDatabase)
process.on('SIGINT', closeDatabase)
process.on('SIGTERM', closeDatabase)