# HISTORY.md

BLC Care 개발 이력을 기록하는 문서입니다.

이 문서는 세션이 바뀌어도 프로젝트 맥락을 유지하기 위해 사용합니다.

민감정보는 기록하지 않습니다.

---

## 기록 규칙

각 작업 후 아래 형식으로 기록합니다.

```md
## YYYY-MM-DD - 작업 제목

### Summary
- 무엇을 작업했는지 요약

### Changed Files
- 변경된 파일 목록

### Reason
- 왜 이 작업을 했는지

### Checks
- 실행한 테스트 또는 확인 사항

### TODO
- 남은 작업
```

---

## 2026-06-12 - Initial project documentation

### Summary

* BLC Care 프로젝트 문서 구조를 정리했다.
* 요구사항, DB Schema, 화면 흐름, API 명세, 권한 규칙, 기도제목 파서 규칙, 개인정보 처리 원칙, 개발 계획 문서를 작성했다.
* Codex Agent 작업 지침을 위한 `AGENTS.md` 방향을 정리했다.

### Changed Files

* `AGENTS.md`
* `README.md`
* `docs/01_REQUIREMENTS.md`
* `docs/02_DB_SCHEMA.md`
* `docs/03_SCREEN_FLOW.md`
* `docs/04_API_SPEC.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/06_PRAYER_PARSER_RULES.md`
* `docs/07_PRIVACY_POLICY.md`
* `docs/08_DEVELOPMENT_PLAN.md`

### Reason

* Codex Agent가 요구사항과 설계 의도를 잃지 않고 단계적으로 개발할 수 있도록 하기 위함.
* 개인정보와 기도제목을 다루는 앱이므로 권한, 문서, 이력 관리 기준을 먼저 확정하기 위함.

### Checks

* 문서 간 주요 구조 정합성 확인

  * 복수 role 지원
  * `admin,cell_leader` 겸임 지원
  * `user_cell_assignments` 기반 셀 배정
  * 규칙 기반 기도제목 파서
  * mock data 우선 개발 원칙

### TODO

* Phase 1 mock UI 구현
* TypeScript 타입 정의
* 권한 helper 구현
* 기도제목 parser 로컬 함수 구현
* mock API client 구현

---

## 2026-06-12 - Phase 1 mock UI 기본 구조 구현

### Summary

* Next.js App Router, TypeScript, Tailwind CSS 기반 앱을 구성했다.
* mock 사용자 역할 전환, mock data, mock API adapter와 주요 Phase 1 화면을 구현했다.
* 선택된 셀 인원만 대상으로 하는 규칙 기반 prayer parser와 저장 전 확인 UI를 구현했다.
* 데스크톱 사이드바와 모바일 하단 내비게이션을 적용했다.
* 기존 `doc/` 및 오타 파일명을 문서 기준의 `docs/` 표준 경로로 정리했다.

### Changed Files

* `app/`
* `components/`
* `lib/`
* `package.json`
* `README.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `HISTORY.md`
* `doc/` → `docs/`

### Reason

* 실제 API 및 실제 개인정보 없이 Phase 1 화면 흐름과 로컬 parser를 검증하기 위함.
* 코드와 문서 참조 경로를 일치시키기 위함.

### Checks

* `npm run test` - prayer parser 4개 테스트 통과
* `npm run typecheck` - 통과
* `npm run lint` - 통과
* `npm run build` - 통과
* `npm run dev` - `/`, `/reports/new` HTTP 200 확인
* `npm audit --omit=dev --audit-level=moderate` - Next.js 내부 PostCSS 관련 moderate 2건 확인. 자동 수정이 파괴적 다운그레이드를 제안해 적용하지 않음.

### TODO

* `/reports/[id]`, `/newcomer`, `/admin/dashboard` 등 남은 Phase 1 화면 구현
* mock route guard 및 권한 없음 상태 보강
* 폼 검증과 UI 상호작용 테스트 추가
* Phase 2 도메인 로직 확장
* Next.js 의존성 업데이트 시 PostCSS 보안 권고 재확인

---

## 2026-06-12 - 나눔 일괄 분리 기능 추가

### Summary

* 기도제목 전용 이름 매칭 로직을 재사용 가능한 사람별 내용 parser로 분리했다.
* `/reports/new`에 나눔 일괄 입력, 자동 분리, 확인 후 개인별 나눔 입력 반영 흐름을 추가했다.
* 나눔과 기도제목이 각각 독립적인 입력 및 확인 상태를 유지하도록 구성했다.

### Changed Files

* `components/member-content-bulk-input.tsx`
* `components/report-form.tsx`
* `lib/member-content-parser.ts`
* `lib/prayer-parser.ts`
* `lib/types.ts`
* `docs/01_REQUIREMENTS.md`
* `docs/03_SCREEN_FLOW.md`
* `docs/06_PRAYER_PARSER_RULES.md`
* `docs/09_DESIGN_SYSTEM.md`
* `README.md`

### Reason

* 셀리더가 기도제목뿐 아니라 여러 사람의 나눔도 한 번에 붙여넣고 개인별로 분리할 수 있도록 하기 위함.

### Checks

* `npm run test` - 기존 기도제목 4건 및 나눔 분리 1건 통과
* `npm run typecheck` - 통과
* `npm run lint` - 통과
* `npm run build` - 통과
* `npm run dev` - `/reports/new` 응답 확인

### TODO

* 동명이인과 미매칭 항목을 UI에서 직접 선택해 반영하는 기능

---

## 2026-06-12 - Phase 1 2순위 화면 구현

### Summary

* 비로그인 새신자 등록 및 완료 화면을 구현했다.
* React Hook Form과 Zod로 필수값 및 개인정보 수집 동의를 검증했다.
* Admin 대시보드, 새신자 관리, 장기결석자 관리 화면을 구현했다.
* Admin 전용 mock 접근 가드와 역할 기반 메뉴를 추가했다.
* 새신자 상태 변경·성도 전환 및 장기결석 확인·해결 mock 동작을 추가했다.

### Changed Files

* `app/newcomer/`
* `app/(protected)/admin/`
* `components/admin-guard.tsx`
* `components/newcomer-form.tsx`
* `components/app-shell.tsx`
* `components/status-badge.tsx`
* `lib/types.ts`
* `lib/mock-data.ts`
* `lib/api.ts`
* `package.json`
* `README.md`
* `docs/08_DEVELOPMENT_PLAN.md`

### Reason

* Phase 1 2순위 화면 흐름을 실제 API와 실제 개인정보 없이 검증하기 위함.

### Checks

* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - parser 및 새신자 폼 검증 테스트 통과
* `npm run build` - 통과
* `npm run dev` - 신규 공개 및 Admin 라우트 응답 확인

### TODO

* `/reports/[id]` 상세 화면
* Phase 1 3순위 Admin 화면
* 실제 비로그인 세션 기반 보호 route guard
* mock UI 상호작용 테스트 보강

---

## 2026-06-12 - Phase 1 1순위 및 3순위 화면 구현

### Summary

* `/reports/[id]` 상세 조회와 권한별 mock 수정 화면을 구현했다.
* Admin 셀·사용자·설정·백업 관리 화면을 구현했다.
* 셀 생성·수정, 사용자 등록·역할·배정·해제, 설정 저장, 백업 생성 mock 동작을 추가했다.
* 리포트 수정 권한 helper 테스트를 추가했다.

### Changed Files

* `app/(protected)/reports/[id]/page.tsx`
* `app/(protected)/admin/cells/page.tsx`
* `app/(protected)/admin/users/page.tsx`
* `app/(protected)/admin/settings/page.tsx`
* `app/(protected)/admin/backup/page.tsx`
* `components/app-shell.tsx`
* `lib/types.ts`
* `lib/mock-data.ts`
* `lib/api.ts`
* `lib/permissions.ts`
* `lib/permissions.test.ts`
* `docs/04_API_SPEC.md`
* `docs/06_PRAYER_PARSER_RULES.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `README.md`

### Reason

* Phase 1의 남은 1순위 및 3순위 화면 흐름을 실제 외부 API 없이 검증하기 위함.

### Checks

* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 10개 테스트 통과
* `npm run build` - 전체 18개 라우트 생성 완료
* `npm run dev` - 리포트 상세 및 3순위 Admin 라우트 응답 확인

### TODO

* 실제 비로그인 세션 기반 보호 route guard
* 동명이인·미매칭 일괄 입력 항목 직접 선택
* UI 상호작용 테스트 보강

---

## 2026-06-12 - Phase 2 타입 및 도메인 로직 구현

### Summary

* DB Schema 기준으로 12개 Sheet 엔티티 타입과 화면 파생 타입을 정리했다.
* roles와 name_aliases의 DB 쉼표 문자열 변환 helper를 추가했다.
* 권한 helper를 배정 목록과 기준일을 받는 순수 함수로 정리했다.
* 날짜, 주차 계산, 장기결석자 계산, 리포트 수정 가능 여부 helper를 구현했다.
* 기도제목 parser의 구분자, 정규화, invalid 안내 및 테스트를 보강했다.
* mock data를 새 필수 타입과 날짜·관계 필드에 맞게 정리했다.

### Changed Files

* `lib/types.ts`
* `lib/date.ts`
* `lib/absence.ts`
* `lib/permissions.ts`
* `lib/member-content-parser.ts`
* `lib/prayer-parser.ts`
* `lib/mock-data.ts`
* `lib/api.ts`
* `lib/*.test.ts`
* Phase 1 UI 선택 필드 표시 처리
* `docs/01_REQUIREMENTS.md`
* `docs/02_DB_SCHEMA.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/06_PRAYER_PARSER_RULES.md`
* `docs/08_DEVELOPMENT_PLAN.md`

### Reason

* Phase 3 API 구현 전에 DB 타입과 핵심 비즈니스 규칙을 테스트 가능한 형태로 확정하기 위함.

### Checks

* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 30개 테스트 통과
* `npm run build` - 전체 18개 라우트 생성 완료
* `npm run dev` - 홈, 성도 상세, 리포트 작성·상세, Admin 화면 HTTP 200 확인

### TODO

* Phase 3 Google Apps Script API 구현
* API payload 변환 타입 및 테스트
* 서버/API 계층에서 권한 helper 재검증 적용

---

## 2026-06-12 - Phase 3-1 Apps Script 기본 구조 및 Auth API

### Summary

* Google Apps Script Web App의 `doGet` / `doPost` action 라우터와 공통 응답·에러 처리를 구현했다.
* Script Properties의 `SHEET_ID`로 Spreadsheet를 열고 Sheet를 헤더 기반 객체로 읽는 helper를 구현했다.
* 이메일 기준 활성 사용자 확인, roles 배열 변환, 현재 담당 셀 조합을 수행하는 `verifyUser` API를 구현했다.
* Phase 3-1 API 계약과 Apps Script 설정 방법을 문서화했다.

### Changed Files

