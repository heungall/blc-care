# BLC Care Permission Rules

> 현재 로그인 신원은 Supabase Auth Google OAuth의 `auth.users.id`로 확인하고
> `public.users.auth_user_id`에 연결한다. 이메일은 최초 연결 대상 확인에만 사용하며,
> 이후 보호 API의 권한은 서버 세션, roles, 활성 셀 배정으로 다시 검증한다.

## 1. 문서 개요

본 문서는 BLC Care의 사용자 권한 정책을 정의한다.

BLC Care는 구글 로그인 이메일을 기준으로 사용자를 식별한다.
사용자는 하나 이상의 role을 가질 수 있다.

예시:

```txt
admin
cell_leader
admin,cell_leader
```

Supabase 전환 후 모든 민감 테이블은 Row Level Security(RLS)를 활성화한다.
프론트엔드 표시 여부와 관계없이 PostgreSQL 정책이 Admin 전체 접근과 셀리더 배정 셀 접근을 강제해야 한다.

---

# 2. 기본 개념

## 2.1 사용자

사용자 정보는 `users` Sheet에 저장한다.

주요 컬럼:

```txt
user_id
email
name
roles
active
```

## 2.2 Role

사용자는 하나 이상의 role을 가질 수 있다.

| role        | 설명         |
| ----------- | ---------- |
| admin       | 전체 관리 권한   |
| cell_leader | 담당 셀 관리 권한 |

복수 role은 쉼표로 저장한다.

```txt
admin,cell_leader
```

## 2.3 셀 배정

셀리더가 담당하는 셀은 `user_cell_assignments` Sheet에서 관리한다.

주요 컬럼:

```txt
assignment_id
user_id
cell_id
assignment_role
active
start_date
end_date
```

---

# 3. 로그인 권한 확인

## 3.1 로그인 처리

사용자가 구글 로그인하면 다음 순서로 확인한다.

```txt
1. 로그인 이메일 확인
2. users Sheet에서 email 조회
3. 사용자가 없으면 접근 거부
4. active = FALSE면 접근 거부
5. roles 확인
6. role에 따라 화면 이동
```

## 3.2 미등록 사용자

`users`에 이메일이 없는 경우 접근을 허용하지 않는다.

표시 문구:

```txt
등록되지 않은 계정입니다.
관리자에게 문의해주세요.
```

## 3.3 비활성 사용자

`active = FALSE`인 경우 접근을 허용하지 않는다.

표시 문구:

```txt
비활성화된 계정입니다.
관리자에게 문의해주세요.
```

---

# 4. Role별 기본 접근 범위

## 4.1 Admin

`roles`에 `admin`이 포함된 사용자는 Admin 권한을 가진다.

Admin은 다음 데이터에 접근할 수 있다.

* 전체 성도
* 전체 셀
* 전체 셀 리포트
* 전체 새신자
* 전체 장기결석자
* 전체 사용자
* 시스템 설정
* 백업
* Audit Log

## 4.2 셀리더

`roles`에 `cell_leader`가 포함된 사용자는 셀리더 기능을 사용할 수 있다.

셀리더는 다음 데이터에 접근할 수 있다.

* 본인에게 배정된 셀
* 본인에게 배정된 셀의 성도
* 본인에게 배정된 셀 성도의 기본 정보 수정
* 본인에게 배정된 셀의 리포트
* 본인에게 배정된 셀 성도의 히스토리
* 본인에게 배정된 셀 성도의 특이사항

## 4.3 Admin + 셀리더

`roles`에 `admin`과 `cell_leader`가 모두 포함된 사용자는 두 기능을 모두 사용할 수 있다.

기본 원칙:

* Admin 화면에서는 전체 데이터 접근
* 셀리더 화면에서는 본인에게 배정된 셀을 기본 선택
* Admin 권한이 있으므로 전체 셀 선택도 가능
* 기본 로그인 이동은 `/admin/dashboard`

---

# 5. 페이지 접근 권한

## 5.1 비로그인 사용자

접근 가능:

```txt
/
 /login
 /newcomer
 /newcomer/complete
```

그 외 페이지 접근 시 `/login`으로 이동한다.

---

## 5.2 셀리더

접근 가능:

```txt
/dashboard
/members
/members/[id]
/reports
/reports/new
/reports/[id]
```

접근 불가:

```txt
/admin/*
```

단, `/members`, `/reports`에서는 본인에게 배정된 셀 데이터만 조회할 수 있다.

`/members/[id]`에서 셀리더는 담당 셀 성도의 기본 정보를 수정할 수 있다.
소속 셀과 성도 상태 변경은 Admin만 가능하며 서버 API가 다시 검증한다.

---

