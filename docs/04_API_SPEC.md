# BLC Care API Specification

## 현재 Supabase 런타임

2026-06-14부터 브라우저 API client는 동일 출처의 `POST /api/supabase`를 호출한다.
보호 action은 Supabase Auth HttpOnly 세션을 검증하고 `public.users`의 active, roles,
`user_cell_assignments`를 서버에서 다시 확인한다. `createNewcomer`만 비로그인 제출을 허용한다.
기존 `/api/gas`와 Apps Script 요청 형식은 전환 이력 참고용이며 현재 앱 런타임에서 사용하지 않는다.

## 1. 공통 원칙

- Google Apps Script Web App의 단일 배포 URL을 사용한다.
- 요청은 `action` 값으로 라우팅한다.
- 보호 API는 `requestUser.email`을 받아 `users` Sheet에서 활성 사용자와 권한을 다시 확인한다.
- Google Sheets row number를 식별자로 사용하지 않고 각 엔티티 ID로 관계를 조회한다.
- 실제 개인정보, Sheet ID, 배포 URL, secret은 코드나 문서에 기록하지 않는다.
- Phase 3의 `requestUser.email` 검증은 API 구조 확인용이다. Google OAuth 신원 검증 전에는 운영 인증 수단으로 사용하지 않는다.

## 2. 공통 요청

POST 요청의 본문은 JSON 객체다.

```json
{
  "action": "verifyUser",
  "requestUser": {
    "email": "sample-user@example.invalid"
  }
}
```

GET 요청은 수동 점검 용도로 다음 query parameter를 지원한다.

```txt
?action=verifyUser&email=sample-user@example.invalid
```

민감 정보가 포함되는 향후 API는 URL에 데이터가 남지 않도록 POST만 사용한다.

## 3. 공통 응답

성공:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

실패:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 표시 가능한 메시지"
  }
}
```

Apps Script Web App 특성상 클라이언트는 HTTP 상태 코드만 의존하지 않고 `success`와 `error.code`를 확인한다.

### 3.1 Web App 전송 제약

- `ContentService` JSON 응답은 `script.googleusercontent.com`으로 리다이렉트되므로 HTTP 클라이언트는 리다이렉트를 따라야 한다.
- `TextOutput`에서 사용자 지정 CORS 헤더를 설정할 수 없으므로 브라우저에서 Apps Script Web App을 직접 호출하지 않는다.
- 실제 프론트엔드 연동은 Next.js 서버 Route Handler 또는 서버 측 proxy를 사용한다.
- 배포 및 CLI 호출 검증 절차는 `docs/10_APPS_SCRIPT_DEPLOYMENT.md`를 따른다.

## 4. 공통 에러 코드

| 코드 | 의미 |
| --- | --- |
| `BAD_REQUEST` | action 또는 JSON 요청 형식 오류 |
| `UNAUTHORIZED` | 로그인 이메일 누락 또는 미등록 계정 |
| `FORBIDDEN` | 비활성 계정 또는 권한 없음 |
| `NOT_FOUND` | 지원하지 않는 action 또는 대상 없음 |
| `CONFLICT` | 유니크 키 또는 요청 내부 중복 |
| `CONFIG_ERROR` | Script Properties 또는 Sheet 접근 설정 오류 |
| `SHEET_NOT_FOUND` | 필수 Sheet 없음 |
| `INVALID_SHEET` | 필수 헤더가 없거나 중복됨 |
| `INTERNAL_ERROR` | 예상하지 못한 서버 오류 |

예상하지 못한 오류의 내부 상세와 stack trace는 응답에 포함하지 않는다.

## 5. `verifyUser`

### 5.1 목적

`requestUser.email`에 해당하는 활성 사용자를 확인하고 roles와 현재 담당 셀을 반환한다.

### 5.2 요청

```json
{
  "action": "verifyUser",
  "requestUser": {
    "email": "sample-user@example.invalid"
  }
}
```

### 5.3 처리 규칙

1. 이메일은 trim 후 소문자로 비교한다.
2. 사용자가 없으면 `UNAUTHORIZED`를 반환한다.
3. `users.active`가 `FALSE`이면 `FORBIDDEN`을 반환한다.
4. `users.roles` 쉼표 문자열은 배열로 변환한다.
5. `user_cell_assignments`의 활성 기간 내 배정과 활성 `cells`를 ID로 조합한다.
6. Admin도 실제 배정이 있으면 `assigned_cells`에 함께 반환한다.

### 5.4 성공 응답

```json
{
  "success": true,
  "data": {
    "user_id": "user_sample",
    "email": "sample-user@example.invalid",
    "name": "샘플 사용자",
    "roles": ["admin", "cell_leader"],
    "active": true,
    "assigned_cells": [
      {
        "cell_id": "cell_sample",
        "cell_name": "샘플 셀",
        "assignment_role": "leader"
      }
    ]
  },
  "error": null
}
```

`assigned_cells`가 없으면 빈 배열을 반환한다.

## 6. `getMembers`

### 6.1 요청

```json
{
  "action": "getMembers",
  "requestUser": {
    "email": "sample-leader@example.invalid"
  },
  "data": {
    "cell_id": "cell_sample",
    "status": "active",
    "keyword": "샘플",
    "sort": "name_asc",
    "page": 1,
    "page_size": 20
  }
}
```

필터는 모두 선택값이다. `page` 기본값은 `1`, `page_size` 기본값은 `20`, 최대값은 `100`이다.

### 6.2 권한과 반환

- Admin은 전체 성도를 조회할 수 있다.
- 셀리더는 현재 활성 배정 셀의 성도만 조회할 수 있다.
- 셀리더가 배정되지 않은 `cell_id`를 요청하면 `FORBIDDEN`을 반환한다.
- `keyword`는 전체 이름, 표시 이름, 별칭을 검색한다.
- 목록에는 개인정보 최소화 원칙에 따라 이름, 표시용 사진 URL, 셀, 상태, 마지막 출석일, 미해결 특이사항 수만 반환한다.
- `name_aliases`는 서버 내부에서 쉼표 문자열을 배열로 변환하여 검색과 parser에 사용한다.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "member_id": "member_sample",
        "full_name": "샘플가온",
        "display_name": "샘플가온",
        "current_cell_id": "cell_sample",
        "current_cell_name": "샘플 셀",
        "status": "active",
        "last_attendance_date": "2026-06-07",
        "unresolved_note_count": 0
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 1,
      "total_pages": 1
    }
  },
  "error": null
}
```

