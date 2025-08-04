import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LoginCredentials, RegisterData, AuthResponse } from '../services/auth'

interface UseAuthFormOptions {
  onSuccess?: (response: AuthResponse) => void
  onError?: (error: string) => void
}

/**
 * 인증 폼 관리 훅
 */
export const useAuthForm = (options: UseAuthFormOptions = {}) => {
  const { login, register } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { onSuccess, onError } = options

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      const response = await login(credentials)
      
      onSuccess?.(response)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (userData: RegisterData) => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      await register(userData)
      
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    handleLogin,
    handleRegister,
    isSubmitting,
    error,
    clearError
  }
}

/**
 * 로그인 폼 전용 훅
 */
export const useLoginForm = (options: UseAuthFormOptions = {}) => {
  const { handleLogin, isSubmitting, error, clearError } = useAuthForm(options)
  
  return {
    login: handleLogin,
    isSubmitting,
    error,
    clearError
  }
}

/**
 * 회원가입 폼 전용 훅
 */
export const useRegisterForm = (options: UseAuthFormOptions = {}) => {
  const { handleRegister, isSubmitting, error, clearError } = useAuthForm(options)
  
  return {
    register: handleRegister,
    isSubmitting,
    error,
    clearError
  }
}