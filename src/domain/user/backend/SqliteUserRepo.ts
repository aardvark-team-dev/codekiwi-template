/**
 * User Repository Implementation
 * 
 * SQLite를 사용한 사용자 데이터 접근 구현
 */

import { getDatabase } from '@/lib/shared/database/sqlite'
import { User, CreateUserData, UpdateUserData } from '../types'
import { IUserRepo } from './UserRepo.interface'

/**
 * SQLite users 테이블의 row 타입
 */
interface UserRow {
  id: string
  email: string
  password: string | null
  name: string | null
  created_at: string
  updated_at: string
}

export class SqliteUserRepo implements IUserRepo {
  private db = getDatabase()

  /**
   * DB row를 User 엔티티로 변환
   */
  private rowToUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  findById(id: string): User | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserRow | undefined
    
    return row ? this.rowToUser(row) : null
  }

  findByEmail(email: string): User | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as UserRow | undefined
    
    return row ? this.rowToUser(row) : null
  }

  findAll(): User[] {
    const rows = this.db
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all() as UserRow[]
    
    return rows.map(row => this.rowToUser(row))
  }

  findAdmins(): User[] {
    const rows = this.db
      .prepare(`
        SELECT u.* 
        FROM users u
        INNER JOIN admins a ON u.id = a.user_id
        ORDER BY u.created_at DESC
      `)
      .all() as UserRow[]
    
    return rows.map(row => this.rowToUser(row))
  }

  isAdmin(userId: string): boolean {
    const row = this.db
      .prepare('SELECT user_id FROM admins WHERE user_id = ?')
      .get(userId)
    
    return row !== undefined
  }

  create(data: CreateUserData): User {
    const stmt = this.db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    )
    
    stmt.run(
      data.email,
      data.password,
      data.name ?? null
    )

    // 이메일로 새로 생성된 사용자 조회
    const newUser = this.findByEmail(data.email)
    if (!newUser) {
      throw new Error('사용자 생성 후 조회 실패')
    }

    return newUser
  }

  update(id: string, data: UpdateUserData): User | null {
    const updates: string[] = []
    const values: (string | null)[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = this.db.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    )
    
    stmt.run(...values)

    return this.findById(id)
  }

  grantAdminRole(userId: string): boolean {
    try {
      const stmt = this.db.prepare(
        'INSERT OR IGNORE INTO admins (user_id) VALUES (?)'
      )
      const result = stmt.run(userId)
      return result.changes > 0
    } catch {
      return false
    }
  }

  revokeAdminRole(userId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM admins WHERE user_id = ?')
    const result = stmt.run(userId)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    
    return result.changes > 0
  }
}