## 7. `getMemberDetail`

### 7.1 요청

```json
{
  "action": "getMemberDetail",
  "requestUser": {
    "email": "sample-leader@example.invalid"
  },
  "data": {
    "member_id": "member_sample"
  }
}
```

### 7.2 권한과 반환

- Admin은 전체 성도 상세를 조회할 수 있다.
- 셀리더는 현재 활성 배정 셀에 속한 성도 상세만 조회할 수 있다.
- 권한 없는 성도 상세 요청은 `FORBIDDEN`을 반환한다.
- `member.name_aliases`는 배열로 반환한다.
- `member.workplace`, `member.occupation`, `member.job_title`은 값이 있을 때 개인 상세에 반환한다.
- `history.records`는 `weekly_member_records`, `history.notes`는 `member_notes`에서 ID로 조회한다.

```json
{
  "success": true,
  "data": {
    "member": {
      "member_id": "member_sample",
      "full_name": "샘플가온",
      "display_name": "샘플가온",
      "name_aliases": ["가온"],
      "workplace": "샘플 회사",
      "occupation": "샘플 직업",
      "job_title": "샘플 직책",
      "current_cell_id": "cell_sample",
      "current_cell_name": "샘플 셀",
      "status": "active"
    },
    "history": {
      "records": [],
      "notes": []
    }
  },
  "error": null
}
```

## 8. `updateMember`

### 8.1 요청과 권한

`POST /api/supabase`의 `updateMember` action으로 성도 정보를 수정한다.

* Admin은 전체 성도의 기본 정보, 소속 셀, 상태를 수정할 수 있다.
* 셀리더는 현재 활성 배정 셀에 속한 성도의 기본 정보만 수정할 수 있다.
* 셀리더가 소속 셀 또는 상태를 변경하려 하면 `FORBIDDEN`을 반환한다.
* 이름과 표시 이름은 필수다.
* 소속 셀 변경 시 기존 열린 `cell_member_history`를 종료하고 새 이력을 생성한다.
* 수정 시 `updated_by`를 기록하고 개인정보 원문 없는 최소 `audit_logs`를 생성한다.

```json
{
  "action": "updateMember",
  "data": {
    "member_id": "member_sample",
    "full_name": "샘플가온",
    "display_name": "가온",
    "name_aliases": ["샘플가온"],
    "phone": "010-0000-0000",
    "current_cell_id": "cell_sample",
    "status": "active"
  }
}
```

