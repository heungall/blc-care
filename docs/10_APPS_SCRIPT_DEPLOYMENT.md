# BLC Care Apps Script Web App Deployment

## 1. 목적과 안전 범위

이 문서는 Phase 3-3에서 Google Apps Script 백엔드를 mock 데이터로 배포하고 CLI에서 호출 가능 여부를 확인하는 절차를 정의한다.

현재 `requestUser.email`은 Google OAuth로 검증되지 않는다. 따라서 이메일 값을 바꾸어 다른 사용자처럼 요청할 수 있다.

```txt
운영 데이터 사용 금지
실제 개인정보 사용 금지
격리된 mock Spreadsheet만 사용
테스트가 끝나면 공개 배포 중지 또는 접근 범위 축소
```

## 2. 필요한 Sheet

테스트 Spreadsheet에 다음 Sheet를 만들고, 첫 번째 행에 `docs/02_DB_SCHEMA.md`의 컬럼명을 입력한다.

```txt
users
user_cell_assignments
cells
cell_member_history
members
weekly_cell_reports
weekly_member_records
member_notes
newcomers
absence_alerts
settings
audit_logs
```

`gas-backend/Initializer.gs`의 `initializeDatabase()`를 사용하면 위 Sheet와 첫 행 헤더를 자동 생성할 수 있다.

### 2.1 최소 mock 데이터

아래 값은 테스트 전용 가상 데이터다. 실제 이메일, 이름, 기도제목을 사용하지 않는다.

`users`:

| user_id | email | name | roles | active | created_at | updated_at |
| --- | --- | --- | --- | --- | --- | --- |
| user_sample_admin | sample-admin@example.invalid | 샘플 관리자 | admin,cell_leader | TRUE | 2026-06-12 09:00:00 | 2026-06-12 09:00:00 |
| user_sample_leader | sample-leader@example.invalid | 샘플 셀리더 | cell_leader | TRUE | 2026-06-12 09:00:00 | 2026-06-12 09:00:00 |

`cells`:

| cell_id | cell_name | active | sort_order | created_at | updated_at |
| --- | --- | --- | --- | --- | --- |
| cell_sample | 샘플 셀 | TRUE | 1 | 2026-06-12 09:00:00 | 2026-06-12 09:00:00 |

`user_cell_assignments`:

| assignment_id | user_id | cell_id | assignment_role | active | start_date | end_date | created_at | updated_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assignment_sample | user_sample_leader | cell_sample | leader | TRUE | 2026-01-01 |  | 2026-06-12 09:00:00 | 2026-06-12 09:00:00 |

`members`:

| member_id | full_name | display_name | name_aliases | workplace | occupation | job_title | current_cell_id | status | created_at | updated_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| member_sample_gaon | 샘플가온 | 샘플가온 | 가온,가온자매 | 샘플 회사 A | 샘플 직업 A | 샘플 직책 A | cell_sample | active | 2026-06-12 09:00:00 | 2026-06-12 09:00:00 |
| member_sample_haneul_a | 샘플하늘 | 샘플하늘A | 하늘 | 샘플 회사 B | 샘플 직업 B | 샘플 직책 B | cell_sample | active | 2026-06-12 09:00:00 | 2026-06-12 09:00:00 |
| member_sample_haneul_b | 테스트하늘 | 샘플하늘B | 하늘 | 샘플 기관 C | 샘플 직업 C | 샘플 직책 C | cell_sample | active | 2026-06-12 09:00:00 | 2026-06-12 09:00:00 |

`weekly_cell_reports`, `weekly_member_records`, `member_notes`는 첫 번째 행의 컬럼명만 있어도 초기 테스트할 수 있다. `saveWeeklyReport`를 호출하면 리포트와 개인 기록 행이 추가된다.

기존 테스트 Spreadsheet를 사용하는 경우 `members` 첫 행에 `workplace`, `occupation`, `job_title` 컬럼을 추가한다. 빈 값은 허용된다.