* `gas-backend/Code.gs`
* `gas-backend/Router.gs`
* `gas-backend/Response.gs`
* `gas-backend/Errors.gs`
* `gas-backend/Config.gs`
* `gas-backend/Sheets.gs`
* `gas-backend/Auth.gs`
* `gas-backend/Utils.gs`
* `docs/04_API_SPEC.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `README.md`
* `HISTORY.md`

### Reason

* 실제 Google Apps Script 데이터 API 구현 전에 공통 백엔드 구조와 사용자 검증 계약을 확정하기 위함.

### Checks

* Apps Script `.gs` 파일 JavaScript 구문 검사
* 로컬 Apps Script stub으로 겸임 역할, 담당 셀, 미등록·비활성 계정, 라우터 응답 확인
* `npm run lint`
* `npm run typecheck`
* `npm run test` - 30개 테스트 통과
* `npm run build` - 전체 18개 라우트 생성 완료

### TODO

* 실제 Apps Script 프로젝트에서 테스트용 Sheet와 `SHEET_ID`를 설정해 Web App 호출 확인
* Google OAuth 신원 검증
* Phase 3 후속 Users / Cells / Members / Reports API
* 프론트엔드 실제 API 연결

---

## 2026-06-12 - Phase 3-2 Members 및 Prayer Parser API

### Summary

* Admin 전체 범위와 셀리더 활성 배정 셀 범위를 서버에서 검증하는 성도 접근 helper를 구현했다.
* 필터, 이름 검색, 정렬, 페이지네이션과 셀 이름·마지막 출석일·미해결 특이사항 수를 제공하는 `getMembers`를 구현했다.
* 성도 기본 정보와 개인별 주차 기록·특이사항을 반환하는 `getMemberDetail`을 구현했다.
* 선택된 셀의 활동 성도만 대상으로 동작하며 결과를 저장하지 않는 규칙 기반 `parsePrayerRequests`를 구현했다.
* Phase 3-2 API 계약과 Apps Script 설정 Sheet 목록을 문서화했다.

### Changed Files

* `gas-backend/Router.gs`
* `gas-backend/Auth.gs`
* `gas-backend/Sheets.gs`
* `gas-backend/Utils.gs`
* `gas-backend/Members.gs`
* `gas-backend/PrayerParser.gs`
* `docs/04_API_SPEC.md`
* `docs/06_PRAYER_PARSER_RULES.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `README.md`
* `HISTORY.md`

### Reason

* Members와 Prayer Parser를 실제 Google Sheets 기반 API로 구현하면서 민감 정보의 서버 측 접근 범위를 강제하기 위함.

### Checks

* Apps Script `.gs` 파일 JavaScript 구문 검사
* 로컬 Apps Script stub 기반 Members 권한·필터·상세·parser 흐름 확인 - 통과
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 30개 테스트 통과
* `npm run build` - 전체 18개 라우트 생성 완료

### TODO

* 실제 Apps Script Web App에서 테스트용 Sheet 호출 확인
* Google OAuth 신원 검증
* Reports / Users / Cells / Newcomers API
* 프론트엔드 실제 API 연결

---

## 2026-06-12 - Phase 3-3 Apps Script Web App 배포 가이드

### Summary

* 실제 ID와 URL을 저장하지 않고 Apps Script Web App을 mock 데이터로 배포하는 절차를 문서화했다.
* `SHEET_ID` Script Property, 최소 mock Sheet 데이터, `/dev`와 `/exec` 배포 차이를 정리했다.
* `verifyUser`, `getMembers`, `parsePrayerRequests`의 PowerShell `curl.exe` 호출과 확인 항목을 작성했다.
* `ContentService` JSON 리다이렉트, `curl -L`, `TextOutput` CORS 제약과 Next.js 서버 proxy 원칙을 기록했다.

### Changed Files

* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `docs/04_API_SPEC.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `README.md`
* `HISTORY.md`

### Reason

* Phase 3 백엔드를 격리된 mock 환경에서 실제 Web App으로 배포하고 호출 가능 여부를 안전하게 확인할 수 있도록 하기 위함.

### Checks

* Apps Script Web App, ContentService, TextOutput 공식 문서 기준 배포·JSON·CORS 제약 확인
* JSON MIME type 및 공통 응답 구조 로컬 stub 검사 - 통과
* Apps Script 10개 파일 JavaScript 구문 검사 - 통과
* 문서 내 실제 Sheet ID, 배포 URL, 실제 개인정보 미포함 확인
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 30개 테스트 통과

### TODO

* 격리된 mock Spreadsheet와 임시 Web App URL을 사용한 실제 `/exec` 호출
* Next.js 서버 Route Handler 또는 proxy 구현
* Google OAuth 신원 검증

---

## 2026-06-12 - Phase 3-4 주차별 셀 리포트 API

### Summary

* 리포트 목록·상세·주차 draft 조회와 저장 API를 구현했다.
* `weekly_cell_reports`와 `weekly_member_records`를 안정 ID 및 복합 유니크 키 기준으로 생성·수정하도록 구현했다.
* `LockService` 안에서 동일 셀·주차와 동일 리포트·성도 중복을 차단했다.
* Admin 전체 접근과 잠금 리포트 수정, 셀리더 활성 배정 셀·해당 주차·잠금 제한을 서버에서 검증했다.
* 새 리포트는 활성 셀에만 생성하고 기존 비활성 셀 리포트는 Admin이 수정할 수 있도록 처리했다.
* 새 주차 기록은 새 리포트 아래 누적하고, 수정 요청에서 빠진 기존 개인 기록은 삭제하지 않도록 했다.

### Changed Files

* `gas-backend/Reports.gs`
* `gas-backend/Router.gs`
* `gas-backend/Sheets.gs`
* `gas-backend/Auth.gs`
* `gas-backend/Utils.gs`
* `gas-backend/Errors.gs`
* `docs/04_API_SPEC.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `README.md`
* `HISTORY.md`

### Reason

* 주차별 셀 리포트와 개인별 기록을 권한·기간·잠금 규칙에 맞춰 Google Sheets에 누적하기 위함.

### Checks

* Apps Script Reports 통합 stub으로 목록 권한, draft 병합, 수정 기간, 잠금, upsert, 중복 방지, 기록 보존 확인 - 통과
* 기존 비활성 셀 리포트 Admin 수정 및 새 리포트 활성 셀 제한 집중 stub - 통과
* Apps Script 11개 파일 JavaScript 구문 검사 - 통과
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 30개 테스트 통과
* `npm run build` - 전체 18개 라우트 생성 완료

### TODO

* 격리된 mock Spreadsheet에서 Reports API 실제 저장 호출
* 다중 Sheet 쓰기 중 실패 시 운영 복구 절차와 audit log
* Next.js 서버 proxy 및 실제 프론트엔드 연결
* Google OAuth 신원 검증

---

## 2026-06-12 - Members 직장·직업·직책 긴급 추가

### Summary

* `members` 개인 상세 선택 필드로 `workplace`, `occupation`, `job_title`을 추가했다.
* TypeScript 타입과 mock data, 성도 상세 화면, Apps Script 상세 정규화를 업데이트했다.
* 세 필드는 성도 목록에 노출하지 않고 권한 검증된 개인 상세에서만 반환·표시하도록 문서화했다.
* 기존 `members` Sheet에 추가할 컬럼명과 빈 값 허용 규칙을 기록했다.