## 5.3 Admin

접근 가능:

```txt
/dashboard
/members
/members/[id]
/reports
/reports/new
/reports/[id]
/admin/*
```

Admin은 전체 데이터에 접근할 수 있다.

---

## 5.4 Admin + 셀리더

접근 가능:

```txt
전체 로그인 후 페이지
/admin/*
```

기본 진입:

```txt
/admin/dashboard
```

---

# 6. 데이터 접근 권한

## 6.1 성도 목록 조회

| 사용자               | 조회 가능 범위                 |
| ----------------- | ------------------------ |
| admin             | 전체 성도                    |
| cell_leader       | 배정된 셀의 성도                |
| admin,cell_leader | 전체 성도. 셀리더 모드에서는 배정 셀 우선 |

## 6.2 성도 상세 조회

| 사용자               | 조회 가능 범위  |
| ----------------- | --------- |
| admin             | 전체 성도     |
| cell_leader       | 배정된 셀의 성도 |
| admin,cell_leader | 전체 성도     |

셀리더가 배정되지 않은 셀의 성도 상세 페이지에 접근하면 `FORBIDDEN`을 반환한다.

직장, 직업, 직책을 포함한 성도 개인 상세 필드는 동일한 성도 상세 접근 권한을 적용하며 목록 응답에는 포함하지 않는다.

---

## 6.3 성도 생성/수정/상태 변경

| 작업          | admin | cell_leader |
| ----------- | ----- | ----------- |
| 성도 생성       | 가능    | 불가          |
| 성도 기본 정보 수정 | 가능    | 기본 불가       |
| 성도 휴면 처리    | 가능    | 불가          |
| 성도 셀 변경     | 가능    | 불가          |
| 성도 히스토리 조회  | 가능    | 배정 셀만 가능    |

셀리더가 기본 정보를 수정할 수 있는지는 향후 운영 정책에 따라 변경 가능하다.

---

## 6.4 특이사항

| 작업         | admin | cell_leader |
| ---------- | ----- | ----------- |
| 특이사항 조회    | 전체 가능 | 배정 셀만 가능    |
| 특이사항 생성    | 전체 가능 | 배정 셀만 가능    |
| 특이사항 해결 처리 | 전체 가능 | 배정 셀만 가능    |

셀리더는 배정된 셀 성도에 대해서만 특이사항을 작성하거나 해결 처리할 수 있다.

---

## 6.5 셀 리포트

| 작업        | admin | cell_leader       |
| --------- | ----- | ----------------- |
| 리포트 목록 조회 | 전체 가능 | 배정 셀만 가능          |
| 리포트 상세 조회 | 전체 가능 | 배정 셀만 가능          |
| 리포트 생성    | 전체 가능 | 배정 셀만 가능          |
| 리포트 수정    | 전체 가능 | 배정 셀 + 수정 가능 기간 내 |
| 잠긴 리포트 수정 | 가능    | 불가                |

## 6.6 리포트 수정 가능 기간

셀리더는 해당 주차 동안만 리포트를 수정할 수 있다.

기본 규칙:

```txt
week_start_date ~ week_end_date
```

주차 종료 후에는 `locked = TRUE`로 간주한다.

Admin은 locked 상태의 리포트도 수정할 수 있다.

---

## 6.7 새신자

| 작업        | 비로그인 | admin | cell_leader |
| --------- | ---- | ----- | ----------- |
| 새신자 등록    | 가능   | 가능    | 가능          |
| 새신자 목록 조회 | 불가   | 가능    | 불가          |
| 새신자 상태 변경 | 불가   | 가능    | 불가          |
| 성도 DB 전환  | 불가   | 가능    | 불가          |

---

## 6.8 장기결석자

| 작업                 | admin | cell_leader |
| ------------------ | ----- | ----------- |
| 전체 장기결석자 조회        | 가능    | 불가          |
| 배정 셀 장기결석 의심 인원 조회 | 가능    | 가능          |
| 장기결석자 확인 처리        | 가능    | 불가          |
| 장기결석자 해결 처리        | 가능    | 불가          |

셀리더 대시보드에는 배정 셀 기준의 장기결석 의심 인원을 보여줄 수 있다.
단, 공식 확인/해결 처리는 Admin만 수행한다.

---

## 6.9 사용자 관리

| 작업            | admin | cell_leader |
| ------------- | ----- | ----------- |
| 사용자 목록 조회     | 가능    | 불가          |
| 사용자 생성        | 가능    | 불가          |
| role 수정       | 가능    | 불가          |
| 사용자 활성/비활성 처리 | 가능    | 불가          |
| 셀 배정 추가/해제    | 가능    | 불가          |

---

