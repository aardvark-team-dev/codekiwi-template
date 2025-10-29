/**
 * User Domain Types
 * 
 * 사용자 관리 도메인
 */

/**
 * User Entity - SQLite에 저장되는 사용자 정보
 * 스키마 고정 - 절대 변경 금지
 */
export interface User {
  id: string                    // UUID (Primary Key)
  email: string                // 이메일 (UNIQUE)
  password?: string | null       // 비밀번호 (해시됨)
  name: string | null          // 사용자 이름
  createdAt: Date
  updatedAt: Date
}

/**
 * Admin Entity - 관리자 권한 정보
 */
export interface Admin {
  userId: string               // User ID (Foreign Key)
  grantedAt: Date             // 권한 부여 시간
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * 새 사용자 생성 데이터
 */
export interface CreateUserData {
  email: string
  password: string
  name?: string | null
}

/**
 * 사용자 정보 업데이트 데이터
 */
export interface UpdateUserData {
  name?: string | null
}

// ============================================================================
// Session & Auth Types
// ============================================================================

/**
 * 세션용 사용자 정보
 * - password 제외
 * - Date를 string으로 직렬화
 * - isAdmin 추가
 */
export interface SessionUser extends Omit<User, 'password' | 'createdAt' | 'updatedAt'> {
  createdAt: string  // ISO 8601 string
  updatedAt: string  // ISO 8601 string
  isAdmin: boolean
  emailVerified: Date | null  // NextAuth AdapterUser 호환성을 위해 필요
}

/**
 * User를 SessionUser로 변환하는 헬퍼 함수
 */
export function toSessionUser(user: User, isAdmin: boolean): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    isAdmin,
    emailVerified: null,  // Credentials provider는 이메일 인증을 사용하지 않음
  }
}

