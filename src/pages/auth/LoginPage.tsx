import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout, LoginForm } from '../../components/auth'
import { AuthResponse } from '../../services/auth'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()

  const handleLoginSuccess = (response: AuthResponse) => {
    const { user } = response
    // 역할에 따라 적절한 페이지로 리다이렉트
    if (user?.role === 'admin') {
      navigate('/admin/dashboard')
    } else if (user?.role === 'owner') {
      navigate('/owner/dashboard')
    } else {
      navigate('/customer/stores')
    }
  }

  return (
    <AuthLayout>
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthLayout>
  )
}

export default LoginPage