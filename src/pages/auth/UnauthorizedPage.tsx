import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard')
    } else if (user?.role === 'owner') {
      navigate('/owner/dashboard')
    } else {
      navigate('/customer/stores')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-6">
            이 페이지에 접근할 권한이 없습니다. 다른 계정으로 로그인하거나 관리자에게 문의하세요.
          </p>

          {user && (
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <p className="text-sm text-gray-700">
                현재 로그인: <span className="font-medium">{user.email}</span>
              </p>
              <p className="text-sm text-gray-700">
                역할: <span className="font-medium">
                  {user.role === 'customer' ? '고객' : 
                   user.role === 'owner' ? '점주' : '관리자'}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              이전 페이지로 돌아가기
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              홈으로 가기
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              다른 계정으로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage