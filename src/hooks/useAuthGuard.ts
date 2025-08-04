import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
type UserRole = 'customer' | 'owner' | 'admin'

interface UseAuthGuardOptions {
  requiredRole?: UserRole
  redirectTo?: string
  allowedRoles?: UserRole[]
}

/**
 * 인증 및 권한 가드 훅
 * 사용자가 로그인되어 있지 않거나 필요한 권한이 없으면 리다이렉트
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { user, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const {
    requiredRole,
    redirectTo = '/auth/login',
    allowedRoles
  } = options

  useEffect(() => {
    // 로딩 중이면 대기
    if (isLoading) return

    // 인증되지 않은 경우
    if (!isAuthenticated) {
      navigate(redirectTo)
      return
    }

    // 특정 역할이 필요한 경우
    if (requiredRole && user?.role !== requiredRole) {
      navigate('/unauthorized')
      return
    }

    // 허용된 역할 목록이 있는 경우
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      navigate('/unauthorized')
      return
    }
  }, [user, isLoading, isAuthenticated, requiredRole, allowedRoles, redirectTo, navigate])

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRequiredRole: requiredRole ? user?.role === requiredRole : true,
    hasAllowedRole: allowedRoles ? user && allowedRoles.includes(user.role) : true
  }
}

/**
 * 고객 전용 페이지 가드
 */
export const useCustomerGuard = (redirectTo?: string) => {
  return useAuthGuard({ requiredRole: 'customer', redirectTo })
}

/**
 * 점주 전용 페이지 가드
 */
export const useOwnerGuard = (redirectTo?: string) => {
  return useAuthGuard({ requiredRole: 'owner', redirectTo })
}

/**
 * 관리자 전용 페이지 가드
 */
export const useAdminGuard = (redirectTo?: string) => {
  return useAuthGuard({ requiredRole: 'admin', redirectTo })
}

/**
 * 점주 또는 관리자 권한 가드
 */
export const useOwnerOrAdminGuard = (redirectTo?: string) => {
  return useAuthGuard({ allowedRoles: ['owner', 'admin'], redirectTo })
}