import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { AuthService } from '../services/auth'

interface UseTokenRefreshOptions {
  refreshInterval?: number // 분 단위
}

/**
 * 토큰 자동 갱신 및 만료 관리 훅
 */
export const useTokenRefresh = (options: UseTokenRefreshOptions = {}) => {
  const { user, logout, refreshUser } = useAuth()
  const {
    refreshInterval = 30 // 30분마다 체크
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const checkTokenStatus = useCallback(async () => {
    const token = AuthService.getStoredToken()
    
    if (!token || !user) {
      return
    }

    try {
      // 토큰이 만료되었는지 확인
      if (AuthService.isTokenExpired(token)) {
        console.warn('Token expired, logging out')
        logout()
        return
      }

      // 토큰 만료 임박 확인
      const decoded = AuthService.verifyToken(token)
      if (decoded) {
        // 현재 사용자 정보 새로고침
        await refreshUser()
      }
    } catch (error) {
      console.error('Token refresh check failed:', error)
      logout()
    }
  }, [user, logout, refreshUser])

  // 주기적 토큰 상태 확인
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // 즉시 한 번 체크
    checkTokenStatus()

    // 주기적 체크 설정
    intervalRef.current = setInterval(checkTokenStatus, refreshInterval * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user, checkTokenStatus, refreshInterval])

  // 페이지 포커스 시 토큰 상태 확인
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        checkTokenStatus()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, checkTokenStatus])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    checkTokenStatus,
    isTokenValid: user ? AuthService.isValidToken(AuthService.getStoredToken() || '') : false
  }
}