import { supabase } from './supabase'

/**
 * 기본 데이터베이스 서비스 클래스
 * 모든 데이터베이스 작업의 기본 기능을 제공합니다.
 */
export class DatabaseService {
  /**
   * 테이블에서 모든 레코드 조회
   */
  static async findAll<T>(tableName: string, select = '*'): Promise<T[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select(select)
    
    if (error) {
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`)
    }
    
    return (data as T[]) || []
  }

  /**
   * ID로 단일 레코드 조회
   */
  static async findById<T>(tableName: string, id: string, select = '*'): Promise<T | null> {
    const { data, error } = await supabase
      .from(tableName)
      .select(select)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // 레코드가 없음
      }
      throw new Error(`Failed to fetch ${tableName} by id: ${error.message}`)
    }
    
    return data as T
  }

  /**
   * 새 레코드 생성
   */
  static async create<T>(tableName: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create ${tableName}: ${error.message}`)
    }
    
    return result
  }

  /**
   * 레코드 업데이트
   */
  static async update<T>(tableName: string, id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update ${tableName}: ${error.message}`)
    }
    
    return result
  }

  /**
   * 레코드 삭제
   */
  static async delete(tableName: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete ${tableName}: ${error.message}`)
    }
  }

  /**
   * 조건부 조회
   */
  static async findWhere<T>(
    tableName: string, 
    column: string, 
    value: any, 
    select = '*'
  ): Promise<T[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select(select)
      .eq(column, value)
    
    if (error) {
      throw new Error(`Failed to fetch ${tableName} where ${column}=${value}: ${error.message}`)
    }
    
    return (data as T[]) || []
  }

  /**
   * 특정 가게의 상품 목록 조회 (재고 포함)
   */
  static async getProductsByStore(storeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        quantity,
        products (*)
      `)
      .eq('store_id', storeId);

    if (error) {
      throw new Error(`Failed to fetch products for store ${storeId}: ${error.message}`);
    }

    // 재고 정보와 상품 정보를 함께 반환
    return data.map(item => ({ ...item.products, quantity: item.quantity })).filter(p => p.id !== null);
  }
  /**
   * 주문 생성 (RPC 호출)
   */
  static async createOrder(customerId: string, storeId: string, items: any[], discountAmount: number, finalAmount: number): Promise<any> {
    const { data, error } = await supabase.rpc('create_order', {
      p_customer_id: customerId,
      p_store_id: storeId,
      p_order_items: items,
      p_discount_amount: discountAmount,
      p_final_amount: finalAmount
    });

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data;
  }

  /**
   * 사용 가능한 쿠폰 조회
   */
  static async getAvailableCoupons(storeId?: string): Promise<any[]> {
    let query = supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString())
      .gte('valid_until', new Date().toISOString());

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch available coupons: ${error.message}`);
    }

    return data;
  }

  /**
   * 특정 고객의 주문 목록 조회
   */
  static async getOrdersByCustomerId(customerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*,
          products (*)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders for customer ${customerId}: ${error.message}`);
    }

    return data;
  }
}

export default DatabaseService;