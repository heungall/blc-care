# BLC Care Development Plan

## 1. 문서 개요

본 문서는 BLC Care의 개발 단계, 작업 순서, 구현 우선순위, Codex 작업 지시 기준을 정의한다.

BLC Care는 다음 기술 스택을 기준으로 개발한다.

```txt
Frontend: Next.js + TypeScript
UI: Tailwind CSS + shadcn/ui
Backend: Google Apps Script Web App
Database: Google Sheets
File Storage: Google Drive
Auth: Google OAuth
Deploy: Vercel
```

---

# 2. 개발 원칙

## 2.1 핵심 원칙

```txt
1. 실제 성도 데이터 없이 mock data로 먼저 개발한다.
2. 화면 흐름을 먼저 만들고, 이후 Google Sheets API를 연결한다.
3. 개인정보와 기도제목은 외부 AI API로 전송하지 않는다.
4. 권한 검증은 프론트엔드와 Apps Script 양쪽에서 모두 수행한다.
5. Google Sheets row number에 의존하지 않고 ID 기반으로 처리한다.
6. 향후 DB 이전을 고려하여 API 계층을 분리한다.
```

---

## 2.2 Codex 작업 원칙

Codex에게 한 번에 전체 시스템을 만들게 하지 않는다.

작업은 작게 나누어 진행한다.

좋은 지시 예시:

```txt
이번 작업에서는 mock data 기반으로 /members 목록 화면과 /members/[id] 상세 화면만 구현해주세요.
실제 Apps Script API 연동은 하지 마세요.
타입 정의와 컴포넌트 분리를 함께 진행해주세요.
```

나쁜 지시 예시:

```txt
BLC Care 전체 앱을 다 만들어줘.
```

---

# 3. 전체 개발 단계

```txt
Phase 0. 프로젝트 준비
Phase 1. Mock UI 구현
Phase 2. 타입/도메인 로직 구현
Phase 3. Google Apps Script API 구현
Phase 4. 프론트엔드 API 연동
Phase 5. Google OAuth 및 권한 적용
Phase 6. 운영 기능 구현
Phase 7. 테스트 및 배포
Phase 8. 실제 데이터 반입
```

---

# 4. Phase 0. 프로젝트 준비

## 4.1 목표

개발을 시작할 수 있는 기본 환경을 만든다.

## 4.2 작업 항목

```txt
1. GitHub 저장소 생성
2. Next.js 프로젝트 생성
3. Tailwind CSS 설정
4. shadcn/ui 설정
5. 기본 폴더 구조 생성
6. docs 폴더 생성
7. 요구사항 문서 추가
8. mock data 작성
9. Google Drive 폴더 구조 생성
10. Google Sheets DB 파일 생성
```

## 4.3 산출물

```txt
GitHub repository
Next.js 기본 앱
docs/
mock data
Google Sheets DB 파일
Google Drive 폴더
```

## 4.4 완료 기준

```txt
npm run dev 실행 가능
기본 홈 화면 표시
docs 문서 저장 완료
mock data 파일 생성 완료
```

---

# 5. Phase 1. Mock UI 구현

## 5.1 목표

실제 API 없이 mock data 기반으로 전체 화면 흐름을 구현한다.

## 5.2 구현 화면

### 1순위

```txt
/
/login
/dashboard
/members
/members/[id]
/reports
/reports/new
/reports/[id]
```

### 2순위

```txt
/newcomer
/newcomer/complete
/admin/dashboard
/admin/newcomers
/admin/absence
```

### 3순위

```txt
/admin/cells
/admin/users
/admin/settings
/admin/backup
```

## 5.3 주요 작업

```txt
1. App Router 라우팅 구성
2. 로그인 전 레이아웃 구현
3. 로그인 후 레이아웃 구현
4. 사이드바/모바일 네비게이션 구현
5. role 기반 메뉴 표시 mock 구현
6. 성도 목록 화면 구현
7. 성도 상세 화면 구현
8. 리포트 작성 화면 구현
9. 기도제목 자동 분리 UI 구현
10. 새신자 등록폼 구현
11. Admin 대시보드 구현
```

## 5.4 완료 기준

```txt
모든 주요 라우트 접근 가능
mock user 변경 시 admin/cell_leader 화면 분기 확인 가능
성도 목록에서 상세 페이지 이동 가능
리포트 작성 화면에서 mock 저장 동작 확인 가능
모바일 화면에서 리포트 작성 UI가 깨지지 않음
```

---

