# BLC Care

BLC Care는 교회 출결과 돌봄 기록을 관리하기 위한 웹 애플리케이션입니다.

현재 운영 런타임은 Supabase PostgreSQL과 Supabase Auth를 사용합니다. 기존 Google Apps Script 코드는 데이터 전환 참고용 레거시로만 남아 있으며 앱에서 호출하지 않습니다.

## 구현 범위

- Next.js App Router 기반 라우팅과 공통 레이아웃
- Google OAuth 로그인과 `admin`, `cell_leader`, `admin + cell_leader` 역할 분기
- `lib/api.ts`와 `/api/supabase` 기반 Supabase API client
- `/`, `/login`, `/dashboard`, `/members`, `/members/[id]`, `/reports`, `/reports/new`
- 선택된 셀 인원만 대상으로 하는 로컬 사람별 내용 parser
- 나눔 및 기도제목 분리 결과 확인 후 인원별 입력 반영 흐름
- 데스크톱 사이드바와 모바일 하단 내비게이션
- 공개 새신자 등록·완료 화면과 개인정보 동의 검증
- Admin 대시보드, 새신자 관리, 장기결석자 관리 mock 화면
- 새신자 상태 변경·성도 전환 및 장기결석 확인·해결 mock 동작
- 리포트 상세 조회와 권한별 mock 수정
- Admin 셀·사용자·설정·백업 관리 mock 화면
- Supabase PostgreSQL 스키마, RLS, UUID 관계
- 서버 권한 검증 기반 Members, Reports, Newcomers, Admin API
- Admin 전용 Users·Cells·Newcomers 관리 API와 민감정보를 복제하지 않는 `audit_logs`
- 새신자 성도 전환 시 `members`와 최초 `cell_member_history` 생성
- Next.js `/api/supabase` Route Handler 기반 실제 API 연결
- Supabase Auth Google OAuth와 미등록·비활성 계정 차단
- 나눔·기도제목 일괄 분리는 확인 중심 로컬 rule parser 유지
- Supabase Auth 세션과 보호 페이지 접근 제어
- 성도 개인 상세의 선택 정보: 직장, 직업, 직책

## 실행 방법

요구 환경:

```txt
Node.js 20 이상 권장
npm
```

설치 및 실행:

```bash
npm install
npm run dev
```

## Supabase 전환

Supabase 전환 순서와 상태는 [`TODOLIST.md`](TODOLIST.md)를 따른다.

로컬 Supabase CLI 명령:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:reset
npm run supabase:test
npm run supabase:lint
npm run supabase:stop
```

Hosted project 생성 후 저장소에 실제 key를 기록하지 않고 다음 명령으로 연결한다.

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
```

`.env.local`과 Vercel 환경변수에 다음 값을 설정합니다.

```txt
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<SUPABASE_PUBLISHABLE_KEY>
SUPABASE_SECRET_KEY=<SUPABASE_SECRET_KEY>
```

Supabase Auth Google provider에 OAuth client를 설정하고, Redirect URL allow list에 다음 주소를 등록합니다.

```txt
http://localhost:3000/auth/callback
https://<PRODUCTION_DOMAIN>/auth/callback
```

Google Cloud OAuth client의 승인된 리디렉션 URI에는 Supabase Dashboard가 안내하는
`https://<PROJECT_REF>.supabase.co/auth/v1/callback`을 등록합니다.

Supabase Auth의 신규 사용자 생성은 허용해야 최초 Google 로그인이 `auth.users`에 생성됩니다.
실제 앱 접근은 별도의 `public.users` 등록 상태와 active/roles 검증으로 제한합니다.

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 검증 명령

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## 로그인 및 역할 확인

`/login`에서 Google 계정으로 로그인합니다.

- `admin`: `/admin/dashboard`로 이동하며 Admin 메뉴 표시
- `cell_leader`: `/dashboard`로 이동
- `admin,cell_leader`: `/admin/dashboard`로 이동하며 모드 전환 지원
- 미등록·비활성 계정: 로그인 단계에서 차단

모든 이메일, 연락처, 주소, 돌봄 기록과 기도 내용은 실제 정보가 아닌 명시적 샘플 데이터입니다.

## 주요 구조

```txt
app/          App Router 페이지와 레이아웃
components/   공통 UI, AppShell, 리포트와 사람별 일괄 입력 UI
lib/          타입, 실제 API client, 권한 helper, 사람별 내용 parser
docs/         요구사항과 설계 문서
gas-backend/  전환 참고용 레거시 Google Apps Script 코드
supabase/     Supabase 로컬 설정과 PostgreSQL migration
```

## 다음 작업

1. Vercel 배포 도메인에서 Supabase Google OAuth 통합 검증
2. 주요 쓰기 작업의 audit log 확대
3. private Supabase Storage 사진 업로드
4. 앱 내 데이터 내보내기와 복구 절차 구현

## 개인정보 주의

실제 성도 이름, 연락처, 주소, 기도제목, 나눔 요약, 돌봄 메모, OAuth 비밀값을 저장소에 추가하지 않습니다. 사람별 내용 parser는 외부 AI API를 호출하지 않습니다.
