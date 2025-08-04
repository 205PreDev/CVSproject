# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정을 생성합니다.
2. "New Project" 버튼을 클릭하여 새 프로젝트를 생성합니다.
3. 프로젝트 이름을 "ourgs-cvs" 또는 원하는 이름으로 설정합니다.
4. 데이터베이스 비밀번호를 설정합니다 (안전한 비밀번호 사용).
5. 지역을 선택합니다 (한국의 경우 "Northeast Asia (Seoul)" 권장).

## 2. 환경 변수 설정

1. Supabase 대시보드에서 Settings > API로 이동합니다.
2. 다음 정보를 확인합니다:
   - Project URL
   - anon public key

3. 프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가합니다:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Toss Payments
VITE_TOSS_CLIENT_KEY=test_ck_your_test_key

# App Environment
VITE_APP_ENV=development
```

## 3. 연결 테스트

애플리케이션을 실행하면 자동으로 환경 변수가 검증됩니다:

```bash
npm run dev
```

환경 변수가 올바르게 설정되지 않은 경우 오류 페이지가 표시됩니다.

## 4. 파일 구조

```
src/
├── services/
│   ├── supabase.ts          # Supabase 클라이언트 설정
│   └── database.ts          # 기본 데이터베이스 서비스
└── utils/
    └── supabaseTest.ts      # 연결 테스트 유틸리티
```

## 5. 주요 기능

- **자동 환경 변수 검증**: 앱 시작 시 필수 환경 변수 확인
- **타입 안전성**: TypeScript 타입 정의로 안전한 데이터베이스 작업
- **기본 CRUD 작업**: DatabaseService 클래스로 표준화된 데이터베이스 작업
- **실시간 기능**: Supabase Realtime 설정으로 실시간 알림 지원
- **JWT 자체 인증**: Supabase Auth 대신 자체 JWT 인증 시스템 사용

## 6. 다음 단계

환경 설정이 완료되면 다음 작업을 진행합니다:
1. 데이터베이스 스키마 생성 (task 2.2)
2. RLS 정책 설정 (task 2.3)