## 6.10 셀 관리

| 작업       | admin | cell_leader |
| -------- | ----- | ----------- |
| 셀 목록 조회  | 가능    | 배정 셀만 가능    |
| 셀 생성     | 가능    | 불가          |
| 셀 수정     | 가능    | 불가          |
| 셀 비활성화   | 가능    | 불가          |
| 셀 담당자 확인 | 가능    | 배정 셀만 가능    |

---

## 6.11 설정 및 백업

| 작업           | admin | cell_leader |
| ------------ | ----- | ----------- |
| 설정 조회        | 가능    | 불가          |
| 설정 수정        | 가능    | 불가          |
| 백업 생성        | 가능    | 불가          |
| Audit Log 조회 | 가능    | 불가          |

---

# 7. 담당 셀 판단 규칙

## 7.1 셀리더의 담당 셀 조회 조건

`user_cell_assignments`에서 아래 조건을 만족하는 row를 담당 셀로 본다.

```txt
user_id = 로그인 사용자 user_id
active = TRUE
end_date 비어 있음 또는 end_date >= 오늘
```

## 7.2 담당 셀이 없는 셀리더

`roles`에 `cell_leader`가 있지만 활성 배정 셀이 없을 수 있다.

이 경우:

* `/dashboard`에서 담당 셀이 없다는 안내 표시
* `/reports/new` 작성 불가
* `/members`에서는 표시할 성도 없음

안내 문구:

```txt
현재 배정된 셀이 없습니다.
관리자에게 문의해주세요.
```

---

# 8. 여러 셀 담당자 처리

한 사용자가 여러 셀에 배정될 수 있다.

## 8.1 `/dashboard`

* 배정 셀이 1개면 자동 선택
* 배정 셀이 2개 이상이면 셀 선택 드롭다운 표시
* 선택된 셀 기준으로 요약 정보 표시

## 8.2 `/reports/new`

* 배정 셀이 1개면 자동 선택
* 배정 셀이 2개 이상이면 셀 선택 드롭다운 표시
* 선택된 셀 인원 기준으로 리포트 작성

## 8.3 `/members`

* 기본적으로 배정된 모든 셀의 성도를 표시
* 셀 필터로 특정 담당 셀만 볼 수 있음

---

# 9. Admin + 셀리더 겸임자 처리

## 9.1 기본 진입

Admin + 셀리더 겸임자는 로그인 후 기본적으로 Admin Dashboard로 이동한다.

```txt
/admin/dashboard
```

## 9.2 모드 구분

UI에서는 현재 화면의 권한 맥락을 표시한다.

예:

```txt
현재 모드: Admin
현재 모드: 셀리더
```

## 9.3 데이터 범위

| 화면             | 기본 데이터 범위                      |
| -------------- | ------------------------------ |
| `/admin/*`     | 전체 데이터                         |
| `/dashboard`   | 배정된 셀                          |
| `/reports/new` | 배정된 셀 우선                       |
| `/members`     | Admin 모드에서는 전체, 셀리더 모드에서는 배정 셀 |

## 9.4 리포트 작성

Admin + 셀리더는 전체 셀에 대해 리포트를 작성할 수 있다.
다만 기본 선택은 본인에게 배정된 셀로 한다.

---

# 10. API 권한 검증 원칙

모든 보호 API는 서버 측에서 권한을 다시 검증한다.

프론트엔드에서 버튼을 숨기더라도, Apps Script API에서 다음을 반드시 확인한다.

```txt
1. requestUser.email 존재 여부
2. users에서 사용자 조회
3. active 여부
4. roles 확인
5. 필요한 role 확인
6. 셀 접근 권한 확인
```

---

# 11. 권한 에러 응답

## 11.1 미로그인

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다."
  }
}
```

## 11.2 권한 없음

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "이 작업을 수행할 권한이 없습니다."
  }
}
```

## 11.3 미등록 계정

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "등록되지 않은 계정입니다."
  }
}
```

## 11.4 비활성 계정

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "비활성화된 계정입니다."
  }
}
```

---

# 12. MVP 기준 권한 요약

MVP에서 반드시 구현해야 하는 권한은 다음과 같다.

```txt
1. 구글 이메일 기준 사용자 확인
2. users.active 확인
3. roles 기반 화면 접근 제어
4. admin 전체 접근
5. cell_leader 배정 셀 접근 제한
6. admin,cell_leader 복수 role 처리
7. user_cell_assignments 기반 담당 셀 확인
8. API 서버 측 권한 검증
```

---

# 13. Phase 2 권한 Helper 구현 기준

`lib/permissions.ts`의 권한 함수는 mock 전역 데이터에 직접 의존하지 않는 순수 함수로 구현한다.