## 3. Apps Script 프로젝트 준비

1. [Apps Script](https://script.google.com/)에서 새 독립형 프로젝트를 만든다.
2. 프로젝트 이름을 테스트용으로 명확히 지정한다.
3. `gas-backend/*.gs`와 동일한 이름의 스크립트 파일을 만들고 내용을 추가한다.
4. 프로젝트 설정에서 시간대를 `Asia/Seoul`로 설정한다.
5. 프로젝트를 저장한다.
6. `SHEET_ID` Script Property를 먼저 설정한다.
7. Apps Script 편집기 상단 함수 선택에서 `initializeDatabase`를 선택하고 실행한다.
8. 최초 실행 시 요청되는 Spreadsheet 접근 권한을 검토하고 승인한다.
9. 실행 로그에서 `created_count`, `updated_count`, `unchanged_count`를 확인한다.
10. `validateDatabaseSchema`를 실행해 전체 Sheet 구성이 유효한지 확인한다.

실행 계정은 테스트 Spreadsheet 읽기 권한을 가져야 한다.

### 3.1 자동 초기화 동작

`initializeDatabase()`는 Apps Script 편집기에서 관리자만 직접 실행하는 함수이며 Web App API action으로 노출하지 않는다.

```txt
없는 Sheet: 생성 후 첫 행 헤더 입력
빈 Sheet: 첫 행 헤더 입력
기존 Sheet: 문서에 정의된 누락 헤더만 오른쪽에 추가
기존 데이터 행: 변경하지 않음
알 수 없는 컬럼, 중복 컬럼, 중간 빈 컬럼: 오류 후 중단
```

함수는 반복 실행해도 이미 올바른 Sheet와 헤더를 다시 만들거나 데이터를 덮어쓰지 않는다.
쓰기 전에 기존 모든 Sheet의 헤더를 먼저 검사하므로 충돌이 발견되면 새 Sheet 생성이나 헤더 추가를 시작하지 않는다.

`validateDatabaseSchema()`는 쓰기 없이 필수 Sheet와 헤더를 점검한다.

## 4. Script Properties

Apps Script의 **프로젝트 설정 > 스크립트 속성**에 다음 값을 추가한다.

| 이름 | 필수 | 값 |
| --- | --- | --- |
| `SHEET_ID` | Y | 테스트 Spreadsheet URL의 `/d/`와 `/edit` 사이 ID |
| `API_PROXY_SECRET` | Y | Next.js `GAS_PROXY_SECRET`과 동일한 긴 임의 문자열 |

예시는 자리표시자이며 실제 값을 저장소에 기록하지 않는다.

```txt
SHEET_ID = <TEST_SPREADSHEET_ID>
```

Phase 5 보호 API는 `SHEET_ID`와 `API_PROXY_SECRET`이 모두 필요하다.

초기 Sheet 생성만 먼저 수행할 때는 `SHEET_ID` 설정 후 `initializeDatabase()`를 실행할 수 있다. Web App 호출 전에는 반드시 `API_PROXY_SECRET`도 설정한다.

## 5. Web App 배포

### 5.1 개발 테스트 배포

1. Apps Script 우측 상단에서 **배포 > 배포 테스트**를 선택한다.
2. 유형을 **웹 앱**으로 선택한다.
3. `/dev`로 끝나는 URL을 복사한다.

`/dev` URL은 스크립트 편집 권한이 있는 사용자만 접근할 수 있고, 저장된 최신 코드를 실행한다.

### 5.2 호출 확인용 배포

1. **배포 > 새 배포**를 선택한다.
2. 유형을 **웹 앱**으로 선택한다.
3. 실행 사용자는 **나**로 선택한다.
4. 접근 권한은 테스트 계정 정책 안에서 curl 호출이 가능한 최소 범위를 선택한다.
5. 배포하고 `/exec`로 끝나는 Web App URL을 별도로 보관한다.

현재 API는 Google OAuth 신원 검증 전이므로 공개 접근 배포는 격리된 mock Spreadsheet에서만 임시로 사용한다.

코드 변경 후에는 **배포 > 배포 관리 > 수정 > 새 버전**으로 배포를 갱신해야 `/exec` URL에 변경 사항이 반영된다.

## 6. 테스트 환경 변수

PowerShell 세션에서만 URL을 설정한다. 실제 URL을 `.env`, 문서, 코드에 기록하지 않는다.

```powershell
$env:BLC_CARE_WEB_APP_URL = "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec"
```

확인:

```powershell
if (-not $env:BLC_CARE_WEB_APP_URL) { throw "BLC_CARE_WEB_APP_URL이 필요합니다." }
```

### 6.1 Next.js Phase 4 연결

로컬 개발에서는 저장소에 커밋되지 않는 `.env.local`에 Web App URL을 설정한다.

```txt
NEXT_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
GAS_PROXY_SECRET=<LONG_RANDOM_SECRET_SHARED_WITH_APPS_SCRIPT>
AUTH_SECRET=<GENERATED_AUTH_SECRET>
AUTH_GOOGLE_ID=<GOOGLE_OAUTH_CLIENT_ID>
AUTH_GOOGLE_SECRET=<GOOGLE_OAUTH_CLIENT_SECRET>
```

브라우저는 Apps Script를 직접 호출하지 않고 Next.js `/api/gas` Route Handler를 호출한다. Route Handler가 Apps Script 리다이렉트를 따라가므로 브라우저 CORS 제약을 피한다.

환경변수가 없거나 실제 URL 호출이 실패하면 오류를 표시하며 mock으로 자동 전환하지 않는다.

Drive 백업 기능을 사용할 때 Apps Script Script Properties에 다음 값도 설정한다.

```txt
BACKUP_FOLDER_ID=<격리된 Google Drive 백업 폴더 ID>
```

Apps Script 실행 계정에 해당 폴더 쓰기 권한이 있어야 한다.

Google Cloud Console OAuth Web client의 승인된 리디렉션 URI에는 다음을 등록한다.

```txt
http://localhost:3000/api/auth/callback/google
https://<PRODUCTION_DOMAIN>/api/auth/callback/google
```

Phase 5 보호 API의 CLI 직접 테스트에는 요청 본문에 테스트용 `proxySecret`이 필요하다. 실제 secret은 명령 기록, 문서, 저장소에 남기지 않는다.

## 7. API 호출 테스트

Apps Script `ContentService` 응답은 `script.googleusercontent.com`의 일회성 URL로 리다이렉트된다. 모든 `curl.exe` 요청에 `-L`을 사용한다.

`-X POST`를 함께 사용하면 리다이렉트 이후에도 POST가 강제될 수 있으므로 아래처럼 `--data-binary`로 POST를 만들고 `-X`는 생략한다.

### 7.1 `verifyUser`

```powershell
curl.exe -sS -L `
  -H "Content-Type: application/json" `
  --data-binary '{"action":"verifyUser","requestUser":{"email":"sample-leader@example.invalid"}}' `
  $env:BLC_CARE_WEB_APP_URL
```

확인 항목:

```txt
success = true
data.roles에 cell_leader 포함
data.assigned_cells에 cell_sample 포함
```

### 7.2 `getMembers`

```powershell
curl.exe -sS -L `
  -H "Content-Type: application/json" `
  --data-binary '{"action":"getMembers","requestUser":{"email":"sample-leader@example.invalid"},"data":{"cell_id":"cell_sample","status":"active","keyword":"샘플","sort":"name_asc","page":1,"page_size":20}}' `
  $env:BLC_CARE_WEB_APP_URL
```

확인 항목:

```txt
success = true
data.items에는 cell_sample 성도만 포함
data.pagination 값 존재
current_cell_name = 샘플 셀
```

권한 차단 확인을 위해 셀리더가 배정되지 않은 가상 `cell_id`를 보내면 `FORBIDDEN`이 반환되어야 한다.

### 7.3 `parsePrayerRequests`

```powershell
curl.exe -sS -L `
  -H "Content-Type: application/json; charset=utf-8" `
  --data-binary '{"action":"parsePrayerRequests","requestUser":{"email":"sample-leader@example.invalid"},"data":{"cell_id":"cell_sample","raw_text":"가온자매: 샘플 기도 내용\n하늘/ 샘플 동명이인 내용\n없는이름) 샘플 미매칭 내용\n구분자 없는 첫 줄"}}' `
  $env:BLC_CARE_WEB_APP_URL
```

확인 항목:

```txt
items 1건 이상
ambiguous에 하늘 포함
unmatched에 없는이름 포함
invalid에 구분자 없는 첫 줄 포함
호출 후 Spreadsheet 데이터가 변경되지 않음
```

## 8. JSON 응답과 리다이렉트 점검

현재 `jsonResponse_()`는 `ContentService.MimeType.JSON`을 설정한다.

헤더와 최종 JSON 응답을 함께 확인하려면:

```powershell
curl.exe -sS -L -D - `
  -H "Content-Type: application/json" `
  --data-binary '{"action":"verifyUser","requestUser":{"email":"sample-leader@example.invalid"}}' `
  $env:BLC_CARE_WEB_APP_URL
```

확인 항목:

```txt
리다이렉트가 자동으로 따라가짐
최종 응답 본문이 JSON
최종 Content-Type이 application/json 계열
success / data / error 공통 구조 유지
```

Apps Script Web App은 애플리케이션 에러에서도 HTTP 상태 코드 대신 JSON의 `success`와 `error.code`를 확인해야 한다.

## 9. CORS 점검 결과

`ContentService`의 `TextOutput`은 MIME type은 설정할 수 있지만 사용자 지정 응답 헤더를 설정하는 API를 제공하지 않는다. 현재 구현에서 `Access-Control-Allow-Origin` 같은 CORS 헤더를 추가할 수 없고, Apps Script Web App은 `doGet`과 `doPost` 진입점만 제공한다.

따라서 다음 원칙을 적용한다.

```txt
curl, Postman, 서버 간 호출: 사용 가능
Next.js 브라우저 코드에서 Apps Script 직접 fetch: 사용하지 않음
향후 프론트엔드 연동: Next.js 서버 Route Handler 또는 서버 측 proxy를 통해 호출
브라우저에서 application/json POST 직접 호출: CORS preflight 문제 가능
```

CORS 우회를 위해 JSONP를 사용하지 않는다. 이 API는 사용자·성도·기도제목 등 민감 정보를 다루기 때문이다.

## 10. 문제 해결

| 증상 | 확인 항목 |
| --- | --- |
| 로그인 HTML 또는 권한 요청 화면 반환 | Web App 접근 권한, 실행 사용자, 테스트 계정 로그인 상태 확인 |
| `/dev` URL 접근 불가 | 호출 계정에 스크립트 편집 권한이 있는지 확인 |
| 변경한 코드가 `/exec`에 반영되지 않음 | 배포 관리에서 새 버전으로 갱신 |
| `CONFIG_ERROR` | `SHEET_ID` Script Property와 Spreadsheet 접근 권한 확인 |
| `SHEET_NOT_FOUND` | 필수 Sheet 이름의 대소문자와 공백 확인 |
| `INVALID_SHEET` | 첫 행 헤더의 빈 값과 중복 확인 |
| curl 응답이 리다이렉트에서 멈춤 | `-L` 옵션 확인 |
| 브라우저 fetch가 CORS로 차단됨 | 직접 호출을 중단하고 Next.js 서버 proxy 사용 |

Apps Script 편집기의 **실행** 메뉴에서 실패 실행과 로그를 확인할 수 있다.

## 11. 공식 참고 문서

- [Google Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [Google Apps Script Content Service](https://developers.google.com/apps-script/guides/content)
- [Google Apps Script TextOutput](https://developers.google.com/apps-script/reference/content/text-output)
