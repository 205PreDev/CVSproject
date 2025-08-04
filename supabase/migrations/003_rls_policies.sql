-- Row Level Security (RLS) 정책 설정
-- JWT 자체 인증 시스템을 위한 커스텀 RLS 정책

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- JWT 토큰에서 사용자 정보를 추출하는 함수
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

-- 1. users 테이블 RLS 정책
-- 관리자: 모든 사용자 조회/수정 가능
CREATE POLICY "admin_users_all" ON users
  FOR ALL USING (auth.user_role() = 'admin');

-- 사용자: 본인 정보만 조회/수정 가능
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (id = auth.user_id());

-- 회원가입을 위한 INSERT 정책 (인증되지 않은 사용자도 가능)
CREATE POLICY "users_insert_signup" ON users
  FOR INSERT WITH CHECK (true);

-- 2. stores 테이블 RLS 정책
-- 관리자: 모든 편의점 조회/수정 가능
CREATE POLICY "admin_stores_all" ON stores
  FOR ALL USING (auth.user_role() = 'admin');

-- 점주: 본인 편의점만 조회/수정 가능
CREATE POLICY "owners_own_stores" ON stores
  FOR ALL USING (owner_id = auth.user_id());

-- 고객: 승인된 편의점만 조회 가능
CREATE POLICY "customers_approved_stores" ON stores
  FOR SELECT USING (
    auth.user_role() = 'customer' AND status = 'approved'
  );

-- 점주: 편의점 등록 가능
CREATE POLICY "owners_insert_stores" ON stores
  FOR INSERT WITH CHECK (
    auth.user_role() = 'owner' AND owner_id = auth.user_id()
  );

-- 3. products 테이블 RLS 정책
-- 관리자: 모든 상품 조회/수정 가능
CREATE POLICY "admin_products_all" ON products
  FOR ALL USING (auth.user_role() = 'admin');

-- 점주와 고객: 활성화된 상품만 조회 가능
CREATE POLICY "users_active_products" ON products
  FOR SELECT USING (
    (auth.user_role() IN ('owner', 'customer')) AND is_active = true
  );

-- 4. inventory 테이블 RLS 정책
-- 관리자: 모든 재고 조회/수정 가능
CREATE POLICY "admin_inventory_all" ON inventory
  FOR ALL USING (auth.user_role() = 'admin');

-- 점주: 본인 편의점 재고만 조회/수정 가능
CREATE POLICY "owners_own_inventory" ON inventory
  FOR ALL USING (
    auth.user_role() = 'owner' AND 
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.user_id())
  );

-- 고객: 승인된 편의점의 재고만 조회 가능
CREATE POLICY "customers_approved_inventory" ON inventory
  FOR SELECT USING (
    auth.user_role() = 'customer' AND
    store_id IN (SELECT id FROM stores WHERE status = 'approved') AND
    is_available = true
  );

-- 5. orders 테이블 RLS 정책
-- 관리자: 모든 주문 조회/수정 가능
CREATE POLICY "admin_orders_all" ON orders
  FOR ALL USING (auth.user_role() = 'admin');

-- 고객: 본인 주문만 조회/생성 가능
CREATE POLICY "customers_own_orders" ON orders
  FOR ALL USING (
    auth.user_role() = 'customer' AND customer_id = auth.user_id()
  );

-- 점주: 본인 편의점 주문만 조회/수정 가능
CREATE POLICY "owners_store_orders" ON orders
  FOR ALL USING (
    auth.user_role() = 'owner' AND
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.user_id())
  );

-- 6. order_items 테이블 RLS 정책
-- 관리자: 모든 주문 상품 조회 가능
CREATE POLICY "admin_order_items_all" ON order_items
  FOR ALL USING (auth.user_role() = 'admin');

-- 고객: 본인 주문의 상품만 조회 가능
CREATE POLICY "customers_own_order_items" ON order_items
  FOR SELECT USING (
    auth.user_role() = 'customer' AND
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.user_id())
  );

-- 점주: 본인 편의점 주문의 상품만 조회 가능
CREATE POLICY "owners_store_order_items" ON order_items
  FOR SELECT USING (
    auth.user_role() = 'owner' AND
    order_id IN (
      SELECT o.id FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE s.owner_id = auth.user_id()
    )
  );

