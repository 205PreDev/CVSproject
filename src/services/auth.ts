import { supabase } from './supabase'
import * as jose from 'jose'
import bcrypt from 'bcryptjs/dist/bcrypt'

// JWT 시크릿 키 (실제 운영에서는 환경 변수로 관리)
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production'
const TOKEN_EXPIRY = '24h'
const TOKEN_STORAGE_KEY = 'auth_token'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'customer' | 'owner' | 'admin'
  isActive: boolean
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
  role: 'customer' | 'owner' | 'admin'
}

export interface TokenPayload {
  user_id: string
  email: string
  role: 'customer' | 'owner' | 'admin'
  token_version: number
  iat?: number
  exp?: number
}

/**
 * 인증 서비스 클래스
 * JWT 기반 자체 인증 시스템
 */
export class AuthService {
  /**
   * JWT 토큰을 Supabase 클라이언트에 설정
   */
  private static setSupabaseAuth(token: string) {
    // 개발 단계에서는 JWT 토큰 설정을 건너뜁니다
    // 프로덕션에서는 적절한 JWT 시크릿 설정이 필요합니다
    console.log('JWT token set for user authentication:', token.substring(0, 20) + '...')
  }

  /**
   * 사용자 로그인
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // 사용자 조회
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
      }

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)
      if (!isPasswordValid) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
      }

      // JWT 토큰 생성 (jose 사용)
      const secret = new TextEncoder().encode(JWT_SECRET)
      const token = await new jose.SignJWT({
        sub: user.id, // Supabase 표준 필드
        user_id: user.id,
        email: user.email,
        role: user.role,
        token_version: user.token_version,
        aud: 'authenticated', // Supabase 표준 필드
        iss: 'ourgs-app' // 발급자
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret)

      // Supabase 클라이언트에 토큰 설정
      this.setSupabaseAuth(token)

      // 사용자 정보 반환
      const userResponse: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active
      }

      return { user: userResponse, token }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '로그인에 실패했습니다.')
    }
  }

  /**
   * 사용자 회원가입
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // 이메일 중복 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        throw new Error('이미 사용 중인 이메일입니다.')
      }

      // 비밀번호 해시화
      const passwordHash = await bcrypt.hash(userData.password, 10)

      // 사용자 생성
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          phone: userData.phone,
          role: userData.role
        })
        .select()
        .single()

      if (error || !user) {
        throw new Error('회원가입에 실패했습니다.')
      }

      // JWT 토큰 생성 (jose 사용)
      const secret = new TextEncoder().encode(JWT_SECRET)
      const token = await new jose.SignJWT({
        sub: user.id, // Supabase 표준 필드
        user_id: user.id,
        email: user.email,
        role: user.role,
        token_version: user.token_version,
        aud: 'authenticated', // Supabase 표준 필드
        iss: 'ourgs-app' // 발급자
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret)

      // Supabase 클라이언트에 토큰 설정
      this.setSupabaseAuth(token)

      // 사용자 정보 반환
      const userResponse: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active
      }

      return { user: userResponse, token }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '회원가입에 실패했습니다.')
    }
  }

  /**
   * JWT 토큰 검증
   */
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jose.jwtVerify(token, secret)