# 6. Phase 2. 타입/도메인 로직 구현

## 6.1 목표

DB Schema와 API Spec에 맞는 TypeScript 타입과 핵심 비즈니스 로직을 구현한다.

## 6.2 작업 항목

```txt
1. User 타입 정의
2. Cell 타입 정의
3. UserCellAssignment 타입 정의
4. Member 타입 정의
5. WeeklyReport 타입 정의
6. WeeklyMemberRecord 타입 정의
7. MemberNote 타입 정의
8. Newcomer 타입 정의
9. AbsenceAlert 타입 정의
10. Settings 타입 정의
11. AuditLog 타입 정의
```

## 6.3 도메인 로직

```txt
1. role 판별 함수
2. 담당 셀 조회 함수
3. 성도 접근 권한 확인 함수
4. 리포트 수정 가능 여부 확인 함수
5. 장기결석자 계산 함수
6. 기도제목 파서 함수
7. 이름 정규화 함수
8. 셀 변경 이력 생성 함수
```

## 6.4 완료 기준

```txt
TypeScript 타입 에러 없음
기도제목 파서 테스트 통과
권한 판단 함수 테스트 통과
장기결석자 계산 함수 테스트 통과
```

---

# 7. Phase 3. Google Apps Script API 구현

## 7.1 목표

Google Sheets를 데이터 저장소로 사용하는 Apps Script API를 구현한다.

## 7.2 Apps Script 폴더 구조

```txt
gas-backend/
├─ appsscript.json
├─ Code.gs
├─ Router.gs
├─ Response.gs
├─ Auth.gs
├─ Sheets.gs
├─ Users.gs
├─ Cells.gs
├─ Members.gs
├─ Reports.gs
├─ PrayerParser.gs
├─ Notes.gs
├─ Newcomers.gs
├─ Absence.gs
├─ Settings.gs
├─ Backup.gs
└─ AuditLogs.gs
```

## 7.3 구현 순서

```txt
1. 공통 response helper
2. 공통 error helper
3. Sheet read/write helper
4. ID 생성 helper
5. Auth API
6. Users API
7. Cells API
8. Members API
9. Reports API
10. Prayer Parser API
11. Notes API
12. Newcomers API
13. Absence API
14. Settings API
15. Backup API
16. Audit Log API
```

## 7.4 우선 구현 API

```txt
verifyUser
getMembers
getMemberDetail
getWeeklyReportDraft
saveWeeklyReport
parsePrayerRequests
createNewcomer
getNewcomers
convertNewcomerToMember
getLongAbsenceMembers
```

## 7.5 완료 기준

```txt
Apps Script Web App 배포 URL 생성
Postman 또는 curl로 주요 API 호출 가능
Google Sheets에 데이터 생성/수정 확인
공통 응답 형식 준수
권한 없는 요청 차단
```

---

# 8. Phase 4. 프론트엔드 API 연동

## 8.1 목표

Next.js 프론트엔드에서 Apps Script API를 호출하도록 연결한다.

## 8.2 작업 항목

```txt
1. lib/api.ts 작성
2. 공통 fetch wrapper 작성
3. API error handling 구현
4. loading 상태 처리
5. empty state 처리
6. verifyUser 연동
7. members API 연동
8. reports API 연동
9. prayer parser API 또는 로컬 parser 연동
10. newcomers API 연동
11. absence API 연동
```

## 8.3 API 클라이언트 구조

```txt
lib/
├─ api.ts
├─ auth.ts
├─ permissions.ts
├─ prayer-parser.ts
├─ date.ts
└─ types.ts
```

## 8.4 완료 기준

```txt
mock data 제거 또는 분리
실제 Google Sheets 데이터 조회 가능
성도 목록 조회 가능
리포트 저장 시 Sheets에 반영
새신자 등록 시 newcomers Sheet에 반영
API 오류 메시지 표시
```

---

# 9. Phase 5. Google OAuth 및 권한 적용

## 9.1 목표

구글 로그인과 role 기반 접근 제어를 적용한다.

## 9.2 작업 항목

```txt
1. Google OAuth 설정
2. 로그인 세션 관리
3. verifyUser 호출
4. roles 기반 메뉴 표시
5. admin 페이지 접근 제어
6. cell_leader 배정 셀 접근 제한
7. admin + cell_leader 겸임자 흐름 적용
8. 비로그인 사용자 redirect 처리
```

## 9.3 완료 기준

