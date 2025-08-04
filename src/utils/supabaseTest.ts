import { supabase } from '../services/supabase'

/**
 * Supabase 연결 테스트 함수
 * 데이터베이스 연결 상태를 확인합니다.
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // 간단한 쿼리로 연결 테스트
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return false
    }
    
    console.log('Supabase connection successful!')
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}

/**
 * 환경 변수 검증 함수
 */
export const validateEnvironmentVariables = (): boolean => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars)
    return false
  }
  
  console.log('All required environment variables are present')
  return true
}