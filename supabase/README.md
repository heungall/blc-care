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

## 12개 테이블 샘플 데이터

`supabase/examples/sample-data.sql`은 모든 앱 테이블에 데이터가 어떤 형태로 들어가는지 보여주는
참고용 SQL이다. 실제 개인정보를 포함하지 않으며 migration이나 `db push`에서 자동 실행되지 않는다.

샘플이 보여주는 주요 형식:

```txt
ID 관계          UUID
roles            text[] 예: array['admin', 'cell_leader']
name_aliases     text[] 예: array['길동', '길동형제']
날짜             'YYYY-MM-DD'
시간             'YYYY-MM-DD HH:mm:ss+09'
상태값           migration에 정의된 enum 값
audit 값         개인정보 원문이 없는 jsonb
```

Supabase Dashboard의 SQL Editor에서 내용을 검토한 뒤 실행할 수 있다. 운영 DB에 불필요한 샘플
데이터를 넣지 않도록 기본 seed 파일과 migration에는 연결하지 않는다.

## Admin 성도 CSV 일괄 등록

`202606140002_member_csv_import.sql`은 `/admin/members/import` 화면에서 사용하는
`import_members_csv` RPC를 생성한다. RPC는 `service_role`만 실행할 수 있고, 최대 500명의
성도와 최초 셀 이력 및 최소 audit log를 하나의 트랜잭션으로 저장한다.

CSV 파일은 앱에서 템플릿을 내려받아 작성한다. 실제 CSV와 개인정보는 저장소나 Storage에
보관하지 않는다.
