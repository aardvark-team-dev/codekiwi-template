/**
 * User Repository Interface
 * 
 * 사용자 데이터 접근을 위한 인터페이스
 */

import { User, CreateUserData, UpdateUserData } from '../types'

export interface IUserRepo {
  /**
   * ID로 사용자 조회
   */
  findById(id: string): User | null

  /**
   * 이메일로 사용자 조회
   */
  findByEmail(email: string): User | null

  /**
   * 모든 사용자 조회
   */
  findAll(): User[]

  /**
   * 관리자 사용자만 조회
   */
  findAdmins(): User[]

  /**
   * 사용자가 관리자인지 확인
   */
  isAdmin(userId: string): boolean

  /**
   * 새 사용자 생성
   */
  create(data: CreateUserData): User

  /**
   * 사용자 정보 업데이트
   */
  update(id: string, data: UpdateUserData): User | null

  /**
   * 사용자를 관리자로 승격
   */
  grantAdminRole(userId: string): boolean

  /**
   * 사용자의 관리자 권한 해제
   */
  revokeAdminRole(userId: string): boolean

  /**
   * 사용자 삭제
   */
  delete(id: string): boolean
}

