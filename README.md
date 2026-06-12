# BLC Care

BLC Care는 교회 출결과 돌봄 기록을 관리하기 위한 웹 애플리케이션입니다.

현재 **Phase 5 Google OAuth 로그인과 role 기반 접근 제어**까지 구현되어 있습니다. 보호 API는 로그인 세션 이메일과 Apps Script proxy secret을 함께 검증합니다.

## 구현 범위

- Next.js App Router 기반 라우팅과 공통 레이아웃
- Google OAuth 로그인과 `admin`, `cell_leader`, `admin + cell_leader` 역할 분기
- `lib/api.ts` 실제 GAS API client와 개발용 mock fallback
- `/`, `/login`, `/dashboard`, `/members`, `/members/[id]`, `/reports`, `/reports/new`
- 선택된 셀 인원만 대상으로 하는 로컬 사람별 내용 parser
- 나눔 및 기도제목 분리 결과 확인 후 인원별 입력 반영 흐름
- 데스크톱 사이드바와 모바일 하단 내비게이션
- 공개 새신자 등록·완료 화면과 개인정보 동의 검증
- Admin 대시보드, 새신자 관리, 장기결석자 관리 mock 화면
- 새신자 상태 변경·성도 전환 및 장기결석 확인·해결 mock 동작
- 리포트 상세 조회와 권한별 mock 수정
- Admin 셀·사용자·설정·백업 관리 mock 화면
- Google Apps Script Web App 공통 라우터, Sheet read helper, `verifyUser` API
- 서버 권한 검증 기반 `getMembers`, `getMemberDetail`, `parsePrayerRequests` API
- 권한·수정 기간·잠금 검증 기반 `getReports`, `getReportDetail`, `getWeeklyReportDraft`, `saveWeeklyReport` API
- Admin 전용 Users·Cells·Newcomers 관리 API와 민감정보를 복제하지 않는 `audit_logs`
- 새신자 성도 전환 시 `members`와 최초 `cell_member_history` 생성
- Next.js `/api/gas` 서버 proxy 기반 실제 API 연결
- verifyUser, Members, Reports, Newcomers 실제 API 연동과 공통 loading/error/empty 상태
- 나눔·기도제목 일괄 분리는 확인 중심 로컬 rule parser 유지
- Auth.js 암호화 JWT 로그인 세션과 보호 페이지 접근 제어
- 미등록·비활성 계정 로그인 차단
- 보호 API의 세션 이메일 강제 적용과 `GAS_PROXY_SECRET` 검증
- Apps Script `initializeDatabase()` 및 `validateDatabaseSchema()` Sheet 초기화·검증 함수
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

실제 Apps Script API 연결 시 `.env.local`에 배포 URL을 설정합니다.

```txt
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
GAS_PROXY_SECRET=<LONG_RANDOM_SECRET_SHARED_WITH_APPS_SCRIPT>
AUTH_SECRET=<GENERATED_AUTH_SECRET>
AUTH_GOOGLE_ID=<GOOGLE_OAUTH_CLIENT_ID>
AUTH_GOOGLE_SECRET=<GOOGLE_OAUTH_CLIENT_SECRET>
```

Apps Script Script Properties에는 동일한 `GAS_PROXY_SECRET` 값을 `API_PROXY_SECRET` 이름으로 설정합니다.

Google OAuth 승인된 리디렉션 URI:

```txt
http://localhost:3000/api/auth/callback/google
https://<PRODUCTION_DOMAIN>/api/auth/callback/google
```

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
lib/          타입, 실제 API client, mock fallback, 권한 helper, 사람별 내용 parser
docs/         요구사항과 설계 문서
gas-backend/  Google Apps Script Web App 백엔드
```

## Apps Script 설정

배포 절차, 최소 mock Sheet 데이터, Script Properties, API별 `curl.exe` 요청과 CORS 제약은 [`docs/10_APPS_SCRIPT_DEPLOYMENT.md`](docs/10_APPS_SCRIPT_DEPLOYMENT.md)를 따릅니다.

실제 Sheet ID, Web App URL, OAuth secret, proxy secret은 저장소에 기록하지 않습니다.

필수 Script Property:

```txt
SHEET_ID = <TEST_SPREADSHEET_ID>
API_PROXY_SECRET = <LONG_RANDOM_SECRET>
```

Apps Script `ContentService` 응답은 리다이렉트되므로 CLI 호출 시 `curl.exe -L`을 사용합니다. 브라우저는 Apps Script를 직접 호출하지 않고 Next.js `/api/gas` 서버 proxy를 사용합니다.

처음 설정할 때 Apps Script 편집기에서 `initializeDatabase()`를 실행하면 필요한 Sheet와 헤더가 생성됩니다. 이후 `validateDatabaseSchema()`로 구성을 점검할 수 있습니다. 초기화 함수는 실제 사용자나 성도 데이터를 만들지 않습니다.

## 다음 작업

1. 실제 Google OAuth client와 배포 도메인 통합 로그인 검증
2. 동명이인·미매칭 일괄 입력 항목 직접 선택
3. UI 상호작용 테스트 추가
4. 격리된 mock Spreadsheet에서 Phase 5 실제 호출 검증
5. 겸임자의 셀리더 모드 서버 조회 범위 분리

## 개인정보 주의

실제 성도 이름, 연락처, 주소, 기도제목, 나눔 요약, 돌봄 메모, OAuth 비밀값을 저장소에 추가하지 않습니다. 사람별 내용 parser는 외부 AI API를 호출하지 않습니다.
