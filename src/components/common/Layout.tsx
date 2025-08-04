import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showSidebar?: boolean
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showSidebar = true 
}) => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} />
      
      <div className="flex">
        {/* 사이드바 - 인증된 사용자만 표시 */}
        {isAuthenticated && showSidebar && <Sidebar />}
        
        {/* 메인 콘텐츠 */}
        <main className={`flex-1 ${isAuthenticated && showSidebar ? 'md:ml-64' : ''}`}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// 인증이 필요없는 페이지용 레이아웃
export const PublicLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ 
  children, 
  title 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

// 인증 페이지용 레이아웃 (사이드바 없음)
export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}

export default Layout