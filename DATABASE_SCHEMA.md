# 데이터베이스 스키마 문서

## 개요

우리동네 GS 편의점 솔루션의 PostgreSQL 데이터베이스 스키마입니다. Supabase를 통해 관리되며, 총 11개의 주요 테이블로 구성되어 있습니다.

## 테이블 구조

### 1. users (사용자)
사용자 계정 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 사용자 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 주소 |
| password_hash | TEXT | NOT NULL | bcrypt 해시된 비밀번호 |
| name | VARCHAR(100) | NOT NULL | 사용자 이름 |
| phone | VARCHAR(20) | NULL | 전화번호 |
| role | VARCHAR(20) | CHECK (customer/owner/admin) | 사용자 역할 |
| is_active | BOOLEAN | DEFAULT true | 계정 활성화 상태 |
| token_version | INTEGER | DEFAULT 0 | JWT 토큰 버전 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정일시 |

### 2. stores (편의점)
편의점 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 편의점 고유 ID |
| owner_id | UUID | FK → users(id) | 점주 ID |
| name | VARCHAR(100) | NOT NULL | 편의점 이름 |
| description | TEXT | NULL | 편의점 설명 |
| address | TEXT | NOT NULL | 주소 |
| phone | VARCHAR(20) | NULL | 전화번호 |
| business_hours | JSONB | NULL | 영업시간 (JSON 형태) |
| location | POINT | NULL | 위치 좌표 |
| status | VARCHAR(20) | CHECK (pending/approved/rejected/suspended) | 승인 상태 |
| business_license_url | TEXT | NULL | 사업자등록증 이미지 URL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정일시 |

### 3. products (상품 마스터)
전체 상품 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 상품 고유 ID |
| name | VARCHAR(200) | NOT NULL | 상품명 |
| description | TEXT | NULL | 상품 설명 |
| category | VARCHAR(50) | NOT NULL | 카테고리 |
| barcode | VARCHAR(50) | NULL | 바코드 |
| brand | VARCHAR(100) | NULL | 브랜드 |
| unit | VARCHAR(20) | DEFAULT 'ea' | 단위 |
| base_price | DECIMAL(10,2) | NOT NULL | 기본 가격 |
| image_url | TEXT | NULL | 상품 이미지 URL |
| is_active | BOOLEAN | DEFAULT true | 활성화 상태 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정일시 |

### 4. inventory (재고)
편의점별 상품 재고 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 재고 고유 ID |
| store_id | UUID | FK → stores(id) | 편의점 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| quantity | INTEGER | NOT NULL, DEFAULT 0 | 현재 재고 수량 |
| min_quantity | INTEGER | DEFAULT 10 | 최소 재고 수량 |
| price | DECIMAL(10,2) | NULL | 편의점별 판매 가격 |
| is_available | BOOLEAN | DEFAULT true | 판매 가능 여부 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정일시 |

**제약조건**: UNIQUE(store_id, product_id)

### 5. orders (주문)
고객 주문 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 주문 고유 ID |
| customer_id | UUID | FK → users(id) | 고객 ID |
| store_id | UUID | FK → stores(id) | 편의점 ID |
| order_number | VARCHAR(50) | UNIQUE, NOT NULL | 주문번호 |
| status | VARCHAR(20) | CHECK (pending/confirmed/preparing/ready/completed/cancelled) | 주문 상태 |
| order_type | VARCHAR(20) | CHECK (pickup/delivery) | 주문 타입 |
| total_amount | DECIMAL(10,2) | NOT NULL | 총 주문 금액 |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | 할인 금액 |
| final_amount | DECIMAL(10,2) | NOT NULL | 최종 결제 금액 |
| pickup_time | TIMESTAMPTZ | NULL | 픽업 예정 시간 |
| delivery_address | TEXT | NULL | 배달 주소 |
| customer_notes | TEXT | NULL | 고객 요청사항 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정일시 |

### 6. order_items (주문 상품)
주문에 포함된 상품 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 주문상품 고유 ID |
| order_id | UUID | FK → orders(id) | 주문 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| quantity | INTEGER | NOT NULL | 주문 수량 |
| unit_price | DECIMAL(10,2) | NOT NULL | 단가 |
| total_price | DECIMAL(10,2) | NOT NULL | 총 가격 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |

### 7. payments (결제)
결제 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 결제 고유 ID |
| order_id | UUID | FK → orders(id) | 주문 ID |
| payment_key | VARCHAR(200) | NOT NULL | Toss Payments 결제 키 |
| amount | DECIMAL(10,2) | NOT NULL | 결제 금액 |
| method | VARCHAR(50) | NOT NULL | 결제 수단 |
| status | VARCHAR(20) | CHECK (pending/completed/failed/cancelled) | 결제 상태 |
| approved_at | TIMESTAMPTZ | NULL | 결제 승인 시간 |
| failure_reason | TEXT | NULL | 결제 실패 사유 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |

### 8. coupons (쿠폰)
쿠폰 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 쿠폰 고유 ID |
| store_id | UUID | FK → stores(id) | 편의점 ID |
| name | VARCHAR(100) | NOT NULL | 쿠폰명 |
| description | TEXT | NULL | 쿠폰 설명 |
| discount_type | VARCHAR(20) | CHECK (percentage/fixed) | 할인 타입 |
| discount_value | DECIMAL(10,2) | NOT NULL | 할인 값 |
| min_order_amount | DECIMAL(10,2) | DEFAULT 0 | 최소 주문 금액 |
| max_discount_amount | DECIMAL(10,2) | NULL | 최대 할인 금액 |
| valid_from | TIMESTAMPTZ | NOT NULL | 유효 시작일 |
| valid_until | TIMESTAMPTZ | NOT NULL | 유효 종료일 |
| usage_limit | INTEGER | NULL | 사용 제한 수 |
| used_count | INTEGER | DEFAULT 0 | 사용된 횟수 |
| is_active | BOOLEAN | DEFAULT true | 활성화 상태 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |

### 9. coupon_usages (쿠폰 사용 내역)
쿠폰 사용 내역을 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 사용내역 고유 ID |
| coupon_id | UUID | FK → coupons(id) | 쿠폰 ID |
| order_id | UUID | FK → orders(id) | 주문 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| discount_amount | DECIMAL(10,2) | NOT NULL | 할인 적용 금액 |
| used_at | TIMESTAMPTZ | DEFAULT NOW() | 사용 시간 |

### 10. notifications (알림)
사용자 알림 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 알림 고유 ID |
| user_id | UUID | FK → users(id) | 사용자 ID |
| title | VARCHAR(200) | NOT NULL | 알림 제목 |
| message | TEXT | NOT NULL | 알림 내용 |
| type | VARCHAR(20) | CHECK (order/payment/system/promotion/inventory) | 알림 타입 |
| is_read | BOOLEAN | DEFAULT false | 읽음 여부 |
| related_id | UUID | NULL | 관련 엔티티 ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |

### 11. purchase_requests (발주 요청)
발주 요청 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 발주요청 고유 ID |
| store_id | UUID | FK → stores(id) | 편의점 ID |
| product_id | UUID | FK → products(id) | 상품 ID |
| requested_quantity | INTEGER | NOT NULL | 요청 수량 |
| current_quantity | INTEGER | NOT NULL | 현재 재고 수량 |
| status | VARCHAR(20) | CHECK (pending/approved/rejected/completed) | 처리 상태 |
| notes | TEXT | NULL | 비고 |
| requested_at | TIMESTAMPTZ | DEFAULT NOW() | 요청 시간 |
| processed_at | TIMESTAMPTZ | NULL | 처리 시간 |
| expected_delivery_date | DATE | NULL | 예상 입고일 |

## 인덱스

성능 최적화를 위한 인덱스가 설정되어 있습니다:

- `idx_users_email`: users.email
- `idx_users_role`: users.role
- `idx_stores_owner_id`: stores.owner_id
- `idx_stores_status`: stores.status
- `idx_products_category`: products.category
- `idx_products_is_active`: products.is_active
- `idx_inventory_store_id`: inventory.store_id
- `idx_inventory_product_id`: inventory.product_id
- `idx_orders_customer_id`: orders.customer_id
- `idx_orders_store_id`: orders.store_id
- `idx_orders_status`: orders.status
- `idx_orders_created_at`: orders.created_at
- `idx_order_items_order_id`: order_items.order_id
- `idx_payments_order_id`: payments.order_id
- `idx_payments_status`: payments.status
- `idx_notifications_user_id`: notifications.user_id
- `idx_notifications_is_read`: notifications.is_read
- `idx_coupons_store_id`: coupons.store_id
- `idx_coupons_valid_until`: coupons.valid_until

## 트리거

자동 업데이트를 위한 트리거가 설정되어 있습니다:

- `update_users_updated_at`: users 테이블 수정시 updated_at 자동 업데이트
- `update_stores_updated_at`: stores 테이블 수정시 updated_at 자동 업데이트
- `update_products_updated_at`: products 테이블 수정시 updated_at 자동 업데이트
- `update_inventory_updated_at`: inventory 테이블 수정시 updated_at 자동 업데이트
- `update_orders_updated_at`: orders 테이블 수정시 updated_at 자동 업데이트

## 샘플 데이터

개발 및 테스트를 위한 샘플 데이터가 포함되어 있습니다:

### 테스트 계정
- **고객**: customer1@test.com, customer2@test.com (비밀번호: test123)
- **점주**: owner1@test.com, owner2@test.com (비밀번호: test123)
- **관리자**: admin@ourgs.com (비밀번호: test123)

### 테스트 편의점
- GS25 강남점 (승인됨)
- GS25 홍대점 (승인됨)

### 상품 카테고리
- 음료 (코카콜라, 삼다수, 맥심 커피믹스)
- 과자 (새우깡, 포테토칩, 초코파이)
- 라면 (신라면, 진라면)
- 아이스크림 (하겐다즈, 메로나)
- 생활용품 (휴지, 세제)

## 마이그레이션 파일

- `001_initial_schema.sql`: 기본 스키마 생성
- `002_sample_data.sql`: 샘플 데이터 삽입

## 사용법

1. Supabase 대시보드에서 SQL Editor로 이동
2. `001_initial_schema.sql` 파일 내용을 복사하여 실행
3. `002_sample_data.sql` 파일 내용을 복사하여 실행 (선택사항)
4. 애플리케이션에서 TypeScript 타입을 통해 타입 안전한 데이터베이스 작업 수행