### Changed Files

* `AGENTS.md`
* `lib/types.ts`
* `lib/types.test.ts`
* `lib/mock-data.ts`
* `app/(protected)/members/[id]/page.tsx`
* `gas-backend/Members.gs`
* `docs/01_REQUIREMENTS.md`
* `docs/02_DB_SCHEMA.md`
* `docs/03_SCREEN_FLOW.md`
* `docs/04_API_SPEC.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/07_PRIVACY_POLICY.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `docs/09_DESIGN_SYSTEM.md`
* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `README.md`
* `HISTORY.md`

### Reason

* 성도 개인 돌봄 및 관리에 필요한 직장 관련 기본 정보를 상세 화면에서 확인할 수 있도록 하기 위함.

### Checks

* Apps Script `getMemberDetail` 직장 필드 반환 및 목록 미노출 stub - 통과
* Apps Script 11개 파일 JavaScript 구문 검사 - 통과
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 31개 테스트 통과
* `npm run build` - 전체 18개 라우트 생성 완료

### TODO

* 기존 실제 배포 전 `members` Sheet 첫 행에 `workplace`, `occupation`, `job_title` 컬럼 추가
* 향후 성도 수정 API 구현 시 세 필드 저장 validation 추가

---

## 2026-06-12 - Phase 3-5 Admin 관리 API

### Summary

* Admin 전용 Users, Cells, Newcomers 관리 API를 구현했다.
* 복수 역할 배열 변환, 셀 배정 재활성화와 soft unassign, 셀 비활성화를 지원한다.
* 공개 새신자 등록은 개인정보 수집 동의를 필수로 검증하고, 조회·상태 변경·성도 전환은 Admin으로 제한했다.
* 새신자 전환 시 `members`, 최초 `cell_member_history`, `newcomers`를 ID 기반으로 기록한다.
* 주요 관리 변경을 민감정보 원문 없이 `audit_logs`에 기록한다.

### Changed Files

* `gas-backend/AuditLogs.gs`
* `gas-backend/Users.gs`
* `gas-backend/Cells.gs`
* `gas-backend/Newcomers.gs`
* `gas-backend/Auth.gs`
* `gas-backend/Router.gs`
* `gas-backend/Sheets.gs`
* `gas-backend/Utils.gs`
* `docs/02_DB_SCHEMA.md`
* `docs/04_API_SPEC.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/07_PRIVACY_POLICY.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `README.md`
* `HISTORY.md`

### Reason

* Phase 3-5 관리자 계정, 셀, 새신자 관리와 변경 추적을 Apps Script 서버 권한 검증 기반으로 제공하기 위함.

### Checks

* Apps Script 전체 `.gs` 파일 JavaScript 구문 검사 - 통과
* Apps Script 메모리 Sheet stub 통합 검사 - Admin 차단, 복수 역할, 배정, 동의 검증, 전환, 중복 전환 차단, 감사 로그 최소화 통과
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 31개 테스트 통과
* `npm run build` - 전체 18개 라우트 생성 완료

### TODO

* 격리된 mock Spreadsheet에서 Phase 3-5 API 실제 Web App 호출 검증
* Google OAuth 신원 검증
* 다중 Sheet 쓰기 중간 실패 복구 절차
* Next.js 서버 proxy 및 실제 프론트엔드 API 연결

---

## 2026-06-12 - Phase 4 Apps Script 실제 API 연결

### Summary

* `lib/api.ts`를 비동기 GAS API client와 개발용 mock fallback 구조로 정리했다.
* `NEXT_PUBLIC_GAS_API_URL`과 Next.js `/api/gas` 서버 proxy를 추가했다.
* verifyUser, Cells, Members, Reports, Newcomers API를 주요 프론트엔드 화면에 연결했다.
* 실제 API URL이 없을 때만 mock fallback을 사용하며, 실제 호출 오류는 사용자 친화적 메시지로 표시한다.
* 공통 loading, error, empty 상태를 추가했다.
* 나눔과 기도제목 일괄 분리는 선택 셀 인원을 사용하는 로컬 rule parser로 유지했다.

### Changed Files

* `.env.example`
* `app/api/gas/route.ts`
* `lib/api.ts`
* `lib/types.ts`
* `hooks/use-api-data.ts`
* `components/ui.tsx`
* `components/mock-auth-provider.tsx`
* `components/app-shell.tsx`
* `components/member-card.tsx`
* `components/newcomer-form.tsx`
* `components/report-form.tsx`
* `app/login/page.tsx`
* `app/(protected)/dashboard/page.tsx`
* `app/(protected)/admin/dashboard/page.tsx`
* `app/(protected)/admin/newcomers/page.tsx`
* `app/(protected)/members/page.tsx`
* `app/(protected)/members/[id]/page.tsx`
* `app/(protected)/reports/page.tsx`
* `app/(protected)/reports/[id]/page.tsx`
* `README.md`
* `docs/04_API_SPEC.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `HISTORY.md`

### Reason

* Phase 4 범위에 따라 mock 중심 데이터 흐름을 실제 Apps Script Web App 호출 구조로 전환하기 위함.

### Checks

* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 33개 테스트 통과
* `npm run build` - `/api/gas` 포함 전체 19개 라우트 생성 완료

### TODO

* 격리된 mock Spreadsheet와 실제 배포 URL로 Phase 4 통합 호출 검증
* Google OAuth 신원 검증
* Users / Cells 관리 화면 및 Absence / Settings / Backup 실제 API 연동
* `admin,cell_leader` 겸임자의 leaderMode 서버 조회 범위 분리

---

## 2026-06-14 - Supabase 전환 1단계 기반 준비

### Summary

* 서비스 중단을 허용하는 Supabase 일괄 전환 계획을 `TODOLIST.md`에 기록했다.
* Supabase CLI를 개발 의존성으로 설치하고 로컬 실행 스크립트를 추가했다.
* `supabase/config.toml`, migration 디렉터리, 프로젝트 연결 안내를 추가했다.
* 환경변수 템플릿과 핵심 요구사항, DB, 권한, 개인정보, 개발 계획 문서를 Supabase 전환 결정에 맞게 동기화했다.
* 기존 Apps Script 런타임은 Supabase 전환 완료 전까지 유지한다.

### Changed Files

* `TODOLIST.md`
* `supabase/config.toml`
* `supabase/migrations/.gitkeep`
* `supabase/README.md`
* `.env.example`
* `.gitignore`
* `AGENTS.md`
* `README.md`
* `docs/01_REQUIREMENTS.md`
* `docs/02_DB_SCHEMA.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/07_PRIVACY_POLICY.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `package.json`
* `package-lock.json`
* `HISTORY.md`

