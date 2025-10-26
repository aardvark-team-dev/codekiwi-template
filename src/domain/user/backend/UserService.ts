/**
 * User Service
 * 
 * 사용자 비즈니스 로직 처리
 */

import bcrypt from 'bcrypt'
import { User, CreateUserData, UpdateUserData } from '../types'
import { IUserRepo } from './UserRepo.interface'

export class UserService {
  private repo: IUserRepo

  constructor(ur: IUserRepo) {
    this.repo = ur
  }

  /**
   * ID로 사용자 조회
   */
  getUserById(id: string): User | null {
    return this.repo.findById(id)
  }

  /**
   * 이메일로 사용자 조회
   */
  getUserByEmail(email: string): User | null {
    return this.repo.findByEmail(email)
  }

  /**
   * 모든 사용자 조회
   */
  getAllUsers(): User[] {
    return this.repo.findAll()
  }

  /**
   * 관리자 사용자만 조회
   */
  getAdminUsers(): User[] {
    return this.repo.findAdmins()
  }

  /**
   * 새 사용자 등록
   */
  async registerUser(data: CreateUserData): Promise<User> {
    // 이메일 중복 확인
    const existingUser = this.repo.findByEmail(data.email)
    if (existingUser) {
      throw new Error('이미 사용중인 이메일입니다.')
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // 사용자 생성
    return this.repo.create({
      ...data,
      password: hashedPassword,
    })
  }

  /**
   * 사용자 정보 업데이트
   */
  updateUser(id: string, data: UpdateUserData): User | null {
    return this.repo.update(id, data)
  }

  /**
   * 사용자 삭제
   */
  deleteUser(id: string): boolean {
    return this.repo.delete(id)
  }

  /**
   * 비밀번호 검증
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  /**
   * 사용자가 관리자인지 확인
   */
  isAdmin(userId: string): boolean {
    return this.repo.isAdmin(userId)
  }

  /**
   * 사용자를 관리자로 승격
   */
  grantAdminRole(userId: string): boolean {
    return this.repo.grantAdminRole(userId)
  }

  /**
   * 사용자의 관리자 권한 해제
   */
  revokeAdminRole(userId: string): boolean {
    return this.repo.revokeAdminRole(userId)
  }
}

