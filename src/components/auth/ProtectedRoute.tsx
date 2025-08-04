import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type UserRole = 'customer' | 'owner' | 'admin'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

/**
 * 권한 기반 라우트 보호 컴포넌트
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo,
  fallback
}) => {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate 
      to={redirectTo || '/auth/login'} 
      state={{ from: location }} 
      replace 
    />
  }

  // 특정 역할이 필요한 경우 권한 확인
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }

  // 허용된 역할 목록이 있는 경우 권한 확인
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // 모든 조건을 만족하면 자식 컴포넌트 렌더링
  return <>{children}</>
}

/**
 * 고객 전용 라우트
 */
export const CustomerRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute requiredRole="customer" fallback={fallback}>
    {children}
  </ProtectedRoute>
)

/**
 * 점주 전용 라우트
 */
export const OwnerRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute requiredRole="owner" fallback={fallback}>
    {children}
  </ProtectedRoute>
)

/**
 * 관리자 전용 라우트
 */
export const AdminRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute requiredRole="admin" fallback={fallback}>
    {children}
  </ProtectedRoute>
)

/**
 * 점주 또는 관리자 전용 라우트
 */
export const OwnerOrAdminRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute allowedRoles={['owner', 'admin']} fallback={fallback}>
    {children}
  </ProtectedRoute>
)

/**
 * 인증된 사용자만 접근 가능한 라우트 (역할 무관)
 */
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute fallback={fallback}>
    {children}
  </ProtectedRoute>
)

export default ProtectedRoute