```txt
미로그인 사용자는 보호 페이지 접근 불가
미등록 계정은 접근 불가
admin은 전체 데이터 접근 가능
cell_leader는 배정 셀 데이터만 접근 가능
admin,cell_leader 겸임자는 두 기능 모두 접근 가능
```

---

# 10. Phase 6. 운영 기능 구현

## 10.1 목표

실제 교회 운영에 필요한 기능을 완성한다.

## 10.2 작업 항목

```txt
1. 성도 사진 업로드
2. Google Drive 사진 저장
3. 성도 휴면 처리
4. 셀 변경 이력 저장
5. 특이사항 해결 체크
6. 장기결석자 확인/해결 처리
7. 설정 화면
8. 백업 생성
9. Audit Log 조회
```

## 10.3 완료 기준

```txt
사진 업로드 가능
성도 상태 변경 가능
셀 변경 시 이력 생성
특이사항 해결 처리 가능
장기결석자 목록 확인 가능
백업 생성 가능
중요 작업 audit log 기록
```

---

# 11. Phase 7. 테스트 및 배포

## 11.1 목표

실사용 전 오류를 점검하고 Vercel에 배포한다.

## 11.2 테스트 항목

```txt
1. 로그인 테스트
2. role별 접근 테스트
3. 성도 목록/상세 조회 테스트
4. 리포트 작성/수정 테스트
5. 기도제목 자동 분리 테스트
6. 새신자 등록 테스트
7. 새신자 성도 전환 테스트
8. 장기결석자 계산 테스트
9. 모바일 UI 테스트
10. 백업 테스트
```

## 11.3 배포 작업

```txt
1. Vercel 프로젝트 생성
2. 환경변수 등록
3. Production 배포
4. Apps Script Web App URL 등록
5. Google OAuth redirect URL 확인
6. 실제 접속 테스트
```

## 11.4 완료 기준

```txt
Vercel 배포 URL 접속 가능
로그인 가능
주요 기능 정상 동작
모바일에서 셀리더 리포트 작성 가능
Admin 기능 정상 동작
```

---

# 12. Phase 8. 실제 데이터 반입

## 12.1 목표

실제 성도 데이터를 안전하게 반입한다.

## 12.2 반입 전 조건

```txt
1. 권한 제어 구현 완료
2. 백업 폴더 생성 완료
3. Admin 계정 등록 완료
4. 셀리더 계정 등록 완료
5. 테스트 데이터로 기능 검증 완료
6. 개인정보 접근 범위 확인 완료
```

## 12.3 반입 대상

```txt
members
cells
user_cell_assignments
settings
```

## 12.4 반입 순서

```txt
1. cells 등록
2. users 등록
3. user_cell_assignments 등록
4. members 등록
5. cell_member_history 초기 이력 생성
6. 백업 생성
7. 화면 조회 확인
```

## 12.5 완료 기준

```txt
성도 목록 정상 표시
셀 필터 정상 동작
셀리더별 담당 셀 접근 확인
Admin 전체 조회 확인
```

---

# 13. Codex 첫 작업 지시문

아래 프롬프트를 Codex 첫 작업으로 사용한다.

```txt
이 프로젝트는 BLC Care라는 교회 출결 및 성도 돌봄 관리 웹앱입니다.

먼저 실제 Google Apps Script API 연동 없이 mock data 기반으로 프론트엔드 기본 구조를 구현해주세요.

기술 스택:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

참고 문서:
- docs/01_REQUIREMENTS.md
- docs/02_DB_SCHEMA.md
- docs/03_SCREEN_FLOW.md
- docs/04_API_SPEC.md
- docs/05_PERMISSION_RULES.md
- docs/06_PRAYER_PARSER_RULES.md
- docs/07_PRIVACY_POLICY.md
- docs/09_DESIGN_SYSTEM.md

이번 작업 범위:
1. 기본 라우팅 구조 생성
2. 공통 레이아웃 생성
3. mock user 기반 roles 분기 구현
4. mock data 작성
5. /, /login, /dashboard, /members, /members/[id], /reports, /reports/new 화면 구현
6. 기도제목 자동 분리 UI와 로컬 parser 함수 구현
7. 모바일 반응형 기본 대응
8. README에 실행 방법과 다음 작업 목록 작성

주의:
- 실제 개인정보를 넣지 마세요.
- 실제 Apps Script API 연동은 하지 마세요.
- API 호출부는 lib/api.ts에 mock 형태로 분리해주세요.
- users.roles는 배열처럼 다루되, DB 저장은 쉼표 문자열을 고려해주세요.
- admin과 cell_leader를 동시에 가진 사용자를 지원해주세요.
```

