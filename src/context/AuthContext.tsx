import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthService, User, LoginCredentials, RegisterData, AuthResponse } from '../services/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 자동 로그인 시도
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const storedToken = AuthService.getStoredToken()
        
        if (storedToken && await AuthService.isValidToken(storedToken)) {
          const currentUser = await AuthService.autoLogin()
          if (currentUser) {
            setUser(currentUser)
          } else {
            // 토큰이 유효하지 않으면 제거
            AuthService.logout()
          }
        }
      } catch (error) {
        console.error('Auto login failed:', error)
        AuthService.logout()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // 토큰 만료 체크 (5분마다)
  useEffect(() => {
    const checkTokenExpiry = async () => {
      const token = AuthService.getStoredToken()
      if (token && await AuthService.isTokenExpired(token)) {
        logout()
      }
    }

    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000) // 5분마다 체크
    return () => clearInterval(interval)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true)
      const response: AuthResponse = await AuthService.login(credentials)
      
      // 토큰 저장
      AuthService.saveToken(response.token)
      
      // 사용자 상태 업데이트
      setUser(response.user)
      
      return response
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true)
      const response: AuthResponse = await AuthService.register(userData)
      
      // 토큰 저장
      AuthService.saveToken(response.token)
      
      // 사용자 상태 업데이트
      setUser(response.user)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = (): void => {
    AuthService.logout()
    setUser(null)
  }

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      logout()
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext