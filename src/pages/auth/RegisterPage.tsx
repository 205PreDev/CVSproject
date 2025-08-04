import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout, RegisterForm } from '../../components/auth'
import { useAuth } from '../../context/AuthContext'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleRegisterSuccess = () => {
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
      <RegisterForm onSuccess={handleRegisterSuccess} />
    </AuthLayout>
  )
}

export default RegisterPage