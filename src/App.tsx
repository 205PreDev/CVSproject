import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NotificationProvider } from './context/NotificationContext'
import { validateEnvironmentVariables } from './utils/supabaseTest'
import Router from './router'

function App() {
  // 환경 변수 검증
  if (!validateEnvironmentVariables()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">설정 오류</h1>
          <p className="text-gray-600 mb-4">
            환경 변수가 올바르게 설정되지 않았습니다.
          </p>
          <p className="text-sm text-gray-500">
            .env 파일을 확인하고 필요한 환경 변수를 설정해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <Router />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App