---

# 14. Phase별 Codex 지시문

## 14.1 Phase 1 지시문

```txt
mock data 기반으로 주요 화면을 구현해주세요.
실제 API 연동은 하지 말고, lib/mock-data.ts와 lib/api.ts를 분리해주세요.
```

## 14.2 Phase 2 지시문

```txt
docs/02_DB_SCHEMA.md와 docs/05_PERMISSION_RULES.md를 기준으로 TypeScript 타입과 권한 판단 유틸 함수를 구현해주세요.
```

## 14.3 Phase 3 지시문

```txt
docs/04_API_SPEC.md를 기준으로 Google Apps Script 백엔드 파일 구조와 Router, 공통 응답 helper, verifyUser API를 먼저 구현해주세요.
```

## 14.4 Phase 4 지시문

```txt
프론트엔드의 mock API를 실제 Apps Script API 호출 방식으로 교체할 수 있도록 lib/api.ts 구조를 정리해주세요.
```

## 14.5 Phase 5 지시문

```txt
Google OAuth 로그인과 verifyUser 응답을 기준으로 role 기반 라우팅과 메뉴 표시를 구현해주세요.
```

---

# 15. MVP 완료 기준

MVP는 다음 조건을 만족하면 완료로 본다.

```txt
1. Admin과 셀리더가 구글 로그인할 수 있다.
2. Admin은 전체 성도와 셀을 볼 수 있다.
3. 셀리더는 배정된 셀만 볼 수 있다.
4. Admin과 셀리더를 동시에 가진 사용자가 정상 동작한다.
5. 셀리더가 주차별 리포트를 작성할 수 있다.
6. 기도제목 일괄 입력이 사람별로 자동 분리된다.
7. 성도별 출결/나눔/기도제목 히스토리가 쌓인다.
8. 새신자가 로그인 없이 등록폼을 제출할 수 있다.
9. Admin이 새신자를 성도 DB로 전환할 수 있다.
10. 장기결석자를 조회할 수 있다.
11. 모바일에서 리포트 작성이 가능하다.
12. 핵심 데이터가 Google Sheets에 저장된다.
```

---

# 16. 개발 중 보류 항목

MVP 이후로 미룰 수 있는 항목은 다음과 같다.

```txt
AI 기반 기도제목 분석
카카오톡 연동
문자 발송
푸시 알림
모바일 앱 출시
통계 차트 고도화
고급 백업 자동화
다중 교회 지원
세부 권한 체계
```

---

# 17. 현재 구현 상태

2026-06-12 기준 Phase 1의 1순위, 2순위, 3순위 화면 구현이 완료되었다.

구현 완료:

```txt
App Router 기본 라우팅 및 공통 레이아웃
mock 사용자 기반 admin / cell_leader / 겸임 역할 전환
mock data 및 mock API adapter
/, /login, /dashboard, /members, /members/[id], /reports, /reports/new
선택된 셀 기준 로컬 규칙 기반 나눔 및 기도제목 parser와 확인 UI
모바일 하단 내비게이션 및 리포트 카드 입력 UI
/newcomer, /newcomer/complete
/admin/dashboard, /admin/newcomers, /admin/absence
/reports/[id]
/admin/cells, /admin/users, /admin/settings, /admin/backup
새신자 필수값 및 개인정보 동의 검증
Admin 전용 mock 접근 가드
새신자 상태 변경·성도 전환 및 장기결석 확인·해결 mock 동작
리포트 권한별 상세 조회·수정 mock 동작
셀·사용자·설정·백업 관리 mock 동작
```

Phase 1 다음 작업:

```txt
비로그인 보호 페이지 route guard mock
UI 상호작용 테스트 보강
동명이인·미매칭 일괄 입력 항목 직접 선택
```

실제 Google Apps Script API, Google OAuth, 실제 개인정보는 아직 사용하지 않는다.

---

# 18. Phase 2 구현 상태

2026-06-12 기준 Phase 2 타입 및 핵심 도메인 로직 구현을 완료했다.

```txt
DB Schema 기반 12개 Sheet TypeScript 엔티티 타입
DB 쉼표 문자열 roles / name_aliases 변환 helper
순수 권한 및 담당 셀 접근 helper
날짜 파싱, 주차, 월 계산 helper
장기결석자 계산 helper
리포트 수정 가능 여부 helper
규칙 기반 기도제목 parser 보강
스키마 기반 mock data 정리
```

Phase 3 이전 남은 보강:

```txt
도메인 helper를 실제 API 서버 권한 검증에 재사용
API payload 변환 타입 및 테스트
실제 Google Apps Script API는 Phase 3에서만 구현
```

---

# 19. Phase 3-1 구현 상태

2026-06-12 기준 Google Apps Script Web App 기본 구조와 Auth API 구현을 완료했다.

```txt
doGet / doPost action 라우터
공통 success / error 응답과 에러 코드
Script Properties의 SHEET_ID 설정 helper
ID 기반 Google Sheets read helper
users 이메일 조회와 활성 계정 검증
user_cell_assignments / cells 조합 assigned_cells 반환
verifyUser API
```

Phase 3-1 완료 시점 제한:

```txt
프론트엔드는 계속 mock API를 사용
requestUser.email은 Google OAuth 신원 검증 전이므로 운영 인증 수단이 아님
Members / Reports / Newcomers API 미구현
```

Phase 3-1 당시 다음 작업:

```txt
Users / Cells API와 서버 권한 helper 확장
Members / Reports API 구현
Google OAuth 신원 검증
프론트엔드 실제 API 연결
```

---

# 20. Phase 3-2 구현 상태

2026-06-12 기준 Members API와 Prayer Parser API 구현을 완료했다.

```txt
getMembers 필터, 정렬, 페이지네이션
목록 current_cell_name, last_attendance_date, unresolved_note_count 계산
getMemberDetail 기본 정보와 weekly_member_records / member_notes history
서버 측 Admin / cell_leader 성도 및 셀 접근 검증
name_aliases 쉼표 문자열 배열 변환
선택 셀 active 성도 한정 규칙 기반 parsePrayerRequests
matched / ambiguous / unmatched / invalid 결과
```

Phase 3-2 제한:

```txt
Parser 결과는 저장하지 않음
프론트엔드는 계속 mock API 사용
Google OAuth 신원 검증 미구현
Reports / Newcomers API 미구현
```

Phase 3 다음 작업:

```txt
Reports API와 리포트 저장 트랜잭션
Users / Cells 관리 API
Newcomers API
Google OAuth 신원 검증
프론트엔드 실제 API 연결
```

---

# 21. Phase 3-3 구현 상태

2026-06-12 기준 Apps Script Web App 배포 및 호출 확인 절차를 문서화했다.

```txt
격리된 mock Spreadsheet 최소 데이터 구성
Apps Script 프로젝트와 SHEET_ID Script Property 설정
/dev 테스트 배포와 /exec 버전 배포 절차
verifyUser / getMembers / parsePrayerRequests curl.exe 요청
ContentService JSON 리다이렉트와 curl -L 확인
TextOutput CORS 제약과 Next.js 서버 proxy 원칙
배포 오류 점검표
```

Phase 3-3 확인 결과:

```txt
현재 jsonResponse_는 ContentService.MimeType.JSON을 사용
curl / Postman / 서버 간 호출 방식은 지원 가능
브라우저에서 Apps Script 직접 fetch는 CORS 제약으로 사용하지 않음
실제 배포 호출은 TEST_SPREADSHEET_ID와 Web App 배포 URL 설정 후 수동 확인 필요
```

Phase 3 다음 작업:

```txt
격리된 mock Spreadsheet를 사용한 실제 /exec 호출 확인
Next.js 서버 proxy 설계
Google OAuth 신원 검증
Reports / Users / Cells / Newcomers API
```

---

# 22. Phase 3-4 구현 상태

2026-06-12 기준 주차별 셀 리포트 API 구현을 완료했다.

```txt
getReports / getReportDetail
getWeeklyReportDraft
saveWeeklyReport
weekly_cell_reports 및 weekly_member_records ID 기반 upsert
cell_id + week_start_date 및 report_id + member_id 중복 방지
LockService 기반 동시 저장 직렬화
Admin 전체 접근과 잠금 리포트 수정
cell_leader 활성 배정 셀 및 해당 주차 수정 제한
요청에서 빠진 기존 개인 기록 보존
```

Phase 3-4 제한:

```txt
Google Sheets는 트랜잭션 DB가 아니므로 다중 Sheet 완전 롤백은 지원하지 않음
저장 전 전체 payload 검증과 LockService로 부분 실패 가능성을 줄임
프론트엔드는 계속 mock API 사용
실제 Web App 저장 호출 미확인
```