## 9. `parsePrayerRequests`

### 8.1 요청

```json
{
  "action": "parsePrayerRequests",
  "requestUser": {
    "email": "sample-leader@example.invalid"
  },
  "data": {
    "cell_id": "cell_sample",
    "raw_text": "가온: 샘플 기도 내용"
  }
}
```

### 8.2 처리 규칙

- Admin은 모든 활성 셀을 선택할 수 있다.
- 셀리더는 현재 활성 배정 셀만 선택할 수 있다.
- 선택된 셀의 `status = active` 성도만 매칭 후보로 사용한다.
- `:`, `：`, `-`, `)`, `/` 구분자와 `docs/06_PRAYER_PARSER_RULES.md`의 호칭·매칭 우선순위를 적용한다.
- 결과는 `items`, `ambiguous`, `unmatched`, `invalid`로 분리한다.
- 결과를 Sheet에 저장하지 않는다. 저장 전 사용자 확인은 프론트엔드 리포트 흐름에서 수행한다.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "input_name": "가온",
        "member_id": "member_sample",
        "matched_name": "샘플가온",
        "prayer_request": "샘플 기도 내용",
        "status": "matched",
        "confidence": 1
      }
    ],
    "ambiguous": [],
    "unmatched": [],
    "invalid": []
  },
  "error": null
}
```

## 9. `getReports`

`data.cell_id`, `data.status`, `data.week_start_date`, `data.page`, `data.page_size` 필터를 지원한다.

- Admin은 전체 셀 리포트를 조회한다.
- 셀리더는 현재 활성 배정 셀 리포트만 조회한다.
- 응답 항목에는 `cell_name`, `leader_name`, `record_count`가 포함된다.
- 주차가 종료된 리포트는 저장값과 별개로 응답에서 `locked = true`로 간주한다.

## 10. `getReportDetail`

```json
{
  "action": "getReportDetail",
  "requestUser": {
    "email": "sample-leader@example.invalid"
  },
  "data": {
    "report_id": "report_sample"
  }
}
```

응답은 `report`, 해당 리포트의 `records`, 요청 사용자의 `can_edit` 여부를 반환한다.

## 11. `getWeeklyReportDraft`

```json
{
  "action": "getWeeklyReportDraft",
  "requestUser": {
    "email": "sample-leader@example.invalid"
  },
  "data": {
    "cell_id": "cell_sample",
    "week_start_date": "2026-06-08"
  }
}
```

- `week_start_date`를 생략하면 현재 날짜가 포함된 월요일~일요일 주차를 사용한다.
- `week_start_date`를 입력하면 월요일이어야 한다.
- 동일 `cell_id + week_start_date` 리포트가 있으면 기존 기록을 불러온다.
- 기존 기록은 모두 유지하고, 현재 활동 성도 중 기록이 없는 성도는 `attendance_status = unknown` 기본 기록으로 추가한다.
- `is_existing`, `report`, `members`, `records`, `can_edit`을 반환한다.

## 12. `saveWeeklyReport`

```json
{
  "action": "saveWeeklyReport",
  "requestUser": {
    "email": "sample-leader@example.invalid"
  },
  "data": {
    "cell_id": "cell_sample",
    "week_start_date": "2026-06-08",
    "report_date": "2026-06-14",
    "overall_summary": "샘플 모임 요약",
    "status": "submitted",
    "records": [
      {
        "member_id": "member_sample_gaon",
        "attendance_status": "present",
        "sharing_summary": "샘플 나눔",
        "prayer_request": "샘플 기도 내용",
        "prayer_parsed_by": "rule",
        "prayer_parse_confidence": 1
      }
    ]
  }
}
```

### 12.1 저장 및 권한 규칙

- `week_start_date`는 월요일이어야 하며 `report_date`는 해당 주차 안이어야 한다.
- Admin은 전체 셀 리포트와 잠긴 리포트를 수정할 수 있다.
- 새 리포트는 활성 셀에만 생성한다. 이미 존재하는 비활성 셀 리포트는 Admin이 수정할 수 있다.
- 셀리더는 현재 활성 배정 셀의 해당 주차 리포트만 생성·수정할 수 있다.
- 셀리더는 `locked = TRUE`, `status = locked`, 주차 종료 리포트를 수정할 수 없다.
- `LockService` 안에서 동일 `cell_id + week_start_date` 리포트를 찾아 생성 또는 수정한다.
- 개인 기록은 `report_id + member_id`를 기준으로 생성 또는 수정하며 기존 `record_id`를 유지한다.
- 한 요청에 같은 `member_id`가 중복되면 `CONFLICT`를 반환한다.
- 요청에 포함되지 않은 기존 개인 기록은 삭제하지 않는다.
- 새 주차 리포트의 개인 기록은 새 `report_id` 아래에 생성되어 성도별 주차 히스토리로 누적된다.

## 13. Phase 3-4 지원 범위

지원:

- `verifyUser`
- `getMembers`
- `getMemberDetail`
- `parsePrayerRequests`
- `getReports`
- `getReportDetail`
- `getWeeklyReportDraft`
- `saveWeeklyReport`
- 공통 라우터, 응답, 에러 처리
- Script Properties 기반 Sheet 연결
- `weekly_cell_reports`, `weekly_member_records` 생성 및 수정
- 서버 측 성도·셀 접근 권한 검증
- 서버 측 리포트 접근·수정 기간·잠금 검증

미지원:

- 프론트엔드 실제 API 연결
- Google OAuth 신원 검증

---

## 14. Phase 3-5 Admin 관리 API

### 14.1 Users

`getUsers`, `createUser`, `updateUser`, `assignUserToCell`, `unassignUserFromCell`는 Admin 전용이다.

- `roles` 요청은 배열 또는 쉼표 문자열을 허용하고 Sheet에는 쉼표 문자열로 저장한다.
- 응답의 `roles`는 배열이며 `admin,cell_leader` 복수 역할을 지원한다.
- 셀 배정 해제는 row 삭제 대신 `active = FALSE`, `end_date` 기록으로 처리한다.
- 같은 사용자와 셀의 기존 배정이 있으면 새 row를 만들지 않고 재활성화한다.

### 14.2 Cells

`createCell`, `updateCell`은 Admin 전용이다. `getCells`는 Admin에게 전체 셀을, cell leader에게 현재 배정된 셀만 반환한다.

### 14.3 Newcomers

- `createNewcomer`는 로그인 없이 호출할 수 있으나 `privacy_agreed = TRUE`가 필수이다.
- `getNewcomers`, `updateNewcomerStatus`, `convertNewcomerToMember`는 Admin 전용이다.
- `status = converted` 변경은 `convertNewcomerToMember`에서만 수행한다.
- 전환 시 `members`, 최초 `cell_member_history`, `newcomers.converted_member_id`를 ID 기반으로 기록한다.
- 중복 전환은 `LockService`와 기존 전환 상태 검사로 막는다.

### 14.4 Audit logs

Users, Cells, Newcomers의 생성·수정·비활성화·전환은 `audit_logs`에 기록한다. 감사 값에는 상태, 역할, 관련 ID 등 최소 정보만 기록하며 이름, 이메일, 전화번호, 주소, 방문·신앙 내용은 복제하지 않는다.

Phase 3-5에서도 프론트엔드 실제 API 연결과 Google OAuth 신원 검증은 구현하지 않는다.

## Supabase 공개 새신자 제출 경로 설계

Supabase 전환 후 공개 새신자 등록은 브라우저에서 `newcomers` 테이블을 직접 호출하지 않는다.
후속 Next.js Route Handler는 다음 순서를 따른다.

1. 요청 크기, 필수값, 개인정보 동의, rate limit을 검증한다.
2. 서버 전용 Supabase secret key로 `newcomers`에 저장한다.
3. 생성된 ID, 상태, 제출 시각만 응답한다.
4. 이름, 전화번호, 주소, 방문·신앙 내용은 응답이나 로그에 복제하지 않는다.

`anon` 역할에는 앱 테이블 권한과 `newcomers` insert 정책을 부여하지 않는다. secret key는
서버 환경변수에만 저장하고 브라우저 bundle과 `NEXT_PUBLIC_*` 환경변수에 포함하지 않는다.

## Supabase Admin 성도 CSV 일괄 등록

`POST /api/admin/members/import`는 Auth.js 세션의 Admin role을 서버에서 재검증한다.

요청:

```json
{
  "csv_text": "full_name,display_name,cell_name,status\n홍길동,홍길동,샘플 1셀,active"
}
```

규칙:

* 최대 500행, 1MB CSV만 허용한다.
* `full_name`은 필수이고 `display_name`과 `status`는 각각 이름과 `active`가 기본값이다.
* `name_aliases`는 `|` 문자로 구분한다.
* 날짜는 `YYYY-MM-DD`, 상태값은 DB enum 값만 허용한다.
* `cell_name`은 기존 활성 셀 이름과 일치해야 한다.
* Route Handler 검증 통과 후 `service_role` 전용 `import_members_csv` RPC를 호출한다.
* RPC는 UUID 자동 생성, 성도 생성, 최초 셀 이력, 최소 audit log를 하나의 트랜잭션으로 처리한다.
* 오류 응답과 서버 로그에는 CSV 개인정보 원문을 포함하지 않는다.

---

## 15. Phase 4 프론트엔드 실제 API 연결

프론트엔드는 브라우저에서 Apps Script Web App을 직접 호출하지 않는다. 동일 출처의 Next.js Route Handler `/api/gas`가 `NEXT_PUBLIC_GAS_API_URL`의 Apps Script Web App으로 POST 요청을 전달하고 리다이렉트를 따른다.

연결 대상:

```txt
verifyUser
getCells
getMembers / getMemberDetail
getReports / getReportDetail / getWeeklyReportDraft / saveWeeklyReport
createNewcomer / getNewcomers / updateNewcomerStatus / convertNewcomerToMember
```

기도제목과 나눔 일괄 분리는 Phase 4에서도 프론트엔드 로컬 rule parser를 유지한다. 선택 셀의 API 응답 인원만 후보로 사용하고, 결과 확인 후에만 리포트 입력값에 반영한다. `parsePrayerRequests` API client 함수는 향후 서버 parser 비교 검증을 위해 유지한다.

`NEXT_PUBLIC_GAS_API_URL`과 `GAS_PROXY_SECRET`은 필수다. 설정이 없거나 실제 호출이 실패하면 mock 데이터로 대체하지 않고 공통 오류 상태를 표시한다.

Phase 4에서도 샘플 이메일 선택 방식이며 Google OAuth 신원 검증은 미구현이다.

---

## 16. Phase 5 OAuth 신원 검증과 보호 API

Phase 5부터 보호 API의 `requestUser.email`은 브라우저 입력값을 신뢰하지 않는다.

```txt
Google OAuth 로그인
→ Auth.js 암호화 JWT 세션 생성
→ Next.js /api/gas가 세션 이메일로 requestUser.email 덮어쓰기
→ GAS가 API_PROXY_SECRET 확인
→ users Sheet의 active와 roles 재검증
```

`createNewcomer`만 비로그인 공개 action으로 유지한다. 그 외 `/api/gas` action은 로그인 세션이 없으면 `UNAUTHORIZED`를 반환한다.

Next.js의 `GAS_PROXY_SECRET`과 Apps Script Script Property의 `API_PROXY_SECRET`은 동일한 긴 임의 문자열을 사용한다. 보호 Apps Script API는 올바른 proxy secret이 없는 직접 호출을 거부한다.

---

## 17. 운영 관리 API

다음 action은 모두 Admin 전용이며 Apps Script에서 역할을 다시 검증한다.

### 17.1 Users / Cells

- `getUsers`, `createUser`, `updateUser`, `assignUserToCell`, `unassignUserFromCell`
- `getCells`, `createCell`, `updateCell`
- 사용자와 셀 변경은 `audit_logs`에 개인정보 원문을 복제하지 않고 기록한다.

### 17.2 Absence

- `getAbsenceAlerts`: `absence_alerts` 목록을 반환한다.
- `updateAbsenceAlert`: `status`, `memo`, 처리 시각과 처리 사용자를 저장한다.
- 허용 상태는 `open`, `checked`, `resolved`다.

### 17.3 Settings

- `getSettings`: `settings` Sheet를 `AppSettings` 객체로 변환한다.
- `updateSettings`: 문서화된 설정 키만 ID 기반 upsert하고 변경 키 목록을 감사 로그에 기록한다.

### 17.4 Backup

- `getBackupHistory`: 지정된 Drive 백업 폴더에서 BLC Care가 생성한 최근 백업 이력을 반환한다.
- `createBackup`: 전체 Sheet를 CSV ZIP 또는 XLSX로 생성해 지정된 Drive 폴더에 저장한다.
- Apps Script Script Property `BACKUP_FOLDER_ID`가 필수다.
- 백업 파일 설명에는 형식, 생성 시각, 생성 사용자 ID만 저장하며 민감정보를 추가 기록하지 않는다.
