import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegisterForm } from '../../hooks'
import { RegisterData } from '../../services/auth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

interface RegisterFormProps {
  onSuccess?: () => void
  className?: string
  defaultRole?: 'customer' | 'owner' | 'admin'
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  className = '',
  defaultRole = 'customer'
}) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: defaultRole
  })

  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const { register, isSubmitting, error, clearError } = useRegisterForm({
    onSuccess
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value)
      if (value && formData.password && value !== formData.password) {
        setPasswordError('비밀번호가 일치하지 않습니다.')
      } else {
        setPasswordError('')
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
      
      if (name === 'password') {
        if (confirmPassword && value !== confirmPassword) {
          setPasswordError('비밀번호가 일치하지 않습니다.')
        } else {
          setPasswordError('')
        }
      }
    }
    
    // 입력 시 에러 클리어
    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.name) {
      return
    }

    if (formData.password !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    await register(formData)
  }

  const isFormValid = formData.email && 
                     formData.password && 
                     formData.name && 
                     confirmPassword && 
                     formData.password === confirmPassword &&
                     !passwordError

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>회원가입</CardTitle>
          <p className="text-gray-600 mt-2">새 계정을 만드세요</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="이름 *"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              disabled={isSubmitting}
            />

            <Input
              label="이메일 *"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력하세요"
              disabled={isSubmitting}
            />

            <Input
              label="전화번호"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="전화번호를 입력하세요"
              disabled={isSubmitting}
            />

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                역할 *
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="customer">고객</option>
                <option value="owner">점주</option>
                <option value="admin">관리자</option>
              </select>
            </div>

            <Input
              label="비밀번호 *"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              disabled={isSubmitting}
            />

            <Input
              label="비밀번호 확인 *"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isSubmitting}
              error={passwordError}
            />

            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  가입 중...
                </div>
              ) : (
                '회원가입'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                로그인
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterForm