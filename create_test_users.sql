-- 테스트 사용자 계정 생성
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 고객 계정
INSERT INTO users (email, password_hash, name, role) VALUES 
('customer1@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '테스트 고객', 'customer');

-- 2. 점주 계정  
INSERT INTO users (email, password_hash, name, role) VALUES 
('owner1@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '테스트 점주', 'owner');

-- 3. 관리자 계정
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@ourgs.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '시스템 관리자', 'admin');

-- 비밀번호는 모두 'test123' 입니다