### Reason

* Google Apps Script 호출 지연 문제를 해결하고 PostgreSQL 인덱스, 관계형 제약조건, RLS 기반 권한 검증을 적용하기 위함.

### Checks

* Supabase CLI `2.106.0` 실행 확인
* `npm run supabase:status -- --output json` - config 파싱 후 로컬 Docker daemon 미실행으로 중단
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 34개 테스트 통과
* `npm run build` - 전체 19개 라우트 생성 완료

### TODO

* Supabase hosted project 생성
* Project URL, publishable key, secret key를 `.env.local`과 Vercel에 등록
* CLI로 hosted project link 확인
* 2단계 PostgreSQL schema와 RLS migration 구현

---

## 2026-06-12 - Phase 5 Google OAuth 및 role 접근 제어

### Summary

* Auth.js Google OAuth provider와 암호화 JWT 로그인 세션을 적용했다.
* 로그인 및 세션 확인 시 Apps Script `verifyUser`를 호출해 미등록·비활성 계정을 차단한다.
* admin, cell_leader, 복수 role에 따라 로그인 redirect와 메뉴를 분기한다.
* middleware, 보호 layout, Admin layout에서 페이지 접근 권한을 서버 측으로 검증한다.
* `/api/gas`가 보호 요청 이메일을 세션 이메일로 강제하고, Apps Script가 `API_PROXY_SECRET`을 확인하도록 보강했다.

### Changed Files

