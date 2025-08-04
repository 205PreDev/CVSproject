# Row Level Security (RLS) 정책 문서

## 개요

우리동네 GS 편의점 솔루션은 JWT 기반 자체 인증 시스템을 사용하며, Supabase의 Row Level Security(RLS)를 통해 데이터 접근을 제어합니다.

## 인증 시스템

### JWT 토큰 구조
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "customer|owner|admin",
  "token_version": 0,
  "exp": 1234567890
}
```

### 역할별 권한
- **customer**: 고객 - 본인 데이터와 공개된 편의점/상품 정보만 접근
- **owner**: 점주 - 본인 편의점과 관련된 모든 데이터 접근
- **admin**: 관리자 - 모든 데이터 접근 가능

## RLS 정책 상세

### 1. users 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_users_all | admin | 모든 작업 | 관리자는 모든 사용자 관리 가능 |
| users_own_data | all | 본인 데이터만 | 사용자는 본인 정보만 조회/수정 |
| users_insert_signup | anonymous | INSERT만 | 회원가입 허용 |

### 2. stores 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_stores_all | admin | 모든 작업 | 관리자는 모든 편의점 관리 |
| owners_own_stores | owner | 본인 편의점만 | 점주는 본인 편의점만 관리 |
| customers_approved_stores | customer | 승인된 편의점만 조회 | 고객은 승인된 편의점만 조회 |
| owners_insert_stores | owner | INSERT만 | 점주는 편의점 등록 가능 |

### 3. products 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_products_all | admin | 모든 작업 | 관리자는 모든 상품 관리 |
| users_active_products | owner, customer | 활성화된 상품만 조회 | 활성화된 상품만 조회 가능 |

### 4. inventory 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_inventory_all | admin | 모든 작업 | 관리자는 모든 재고 관리 |
| owners_own_inventory | owner | 본인 편의점 재고만 | 점주는 본인 편의점 재고만 관리 |
| customers_approved_inventory | customer | 승인된 편의점의 재고만 조회 | 고객은 구매 가능한 재고만 조회 |

### 5. orders 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_orders_all | admin | 모든 작업 | 관리자는 모든 주문 관리 |
| customers_own_orders | customer | 본인 주문만 | 고객은 본인 주문만 조회/생성 |
| owners_store_orders | owner | 본인 편의점 주문만 | 점주는 본인 편의점 주문만 관리 |

### 6. order_items 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_order_items_all | admin | 모든 작업 | 관리자는 모든 주문 상품 조회 |
| customers_own_order_items | customer | 본인 주문 상품만 조회 | 고객은 본인 주문 상품만 조회 |
| owners_store_order_items | owner | 본인 편의점 주문 상품만 조회 | 점주는 본인 편의점 주문 상품만 조회 |
| order_items_insert | all | 주문 생성시 | 주문 생성시 주문 상품 추가 허용 |

### 7. payments 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_payments_all | admin | 모든 작업 | 관리자는 모든 결제 조회 |
| customers_own_payments | customer | 본인 결제만 조회 | 고객은 본인 결제만 조회 |
| owners_store_payments | owner | 본인 편의점 결제만 조회 | 점주는 본인 편의점 결제만 조회 |
| payments_insert | customer | INSERT만 | 고객은 결제 생성 가능 |

### 8. coupons 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_coupons_all | admin | 모든 작업 | 관리자는 모든 쿠폰 관리 |
| owners_own_coupons | owner | 본인 편의점 쿠폰만 | 점주는 본인 편의점 쿠폰만 관리 |
| customers_active_coupons | customer | 활성화된 쿠폰만 조회 | 고객은 사용 가능한 쿠폰만 조회 |

### 9. coupon_usages 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_coupon_usages_all | admin | 모든 작업 | 관리자는 모든 쿠폰 사용 내역 조회 |
| customers_own_coupon_usages | customer | 본인 사용 내역만 조회 | 고객은 본인 쿠폰 사용 내역만 조회 |
| owners_store_coupon_usages | owner | 본인 편의점 쿠폰 사용 내역만 | 점주는 본인 편의점 쿠폰 사용 내역만 조회 |
| coupon_usages_insert | customer | INSERT만 | 쿠폰 사용 내역 생성 허용 |

### 10. notifications 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_notifications_all | admin | 모든 작업 | 관리자는 모든 알림 관리 |
| users_own_notifications | all | 본인 알림만 | 사용자는 본인 알림만 조회/수정 |
| notifications_insert | system | INSERT만 | 시스템에서 알림 생성 허용 |

### 11. purchase_requests 테이블
| 정책명 | 대상 | 조건 | 설명 |
|--------|------|------|------|
| admin_purchase_requests_all | admin | 모든 작업 | 관리자는 모든 발주 요청 관리 |
| owners_own_purchase_requests | owner | 본인 편의점 발주 요청만 | 점주는 본인 편의점 발주 요청만 관리 |

## 보안 함수

### auth.user_id()
현재 JWT 토큰에서 사용자 ID를 추출합니다.

```sql
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'user_id',
    current_setting('request.jwt.claims', true)::json->>'sub'
  )::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### auth.user_role()
현재 JWT 토큰에서 사용자 역할을 추출합니다.

```sql
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'anonymous'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'anonymous';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 사용 예시

### 1. 고객이 편의점 목록 조회
```typescript
// 고객 토큰으로 인증된 상태에서
const { data: stores } = await supabase
  .from('stores')
  .select('*')
// RLS에 의해 승인된 편의점만 반환됨
```

### 2. 점주가 본인 편의점 주문 조회
```typescript
// 점주 토큰으로 인증된 상태에서
const { data: orders } = await supabase
  .from('orders')
  .select('*')
// RLS에 의해 본인 편의점 주문만 반환됨
```

### 3. 관리자가 모든 사용자 조회
```typescript
// 관리자 토큰으로 인증된 상태에서
const { data: users } = await supabase
  .from('users')
  .select('*')
// RLS에 의해 모든 사용자 반환됨
```

## 테스트 방법

### 1. RLS 정책 확인
```sql
SELECT * FROM rls_policies WHERE tablename = 'users';
```

### 2. 정책 테스트
```sql
-- 특정 사용자로 테스트
SET request.jwt.claims = '{"user_id": "550e8400-e29b-41d4-a716-446655440001", "role": "customer"}';
SELECT * FROM stores; -- 승인된 편의점만 조회됨
```

## 주의사항

1. **JWT 토큰 관리**: 토큰이 만료되거나 유효하지 않으면 RLS 정책이 제대로 작동하지 않을 수 있습니다.

2. **역할 변경**: 사용자 역할이 변경되면 새로운 토큰을 발급받아야 합니다.

3. **토큰 버전**: 보안상 이유로 토큰을 무효화해야 할 때 `token_version`을 증가시킵니다.

4. **익명 접근**: 회원가입과 같은 특정 작업은 익명 사용자도 수행할 수 있도록 정책이 설정되어 있습니다.

5. **성능**: RLS 정책은 모든 쿼리에 적용되므로 복잡한 정책은 성능에 영향을 줄 수 있습니다.

## 마이그레이션 적용

1. Supabase 대시보드의 SQL Editor에서 `003_rls_policies.sql` 실행
2. 애플리케이션에서 JWT 토큰을 통한 인증 구현
3. 각 API 호출 시 적절한 토큰이 설정되어 있는지 확인