Phase 3 다음 작업:

```txt
격리된 mock Spreadsheet에서 Reports API 실제 저장 호출 검증
Next.js 서버 proxy와 실제 API 연결
Google OAuth 신원 검증
Users / Cells / Newcomers API
```

---

# 23. Members 직장 정보 스키마 보강

2026-06-12 긴급 변경으로 성도 개인 상세에 아래 선택 필드를 추가했다.

```txt
workplace: 직장
occupation: 직업
job_title: 직책
```

적용 범위:

```txt
members Sheet 스키마와 TypeScript Member 타입
mock data 및 /members/[id] 상세 화면
Apps Script getMemberDetail 정규화와 API 명세
권한·개인정보·디자인·배포 문서
```

세 필드는 목록 응답과 목록 화면에는 노출하지 않고, 권한 검증을 통과한 성도 개인 상세에서만 반환·표시한다.

---

# 24. Phase 3-5 구현 상태

2026-06-12 기준 Admin 관리용 Users, Cells, Newcomers API 구현을 완료했다.

```txt
getUsers / createUser / updateUser
assignUserToCell / unassignUserFromCell
getCells / createCell / updateCell
createNewcomer / getNewcomers / updateNewcomerStatus
convertNewcomerToMember
Users / Cells / Newcomers 주요 변경 audit_logs 기록
```

새신자 전환은 `LockService` 안에서 중복 전환을 검사하고 `members`, 최초 `cell_member_history`, `newcomers`를 순서대로 기록한다. Google Sheets는 트랜잭션 DB가 아니므로 중간 Sheet 쓰기 실패 시 자동 rollback은 지원하지 않는다.

Phase 3-5 제한:

```txt
프론트엔드는 계속 mock API 사용
requestUser.email은 아직 Google OAuth 신원 검증 값이 아님
실제 Web App과 격리된 mock Spreadsheet 호출 검증 필요
다중 Sheet 쓰기 실패 복구 절차 필요
```

---

# 25. Phase 4 구현 상태

2026-06-12 기준 mock API 중심 프론트엔드를 Apps Script Web App 실제 호출 구조로 전환했다.

```txt
lib/api.ts 비동기 API client 및 개발용 mock fallback
NEXT_PUBLIC_GAS_API_URL 환경변수
Next.js /api/gas 서버 proxy
verifyUser 실제 호출
Members / Reports / Newcomers 실제 API 연동
공통 loading / error / empty 상태
사용자 친화적 API 오류 메시지
```

브라우저 직접 Apps Script 호출은 CORS 제약 때문에 사용하지 않는다. 환경변수가 설정되면 실제 API만 사용하고, 호출 실패를 mock으로 숨기지 않는다. 환경변수가 없을 때만 개발용 mock fallback을 사용한다.

나눔과 기도제목 일괄 분리는 선택 셀 인원을 전달받는 로컬 rule parser를 유지한다. 외부 AI를 사용하지 않으며 사용자 확인 전에는 저장하지 않는다.

Phase 4 제한:

```txt
Google OAuth 신원 검증 미구현
샘플 사용자 이메일을 requestUser.email로 사용
Users / Cells 관리 화면과 Absence / Settings / Backup은 개발용 mock UI 유지
admin,cell_leader 겸임자의 leaderMode 서버 조회 범위 분리 미구현
실제 배포 URL과 격리된 mock Spreadsheet 통합 호출 검증 필요
```

---

# 26. Phase 5 구현 상태

2026-06-12 기준 Google OAuth 로그인과 role 기반 접근 제어를 적용했다.

```txt
Auth.js Google provider
암호화 JWT 로그인 세션, 8시간 만료
로그인 및 세션 확인 시 verifyUser 호출
미등록·비활성 계정 로그인 차단
admin / cell_leader / admin,cell_leader 기본 redirect
role 기반 메뉴 분기
middleware 및 서버 layout 보호 페이지 접근 제어
Next.js API proxy의 세션 이메일 강제 적용
Apps Script API_PROXY_SECRET 검증
```

`createNewcomer`는 공개 action으로 유지하고, 나머지 보호 API는 로그인 세션과 trusted proxy를 요구한다.

Phase 5 제한:

```txt
실제 Google OAuth client와 배포 도메인 통합 로그인 수동 검증 필요
admin,cell_leader 겸임자의 leaderMode 서버 조회 범위 분리 미구현
OAuth 로그인·로그아웃 브라우저 자동화 테스트 미구현
```

---
