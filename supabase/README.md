# Supabase Setup

이 디렉터리는 BLC Care의 Google Apps Script / Google Sheets 런타임을 Supabase로 전환하기 위한 로컬 설정과 migration을 관리한다.

## Hosted project 준비

1. Supabase Dashboard에서 새 프로젝트를 생성한다.
2. Project URL, publishable key, secret key를 저장소가 아닌 `.env.local`과 Vercel 환경변수에 등록한다.
3. Google OAuth provider는 Auth 전환 단계에서 활성화한다.
4. 실제 성도 데이터는 RLS 정책 테스트가 끝나기 전에는 반입하지 않는다.

## CLI 연결

Supabase CLI 설치 후 다음 명령으로 hosted project를 연결한다.

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

`PROJECT_REF`, access token, database password, API keys는 저장소에 기록하지 않는다.

## 로컬 migration 및 RLS 검증

Docker Desktop 실행 후 다음 순서로 초기 스키마와 RLS 정책을 검증한다.

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm run supabase:lint
```

초기 migration은 `supabase/migrations/202606140001_initial_schema_and_rls.sql`, RLS 테스트는
`supabase/tests/database/initial_schema_rls.test.sql`에서 관리한다.

공개 새신자 제출은 `anon` 역할에 `newcomers` 직접 쓰기 권한을 주지 않는다. 후속 Next.js
Route Handler가 입력값, 개인정보 동의, rate limit을 검증한 뒤 서버 전용 secret key로 저장한다.