      // 토큰에서 사용자 ID를 가져와서 데이터베이스에서 최신 정보 조회
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.user_id as string)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        return null
      }

      // JWT 무효화 관리: 토큰 버전 확인
      const tokenVersion = payload.token_version as number
      if (tokenVersion !== user.token_version) {
        console.warn('Token version mismatch. Token may have been invalidated.')
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 저장된 토큰으로 자동 로그인
   */
  static async autoLogin(): Promise<User | null> {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!token) return null

      const user = await this.verifyToken(token)
      if (!user) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        return null
      }

      // Supabase 클라이언트에 토큰 설정
      this.setSupabaseAuth(token)

      return user
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      return null
    }
  }

  /**
   * 로그아웃
   */
  static logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    // Supabase 세션 클리어
    supabase.auth.signOut()
  }

  /**
   * 토큰 저장
   */
  static saveToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }

  /**
   * 현재 사용자 정보 조회
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!token) return null

      const decoded = await this.verifyToken(token)
      if (!decoded) return null

      // 데이터베이스에서 최신 사용자 정보 조회
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .eq('is_active', true)
        .single()

      if (error || !user) return null

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 토큰 만료 확인
   */
  static async isTokenExpired(token: string): Promise<boolean> {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jose.jwtVerify(token, secret)

      if (!payload.exp) return true

      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch (error) {
      return true
    }
  }

  /**
   * 저장된 토큰 가져오기
   */
  static getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }

  /**
   * 토큰 유효성 검사 (만료 시간 포함)
   */
  static async isValidToken(token: string): Promise<boolean> {
    if (!token) return false

    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jose.jwtVerify(token, secret)
      return !!payload && !(await this.isTokenExpired(token))
    } catch (error) {
      return false
    }
  }

  /**
   * 사용자 역할 확인
   */
  static async hasRole(requiredRole: 'customer' | 'owner' | 'admin'): Promise<boolean> {
    try {
      const token = this.getStoredToken()
      if (!token) return false

      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jose.jwtVerify(token, secret)
      return payload.role === requiredRole
    } catch (error) {
      return false
    }
  }

  /**
   * 관리자 권한 확인
   */
  static async isAdmin(): Promise<boolean> {
    return await this.hasRole('admin')
  }

  /**
   * 점주 권한 확인
   */
  static async isOwner(): Promise<boolean> {
    return await this.hasRole('owner')
  }

  /**
   * 고객 권한 확인
   */
  static async isCustomer(): Promise<boolean> {
    return await this.hasRole('customer')
  }

  /**
   * JWT 토큰 무효화 (보안상 이유로 모든 토큰 무효화)
   * 사용 사례: 비밀번호 변경, 계정 보안 침해 의심, 강제 로그아웃 등
   */
  static async invalidateAllTokens(userId: string): Promise<boolean> {
    try {
      // 사용자의 token_version을 1 증가시켜 기존 토큰들을 무효화
      const { error } = await supabase
        .from('users')
        .update({ 
          token_version: supabase.raw('token_version + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Failed to invalidate tokens:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error invalidating tokens:', error)
      return false
    }
  }

  /**
   * 현재 사용자의 모든 토큰 무효화 (자신의 토큰 무효화)
   */
  static async invalidateMyTokens(): Promise<boolean> {
    try {
      const token = this.getStoredToken()
      if (!token) return false

      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jose.jwtVerify(token, secret)
      const userId = payload.user_id as string

      const success = await this.invalidateAllTokens(userId)
      
      if (success) {
        // 현재 저장된 토큰도 제거
        this.logout()
      }

      return success
    } catch (error) {
      console.error('Error invalidating my tokens:', error)
      return false
    }
  }

  /**
   * 관리자가 특정 사용자의 모든 토큰 무효화
   */
  static async adminInvalidateUserTokens(targetUserId: string): Promise<boolean> {
    try {
      // 관리자 권한 확인
      const isAdmin = await this.isAdmin()
      if (!isAdmin) {
        throw new Error('관리자 권한이 필요합니다.')
      }

      return await this.invalidateAllTokens(targetUserId)
    } catch (error) {
      console.error('Error invalidating user tokens:', error)
      return false
    }
  }

  /**
   * 비밀번호 변경 시 토큰 무효화
   */
  static async changePasswordAndInvalidateTokens(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<boolean> {
    try {
      // 현재 비밀번호 확인
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        throw new Error('사용자를 찾을 수 없습니다.')
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isCurrentPasswordValid) {
        throw new Error('현재 비밀번호가 올바르지 않습니다.')
      }

      // 새 비밀번호 해시화
      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      // 비밀번호 변경과 동시에 토큰 버전 증가
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: newPasswordHash,
          token_version: supabase.raw('token_version + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw new Error('비밀번호 변경에 실패했습니다.')
      }

      // 현재 저장된 토큰 제거 (사용자가 다시 로그인해야 함)
      this.logout()

      return true
    } catch (error) {
      console.error('Error changing password:', error)
      return false
    }
  }
}

export default AuthService