* `auth.ts`
* `middleware.ts`
* `types/next-auth.d.ts`
* `lib/auth.ts`
* `lib/auth.test.ts`
* `lib/gas-server.ts`
* `components/auth-provider.tsx`
* `components/app-shell.tsx`
* `components/admin-guard.tsx`
* `app/layout.tsx`
* `app/login/page.tsx`
* `app/auth/after-login/page.tsx`
* `app/(protected)/layout.tsx`
* `app/(protected)/admin/layout.tsx`
* `app/api/auth/[...nextauth]/route.ts`
* `app/api/gas/route.ts`
* `gas-backend/Auth.gs`
* `gas-backend/Config.gs`
* `.env.example`
* `package.json`
* `package-lock.json`
* `README.md`
* `docs/04_API_SPEC.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/07_PRIVACY_POLICY.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `HISTORY.md`

### Reason

* Google 로그인 이메일을 신뢰 가능한 세션 신원으로 사용하고 role 기반 페이지·API 접근 제어를 실제 적용하기 위함.

### Checks

* Apps Script 전체 `.gs` JavaScript 구문 검사 - 통과
* Apps Script trusted proxy secret guard stub - 통과
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 35개 테스트 통과
* `npm run build` - Auth route와 middleware 포함 전체 21개 라우트 생성 완료
* `npm audit --omit=dev` - Next.js 내부 PostCSS 관련 moderate 2건 확인, 현재 설치 범위 내 비파괴 fix 없음

### TODO

* 실제 Google OAuth client와 격리된 mock Spreadsheet를 사용한 로그인 통합 검증
* `admin,cell_leader` 겸임자의 leaderMode 서버 조회 범위 분리
* OAuth 로그인·로그아웃 브라우저 자동화 테스트
* Auth.js middleware Edge Runtime 경고와 Next.js 내부 PostCSS advisory 후속 버전 점검

---

## 2026-06-12 - Apps Script DB 자동 초기화 함수

### Summary

* `initializeDatabase()`로 DB Schema 기준 12개 Sheet와 첫 행 헤더를 자동 생성하도록 구현했다.
* 반복 실행 시 기존 데이터와 헤더를 덮어쓰지 않고 문서화된 누락 헤더만 오른쪽에 추가하도록 했다.
* 알 수 없는 컬럼, 중복 컬럼, 중간 빈 컬럼은 자동 변경하지 않고 오류로 중단한다.
* `validateDatabaseSchema()`로 쓰기 없이 전체 Sheet 구성을 검사할 수 있도록 했다.
* 실제 사용자, 성도, 새신자 등 개인정보 데이터는 자동 생성하지 않는다.

### Changed Files

* `gas-backend/Initializer.gs`
* `gas-backend/Sheets.gs`
* `docs/02_DB_SCHEMA.md`
* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `README.md`
* `HISTORY.md`

### Reason

* Apps Script와 Spreadsheet를 처음 설정할 때 수동 Sheet·헤더 생성 과정의 누락과 오타를 줄이기 위함.

### Checks

* Apps Script 16개 `.gs` 파일 JavaScript 구문 검사 - 통과
* Apps Script 메모리 Spreadsheet stub - 최초 생성, 누락 헤더 추가, 기존 행 보존, 재실행 멱등성, 스키마 검증, 알 수 없는 헤더 차단 통과
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 35개 테스트 통과
* `npm run build` - 통과, 기존 Auth.js middleware Edge Runtime 경고 유지

### TODO

* 실제 빈 테스트 Spreadsheet에서 `initializeDatabase()` 최초 실행 확인
* 최초 Admin 계정은 자동 생성하지 않고 운영자가 `users` Sheet에 직접 등록

---

## 2026-06-14 - Runtime mock 제거 및 운영 관리 API 연결

### Summary

* 사용자가 실제 빈 테스트 Spreadsheet에서 `initializeDatabase()` 실행을 검증했다.
* 프론트엔드 API client의 개발용 mock fallback과 관리자 화면의 mock 동작을 제거했다.
* Users, Cells 관리 화면을 기존 Apps Script 관리 API에 연결했다.
* Absence, Settings, Backup Apps Script API와 실제 관리자 화면 연동을 구현했다.
* 백업은 `BACKUP_FOLDER_ID`에 지정된 Google Drive 폴더에 CSV ZIP 또는 XLSX로 생성한다.

### Changed Files

* `lib/api.ts`
* `lib/api.test.ts`
* `lib/types.ts`
* `lib/mock-data.ts`
* `app/(protected)/admin/users/page.tsx`
* `app/(protected)/admin/cells/page.tsx`
* `app/(protected)/admin/absence/page.tsx`
* `app/(protected)/admin/settings/page.tsx`
* `app/(protected)/admin/backup/page.tsx`
* `app/newcomer/complete/page.tsx`
* `components/newcomer-form.tsx`
* `gas-backend/Absence.gs`
* `gas-backend/Settings.gs`
* `gas-backend/Backup.gs`
* `gas-backend/Config.gs`
* `gas-backend/Router.gs`
* `.env.example`
* `README.md`
* `docs/04_API_SPEC.md`
* `docs/08_DEVELOPMENT_PLAN.md`
* `docs/10_APPS_SCRIPT_DEPLOYMENT.md`
* `HISTORY.md`

### Reason

* 초기 mock UI 단계를 종료하고 Google Apps Script와 Google Sheets를 실제 런타임 데이터 계층으로 사용하기 위함.
* API 설정 누락이나 호출 실패가 mock 데이터로 조용히 대체되지 않도록 하기 위함.

### Checks

* Apps Script 전체 `.gs` 파일 JavaScript 구문 검사 - 통과
* 프로덕션 경로의 `mockApi`, `mock-data`, mock fallback 참조 없음 확인
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 34개 테스트 통과
* `npm run build` - 전체 19개 라우트 생성 완료, 기존 Auth.js Edge Runtime 경고 유지
* `npm run dev` 브라우저 확인 - 로컬 서버 실행 권한 미승인으로 미실행

### TODO

* Apps Script에 `BACKUP_FOLDER_ID`를 설정하고 CSV ZIP / XLSX 실제 Drive 생성 검증
* 새 Absence / Settings / Backup action을 포함해 Apps Script Web App 새 버전 배포
* 실제 Google OAuth 세션으로 관리자 Users / Cells / Absence / Settings / Backup 통합 확인
* `admin,cell_leader` 겸임자의 leaderMode 서버 조회 범위 분리

---

## 2026-06-14 - Supabase 초기 PostgreSQL 스키마 및 RLS

### Summary

* 기존 12개 Sheet 엔티티를 UUID 기반 PostgreSQL 초기 migration으로 변환했다.
* 외래키, enum/check/unique 제약, 주요 조회 인덱스, `updated_at` trigger와 기본 settings를 추가했다.
* `auth.users` 매핑과 Admin/셀리더 배정 셀 접근 helper 및 전체 RLS 정책을 구현했다.
* `anon` 직접 테이블 접근을 차단하고 공개 새신자 제출은 서버 전용 Route Handler를 사용하도록 설계했다.
* pgTAP 기반 스키마·Admin·셀리더·비활성·익명 권한 테스트 28개를 추가했다.

### Changed Files

* `supabase/migrations/202606140001_initial_schema_and_rls.sql`
* `supabase/tests/database/initial_schema_rls.test.sql`
* `supabase/README.md`
* `package.json`
* `README.md`
* `TODOLIST.md`
* `docs/02_DB_SCHEMA.md`
* `docs/04_API_SPEC.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/07_PRIVACY_POLICY.md`
* `HISTORY.md`

### Reason

* Google Apps Script / Google Sheets 런타임을 Supabase로 일괄 전환하기 위한 운영 데이터 계층과 서버 권한 경계를 먼저 확립하기 위함.

### Checks

* 12개 앱 테이블 및 12개 RLS 활성화 구문 정적 확인 - 통과
* pgTAP 테스트 정의 28개 정적 확인 - 통과
* `git diff --check` - 통과
* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 34개 테스트 통과
* `npm run build` - 전체 19개 라우트 생성 완료, 기존 Auth.js Edge Runtime 경고 유지
* `npm run supabase:reset`, `npm run supabase:test`, `npm run supabase:lint` - Docker/Postgres 미기동으로 미실행

### TODO

* Docker Desktop 실행 후 Supabase reset, pgTAP RLS 테스트, DB lint 통과 확인
* hosted Supabase 프로젝트 생성 및 link 후 migration 적용 확인
* 공개 새신자 제출용 Next.js Route Handler 구현

---

## 2026-06-14 - Hosted Supabase 초기 Migration 적용

### Summary

* Supabase CLI를 hosted 프로젝트에 연결했다.
* 초기 PostgreSQL schema와 RLS migration을 원격 DB에 적용했다.
* 로컬 및 원격 migration 버전이 `202606140001`로 일치함을 확인했다.
* 원격 `public`, `extensions` schema lint에서 오류가 없음을 확인했다.

### Changed Files

* `TODOLIST.md`
* `HISTORY.md`

### Reason

* Vercel의 후속 Supabase API 전환 전에 hosted 데이터베이스 기반과 RLS 정책을 배포하기 위함.

### Checks

* `supabase db push --include-all` - 통과
* `supabase migration list --linked` - 로컬/원격 `202606140001` 일치
* `supabase db lint --linked --level warning --fail-on error` - 오류 없음
* `supabase test db --linked` - Supabase CLI 테스트 러너가 Docker 이미지를 요구하여 미실행

### TODO

* Docker 사용 가능한 환경에서 pgTAP RLS 테스트 28개 실행
* Supabase browser/server client 구성
* 공개 새신자 제출용 Next.js Route Handler 구현

---

## 2026-06-14 - Supabase 12개 테이블 샘플 데이터

### Summary

* 12개 앱 테이블의 UUID, 외래키, 배열, enum, 날짜, jsonb 형식을 보여주는 참고용 SQL을 추가했다.
* 샘플은 명시적인 가짜 개인정보와 가짜 돌봄 내용만 사용하며 자동 실행되지 않는다.

### Changed Files

* `supabase/examples/sample-data.sql`
* `supabase/README.md`
* `HISTORY.md`

### Reason

* Supabase Table Editor와 SQL Editor에서 각 테이블에 데이터를 어떤 형식으로 입력해야 하는지 쉽게 확인하기 위함.

### Checks

* 12개 앱 테이블 insert 구문 포함 확인
* 외래키 입력 순서 및 migration 제약조건 정적 확인
* `git diff --check` - 통과

### TODO

* 실제 데이터 반입 전 CSV dry-run 검증 및 UUID 매핑 import 도구 구현

---

## 2026-06-14 - Admin 성도 CSV 일괄 등록

### Summary

* Admin이 CSV 템플릿을 내려받고 최대 500명의 성도를 검증·확인 후 일괄 등록하는 화면을 추가했다.
* 서버 Route Handler가 Admin 세션과 CSV를 재검증하고 Supabase secret을 브라우저에 노출하지 않도록 했다.
* service-role 전용 PostgreSQL RPC가 UUID 생성, 성도, 최초 셀 이력, 최소 audit log를 하나의 트랜잭션으로 저장한다.
* CSV 미리보기와 오류 메시지에서 민감정보 원문을 제외했다.

### Changed Files

* `app/(protected)/admin/members/import/page.tsx`
* `app/api/admin/members/import/route.ts`
* `components/app-shell.tsx`
* `lib/member-csv.ts`
* `lib/member-csv.test.ts`
* `lib/supabase-server.ts`
* `supabase/migrations/202606140002_member_csv_import.sql`
* `supabase/tests/database/member_csv_import.test.sql`
* 관련 요구사항, 스키마, 화면, API, 권한, 개인정보, Supabase 문서
* `TODOLIST.md`
* `HISTORY.md`

### Reason

* 성도 데이터를 Table Editor에서 한 명씩 입력하지 않고 앱에서 안전하게 대량 등록하기 위함.

### Checks

* `npm run lint` - 통과
* `npm run typecheck` - 통과
* `npm run test` - 38개 테스트 통과
* `git diff --check` - 통과

### TODO

* hosted Supabase에 CSV import RPC migration 적용
* Docker 사용 가능한 환경에서 RPC pgTAP 테스트 실행

---

## 2026-06-14 - 앱 런타임 Supabase 전환

### Summary

* Auth.js와 `/api/gas`를 제거하고 Supabase Auth Google OAuth와 `/api/supabase`로 교체했다.
* Members, Reports, Newcomers, Users, Cells, Absence, Settings 흐름을 Supabase PostgreSQL에 연결했다.
* 공개 새신자 제출과 Admin 성도 CSV 등록은 서버 전용 secret key 경로를 유지했다.
* 앱 내 Drive 백업 버튼을 비활성화하고 Supabase Dashboard 백업 안내로 교체했다.

### Changed Files

* `app/api/supabase/route.ts`, `app/auth/*`, 보호 layout과 로그인 화면
* `lib/api.ts`, `lib/supabase/*`, `middleware.ts`, `components/auth-provider.tsx`
* Admin 화면 문구, `README.md`, 관련 문서, `TODOLIST.md`

### Checks

* `npm run test` - 38개 테스트 통과
* `npm run lint` - 통과
* `npm run build` - 22개 route 생성 완료

### TODO

* Vercel에 `NEXT_PUBLIC_SITE_URL`과 Supabase 환경변수 등록
* Supabase Auth Redirect URL allow list에 배포 도메인의 `/auth/callback` 등록
* private Storage 사진 업로드와 앱 내 내보내기 기능 구현

---

## 2026-06-14 - Hosted Supabase Google OAuth 활성화

### Summary

* hosted Supabase Auth에서 Google provider를 활성화했다.
* 최초 Google 로그인 사용자가 `auth.users`에 생성될 수 있도록 signup을 허용했다.
* 앱 접근은 계속 `public.users`의 등록 상태, active, roles 검증으로 제한한다.

### Changed Files

* `supabase/config.toml`
* `README.md`
* `TODOLIST.md`
* `HISTORY.md`

### Checks

* hosted Auth config에서 `external_google_enabled = true`, `disable_signup = false` 확인
* Google authorize endpoint가 `302`로 Google OAuth 화면에 리디렉션됨을 확인

### TODO

* Vercel 배포 도메인의 `/auth/callback`을 Supabase Redirect URL allow list에 등록하고 실제 로그인 검증

---

## 2026-06-15 - 주간 리포트 출결 우선 작성 흐름

### Summary

* `/reports/new`를 출결 입력과 나눔 작성의 2단계 흐름으로 변경했다.
* 전체 인원의 출결을 촘촘한 목록에서 선택하고 현황을 즉시 확인할 수 있게 했다.
* 모두 출석 일괄 선택과 나눔 작성 단계의 출결 결과 요약 및 출결 수정 이동을 추가했다.
* 기존 리포트 상세 수정 화면은 인원별 출결·나눔 수정 흐름을 유지했다.

### Changed Files

* `components/attendance-overview.tsx`
* `components/report-form.tsx`
* `docs/01_REQUIREMENTS.md`
* `docs/03_SCREEN_FLOW.md`
* `docs/09_DESIGN_SYSTEM.md`
* `HISTORY.md`

### Reason

* 최초 리포트 작성 시 성도별 긴 카드를 스크롤하며 출결을 입력하는 부담을 줄이기 위함.

### Checks

* `npm.cmd run lint` - 통과
* `npm.cmd run typecheck` - 통과
* `npm.cmd run test` - 38개 테스트 통과
* `npm.cmd run build` - 전체 22개 route 생성 완료, 기존 Supabase Edge Runtime 경고 유지
* `git diff --check` - 통과

### TODO

* 실제 셀 인원 규모로 모바일 출결 입력 밀도 사용성 확인

---

## 2026-06-15 - 출결 명단 그리드 입력

### Summary

* 사람별 한 줄 입력 대신 이름 카드가 여러 열로 보이는 명단 그리드로 변경했다.
* 출석, 결석, 사유 결석, 미확인 입력 모드를 선택한 뒤 여러 사람을 연속으로 선택할 수 있게 했다.
* 기본 출석 모드에서 출석한 사람만 빠르게 선택할 수 있게 했다.
* 미선택 인원은 자동 결석 처리하지 않고 명시적인 버튼으로 결석 처리하도록 했다.

### Changed Files

* `components/attendance-overview.tsx`
* `docs/01_REQUIREMENTS.md`
* `docs/03_SCREEN_FLOW.md`
* `docs/09_DESIGN_SYSTEM.md`
* `HISTORY.md`

### Reason

* 사람별 행을 반복하지 않고 전체 명단을 한눈에 보면서 상태별 인원을 빠르게 선택하기 위함.

### Checks

* `npm.cmd run lint` - 통과
* `npm.cmd run typecheck` - 통과
* `npm.cmd run test` - 38개 테스트 통과
* `git diff --check` - 통과

### TODO

* 실제 셀 인원 규모에서 명단 그리드 열 수와 카드 밀도 확인

---

## 2026-06-15 - 출결 명단 칩 고밀도 표시

### Summary

* 출결 명단의 큰 이름 카드를 작은 이름 칩으로 축소했다.
* 모바일 3열, 데스크톱 최대 6열로 한 화면에 더 많은 인원이 보이게 했다.
* 상태는 이름 옆 색상 점과 칩 배경으로 표시하도록 단순화했다.

### Changed Files

* `components/attendance-overview.tsx`
* `docs/09_DESIGN_SYSTEM.md`
* `HISTORY.md`

### Reason

* 출결 명단 카드가 불필요하게 큰 공간을 차지해 전체 인원을 한눈에 보기 어려운 문제를 개선하기 위함.

### Checks

* `npm.cmd run lint` - 통과
* `npm.cmd run typecheck` - 통과
* `npm.cmd run test` - 38개 테스트 통과
* `git diff --check` - 통과

### TODO

* 긴 이름의 말줄임 표시와 실제 모바일 터치 편의 확인

---

## 2026-06-15 - 출석 인원 중심 나눔 작성

### Summary

* 나눔 작성 단계에서 출석 인원의 개인 기록 카드만 기본 표시하도록 변경했다.
* 비출석 인원은 작은 기록 추가 목록으로 분리하고 필요할 때만 카드를 열 수 있게 했다.
* 기존 나눔 또는 기도제목이 있는 비출석 인원은 기록 보존을 위해 계속 표시한다.
* 나눔과 기도제목 일괄 입력의 이름 매칭 대상도 출석 인원으로 제한했다.

### Changed Files

* `components/report-form.tsx`
* `docs/01_REQUIREMENTS.md`
* `docs/03_SCREEN_FLOW.md`
* `docs/09_DESIGN_SYSTEM.md`
* `HISTORY.md`

### Reason

* 결석한 사람의 빈 나눔·기도제목 입력 카드가 불필요한 스크롤과 작성 부담을 만드는 문제를 줄이기 위함.

### Checks

* `npm.cmd run lint` - 통과
* `npm.cmd run typecheck` - 통과
* `npm.cmd run test` - 38개 테스트 통과
* `git diff --check` - 통과

### TODO

* 비출석 인원 기록 추가 후 다시 접는 동작 필요 여부 확인

---

## 2026-06-15 - 리포트 제출 후 대시보드 이동

### Summary

* `/reports/new`에서 확인 후 제출이 성공하면 셀리더 대시보드 `/dashboard`로 이동하도록 변경했다.
* 임시저장은 기존처럼 작성 화면에 머물며 초안을 다시 불러온다.
* 제출 실패 시 작성 화면에 머물며 오류를 표시한다.

### Changed Files

* `components/report-form.tsx`
* `docs/01_REQUIREMENTS.md`
* `docs/03_SCREEN_FLOW.md`
* `HISTORY.md`

### Reason

* 리포트 제출 완료 후 사용자가 대시보드에서 이번 주 리포트 상태를 바로 확인할 수 있도록 하기 위함.

### Checks

* `npm.cmd run lint` - 통과
* `npm.cmd run typecheck` - 통과
* `npm.cmd run test` - 38개 테스트 통과
* `git diff --check` - 통과

### TODO

* 브라우저에서 제출 성공 후 대시보드 상태 갱신 확인

---

## 2026-06-15 - Admin 및 셀리더 성도 정보 수정

### Summary

* 성도 상세 화면에 읽기·편집 전환과 성도 정보 수정 폼을 추가했다.
* Admin은 전체 성도의 기본 정보, 소속 셀, 상태를 수정할 수 있게 했다.
* 셀리더는 담당 셀 성도의 기본 정보만 수정할 수 있고 소속 셀과 상태 변경은 차단했다.
* 소속 셀 변경 시 셀 변경 이력을 남기고, 수정 시 개인정보 원문 없는 최소 감사 로그를 기록한다.
* 기존 성도 상세 화면의 깨진 한글 문구를 정상 문구로 정리했다.

### Changed Files

* `app/(protected)/members/[id]/page.tsx`
* `app/api/supabase/route.ts`
* `components/member-edit-form.tsx`
* `lib/api.ts`
* `docs/01_REQUIREMENTS.md`
* `docs/03_SCREEN_FLOW.md`
* `docs/04_API_SPEC.md`
* `docs/05_PERMISSION_RULES.md`
* `docs/07_PRIVACY_POLICY.md`
* `HISTORY.md`

### Reason

* Admin과 담당 셀리더가 성도 목록에서 상세 화면으로 이동해 최신 성도 정보를 직접 관리할 수 있도록 하기 위함.

### Checks

* `npm.cmd run lint` - 통과
* `npm.cmd run typecheck` - 통과
* `npm.cmd run test` - 38개 테스트 통과
* `npm.cmd run build` - 전체 22개 route 생성 완료
* `git diff --check` - 통과

### TODO

* 실제 Supabase 데이터로 Admin 소속 셀 변경과 셀리더 권한 차단 통합 확인