-- 주문 생성시 order_items INSERT 허용
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders 
      WHERE (
        (auth.user_role() = 'customer' AND customer_id = auth.user_id()) OR
        (auth.user_role() = 'owner' AND store_id IN (
          SELECT id FROM stores WHERE owner_id = auth.user_id()
        ))
      )
    )
  );

-- 7. payments 테이블 RLS 정책
-- 관리자: 모든 결제 조회 가능
CREATE POLICY "admin_payments_all" ON payments
  FOR ALL USING (auth.user_role() = 'admin');

-- 고객: 본인 주문의 결제만 조회 가능
CREATE POLICY "customers_own_payments" ON payments
  FOR SELECT USING (
    auth.user_role() = 'customer' AND
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.user_id())
  );

-- 점주: 본인 편의점 주문의 결제만 조회 가능
CREATE POLICY "owners_store_payments" ON payments
  FOR SELECT USING (
    auth.user_role() = 'owner' AND
    order_id IN (
      SELECT o.id FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE s.owner_id = auth.user_id()
    )
  );

-- 결제 생성 허용
CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders 
      WHERE customer_id = auth.user_id()
    )
  );

-- 8. coupons 테이블 RLS 정책
-- 관리자: 모든 쿠폰 조회/수정 가능
CREATE POLICY "admin_coupons_all" ON coupons
  FOR ALL USING (auth.user_role() = 'admin');

-- 점주: 본인 편의점 쿠폰만 조회/수정 가능
CREATE POLICY "owners_own_coupons" ON coupons
  FOR ALL USING (
    auth.user_role() = 'owner' AND
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.user_id())
  );

-- 고객: 활성화된 쿠폰만 조회 가능
CREATE POLICY "customers_active_coupons" ON coupons
  FOR SELECT USING (
    auth.user_role() = 'customer' AND
    is_active = true AND
    valid_from <= NOW() AND
    valid_until >= NOW()
  );

-- 9. coupon_usages 테이블 RLS 정책
-- 관리자: 모든 쿠폰 사용 내역 조회 가능
CREATE POLICY "admin_coupon_usages_all" ON coupon_usages
  FOR ALL USING (auth.user_role() = 'admin');

-- 고객: 본인 쿠폰 사용 내역만 조회 가능
CREATE POLICY "customers_own_coupon_usages" ON coupon_usages
  FOR SELECT USING (
    auth.user_role() = 'customer' AND user_id = auth.user_id()
  );

-- 점주: 본인 편의점 쿠폰 사용 내역만 조회 가능
CREATE POLICY "owners_store_coupon_usages" ON coupon_usages
  FOR SELECT USING (
    auth.user_role() = 'owner' AND
    coupon_id IN (
      SELECT id FROM coupons c
      JOIN stores s ON c.store_id = s.id
      WHERE s.owner_id = auth.user_id()
    )
  );

-- 쿠폰 사용 내역 생성 허용
CREATE POLICY "coupon_usages_insert" ON coupon_usages
  FOR INSERT WITH CHECK (user_id = auth.user_id());

-- 10. notifications 테이블 RLS 정책
-- 관리자: 모든 알림 조회/수정 가능
CREATE POLICY "admin_notifications_all" ON notifications
  FOR ALL USING (auth.user_role() = 'admin');

-- 사용자: 본인 알림만 조회/수정 가능
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.user_id());

-- 시스템에서 알림 생성 허용 (서버 사��드에서)
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (true);

-- 11. purchase_requests 테이블 RLS 정책
-- 관리자: 모든 발주 요청 조회/수정 가능
CREATE POLICY "admin_purchase_requests_all" ON purchase_requests
  FOR ALL USING (auth.user_role() = 'admin');

-- 점주: 본인 편의점 발주 요청만 조회/생성 가능
CREATE POLICY "owners_own_purchase_requests" ON purchase_requests
  FOR ALL USING (
    auth.user_role() = 'owner' AND
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.user_id())
  );

-- 익명 사용자를 위한 기본 정책 (회원가입, 로그인 등)
-- 이미 users 테이블에 회원가입 정책이 있으므로 추가 정책은 필요 없음

-- RLS 정책 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW rls_policies AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;