* 사용자, 셀 배정 목록, 기준일을 인자로 받는다.
* 활성 배정은 `active = TRUE`, `start_date <= 기준일`, `end_date >= 기준일` 조건을 함께 확인한다.
* Admin이라도 셀리더 모드에서는 배정 셀 범위를 사용한다.
* 리포트 수정은 Admin이면 허용하고, 셀리더는 배정 셀 및 해당 주차 안에서만 허용한다.
* 비활성 사용자는 모든 수정 작업을 허용하지 않는다.

---

# 14. Phase 3-4 Reports API 적용

Apps Script Reports API는 모든 요청에서 활성 사용자와 roles를 다시 확인한다.

```txt
Admin: 전체 셀 리포트 조회·생성·수정, 잠금 리포트 수정 가능
cell_leader: 현재 활성 배정 셀 리포트만 조회·생성·수정 가능
cell_leader 수정 조건: 오늘이 week_start_date ~ week_end_date 범위이며 locked가 아님
주차 종료 리포트: 저장값과 관계없이 locked로 간주
새 리포트: 활성 셀에만 생성
기존 비활성 셀 리포트: Admin만 수정 가능
```

동일 `cell_id + week_start_date` 리포트와 동일 `report_id + member_id` 개인 기록은 중복 저장하지 않는다.

---

# 15. Phase 3-5 Admin 관리 API 적용

```txt
getUsers / createUser / updateUser: Admin 전용
assignUserToCell / unassignUserFromCell: Admin 전용
createCell / updateCell: Admin 전용
getCells: Admin은 전체, cell_leader는 현재 활성 배정 셀만 조회
createNewcomer: 비로그인 제출 허용, 개인정보 수집 동의 필수
getNewcomers / updateNewcomerStatus / convertNewcomerToMember: Admin 전용
```

`admin,cell_leader` 복수 역할 사용자는 Admin 권한을 유지하며 배정 셀 정보도 함께 가진다. 모든 관리 권한은 Apps Script 서버에서 다시 검증한다.

---

# 16. Phase 5 OAuth 및 페이지 접근 제어

```txt
1. Google OAuth 로그인 성공
2. Google 계정 이메일로 verifyUser 호출
3. 미등록 계정과 active = FALSE 계정 차단
4. Auth.js 암호화 JWT 세션에 검증된 사용자와 roles 저장
5. middleware와 서버 layout에서 로그인 및 admin role 확인
6. Apps Script API에서 active, roles, 셀 접근 권한 재검증
```

Role별 기본 redirect:

```txt
admin → /admin/dashboard
cell_leader → /dashboard
admin,cell_leader → /admin/dashboard
```

비로그인 사용자가 보호 페이지에 접근하면 `/login`으로 이동한다. `cell_leader`가 `/admin/*`에 접근하면 `/dashboard`로 이동한다. 메뉴 숨김은 편의 기능이며 실제 권한은 서버에서 다시 확인한다.

---

# 17. Supabase RLS 정책

초기 RLS 정책은 `supabase/migrations/202606140001_initial_schema_and_rls.sql`에서 관리한다.

* 활성 `users.auth_user_id = auth.uid()` 매핑만 앱 사용자로 인정한다.
* Admin은 모든 앱 테이블을 관리할 수 있다.
* 셀리더는 현재 활성 배정 셀, 해당 셀 성도·리포트·개인 기록·특이사항만 조회한다.
* 셀리더는 배정 셀의 수정 가능 주차 리포트와 특이사항만 생성·수정한다.
* Users, Newcomers, Settings, Audit Logs와 장기결석 확인·해결 작업은 Admin 전용이다.
* 비활성 사용자는 role 값과 관계없이 보호 데이터에 접근할 수 없다.
* `anon` 역할은 앱 테이블에 직접 접근할 수 없다.

Admin + 셀리더의 화면상 셀리더 모드 필터는 서버 쿼리에서 배정 셀 조건을 추가한다. RLS는 Admin
권한을 제거하지 않으므로 전체 접근을 허용하는 최종 보안 경계로 동작한다.

공개 새신자 등록은 후속 Next.js Route Handler가 검증 후 서버 전용 secret key로 저장한다.
브라우저에는 secret key를 노출하지 않고 `newcomers`에 `anon` insert 정책을 추가하지 않는다.

성도 CSV 일괄 등록은 Admin 전용이다. `/api/admin/members/import`가 Auth.js 세션의 Admin role을
재검증한 후에만 `service_role` 전용 PostgreSQL RPC를 호출한다. 셀리더, 비로그인 사용자,
일반 `authenticated` DB role은 해당 RPC를 직접 실행할 수 없다.

---
