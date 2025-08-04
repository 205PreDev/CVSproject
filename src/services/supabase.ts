import { createClient } from '@supabase/supabase-js'

// Supabase 환경 변수 검증
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // JWT 자체 인증을 사용하므로 Supabase Auth는 비활성화
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  realtime: {
    // 실시간 알림을 위한 Realtime 활성화
    params: {
      eventsPerSecond: 10
    }
  }
})

// 데이터베이스 타입 정의
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          phone: string | null
          role: 'customer' | 'owner' | 'admin'
          is_active: boolean
          token_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name: string
          phone?: string | null
          role: 'customer' | 'owner' | 'admin'
          is_active?: boolean
          token_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          phone?: string | null
          role?: 'customer' | 'owner' | 'admin'
          is_active?: boolean
          token_version?: number
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          address: string
          phone: string | null
          business_hours: any | null
          location: any | null
          status: 'pending' | 'approved' | 'rejected' | 'suspended'
          business_license_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          address: string
          phone?: string | null
          business_hours?: any | null
          location?: any | null
          status?: 'pending' | 'approved' | 'rejected' | 'suspended'
          business_license_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          address?: string
          phone?: string | null
          business_hours?: any | null
          location?: any | null
          status?: 'pending' | 'approved' | 'rejected' | 'suspended'
          business_license_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          barcode: string | null
          brand: string | null
          unit: string
          base_price: number
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          barcode?: string | null
          brand?: string | null
          unit?: string
          base_price: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          barcode?: string | null
          brand?: string | null
          unit?: string
          base_price?: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          store_id: string
          product_id: string
          quantity: number
          min_quantity: number
          price: number | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          product_id: string
          quantity?: number
          min_quantity?: number
          price?: number | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          product_id?: string
          quantity?: number
          min_quantity?: number
          price?: number | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          store_id: string
          order_number: string
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          order_type: 'pickup' | 'delivery'
          total_amount: number
          discount_amount: number
          final_amount: number
          pickup_time: string | null
          delivery_address: string | null
          customer_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          store_id: string
          order_number: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          order_type: 'pickup' | 'delivery'
          total_amount: number
          discount_amount?: number
          final_amount: number
          pickup_time?: string | null
          delivery_address?: string | null
          customer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          store_id?: string
          order_number?: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          order_type?: 'pickup' | 'delivery'
          total_amount?: number
          discount_amount?: number
          final_amount?: number
          pickup_time?: string | null
          delivery_address?: string | null
          customer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          payment_key: string
          amount: number
          method: string
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          approved_at: string | null
          failure_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_key: string
          amount: number
          method: string
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          approved_at?: string | null
          failure_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_key?: string
          amount?: number
          method?: string
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          approved_at?: string | null
          failure_reason?: string | null
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          store_id: string
          name: string
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order_amount: number
          max_discount_amount: number | null
          valid_from: string
          valid_until: string
          usage_limit: number | null
          used_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order_amount?: number
          max_discount_amount?: number | null
          valid_from: string
          valid_until: string
          usage_limit?: number | null
          used_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          min_order_amount?: number
          max_discount_amount?: number | null
          valid_from?: string
          valid_until?: string
          usage_limit?: number | null
          used_count?: number
          is_active?: boolean
          created_at?: string
        }
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          order_id: string
          user_id: string
          discount_amount: number
          used_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          order_id: string
          user_id: string
          discount_amount: number
          used_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          order_id?: string
          user_id?: string
          discount_amount?: number
          used_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'order' | 'payment' | 'system' | 'promotion' | 'inventory'
          is_read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'order' | 'payment' | 'system' | 'promotion' | 'inventory'
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'order' | 'payment' | 'system' | 'promotion' | 'inventory'
          is_read?: boolean
          related_id?: string | null
          created_at?: string
        }
      }
      purchase_requests: {
        Row: {
          id: string
          store_id: string
          product_id: string
          requested_quantity: number
          current_quantity: number
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          notes: string | null
          requested_at: string
          processed_at: string | null
          expected_delivery_date: string | null
        }
        Insert: {
          id?: string
          store_id: string
          product_id: string
          requested_quantity: number
          current_quantity: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          notes?: string | null
          requested_at?: string
          processed_at?: string | null
          expected_delivery_date?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          product_id?: string
          requested_quantity?: number
          current_quantity?: number
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          notes?: string | null
          requested_at?: string
          processed_at?: string | null
          expected_delivery_date?: string | null
        }
      }
    }
  }
}

// 타입이 적용된 Supabase 클라이언트
export const typedSupabase = supabase as ReturnType<typeof createClient<Database>>