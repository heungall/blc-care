# BLC Care DB Schema

## 1. 문서 개요

본 문서는 BLC Care의 1차 데이터베이스 구조를 정의한다.

BLC Care는 1차 버전에서 Google Sheets를 데이터베이스처럼 사용한다.
각 Sheet는 하나의 테이블처럼 사용하며, 각 Row는 하나의 데이터 레코드를 의미한다.

향후 Supabase, Firebase, PostgreSQL 등으로 이전할 수 있도록 ID 기반 관계형 구조를 유지한다.

---

# 2. 공통 규칙

## 2.1 ID 규칙

각 주요 데이터는 고유 ID를 가진다.

| 구분            | 예시         |
| ------------- | ---------- |
| user_id       | user_001   |
| assignment_id | assign_001 |
| member_id     | mem_001    |
| cell_id       | cell_001   |
| history_id    | hist_001   |
| report_id     | report_001 |
| record_id     | rec_001    |
| note_id       | note_001   |
| newcomer_id   | new_001    |
| alert_id      | alert_001  |
| log_id        | log_001    |

추천 형식:

```txt
prefix_yyyyMMddHHmmss_random
```

예시:

```txt
mem_20260612093015_a8f3
```

---

## 2.2 날짜/시간 규칙

날짜와 시간은 문자열로 저장한다.

| 타입       | 형식                  | 예시                  |
| -------- | ------------------- | ------------------- |
| date     | YYYY-MM-DD          | 2026-06-12          |
| datetime | YYYY-MM-DD HH:mm:ss | 2026-06-12 09:30:15 |
| year     | YYYY                | 2020                |

기준 시간대는 `Asia/Seoul`로 한다.

---

## 2.3 Boolean 규칙

Google Sheets에서는 Boolean 값을 문자열로 저장한다.

| 의미 | 저장값   |
| -- | ----- |
| 참  | TRUE  |
| 거짓 | FALSE |

---

## 2.4 상태값 규칙

상태값은 영문 enum으로 저장한다.
화면에서는 한글 라벨로 변환하여 보여준다.

예시:

| 저장값       | 화면 표시 |
| --------- | ----- |
| active    | 활동    |
| dormant   | 휴면    |
| converted | 전환 완료 |

---

## 2.5 삭제 규칙

데이터는 기본적으로 물리 삭제하지 않는다.

삭제가 필요한 경우 다음 방식 중 하나를 사용한다.

* `status` 값을 변경한다.
* `active` 값을 `FALSE`로 변경한다.
* `deleted_at` 컬럼을 사용한다.

---

# 3. Sheet 목록

Google Sheets 파일에는 다음 Sheet를 생성한다.

```txt
users
user_cell_assignments
members
cells
cell_member_history
weekly_cell_reports
weekly_member_records
member_notes
newcomers
absence_alerts
settings
audit_logs
```

각 Sheet의 첫 번째 Row는 반드시 컬럼명으로 사용한다.

---

# 4. users

## 4.1 설명

구글 로그인 사용자 정보를 저장한다.

Admin, 셀리더 등 로그인 가능한 사용자를 관리한다.
한 사용자는 하나 이상의 role을 가질 수 있다.

예:

```txt
admin
cell_leader
admin,cell_leader
```

---

## 4.2 컬럼

| 컬럼명        | 타입       | 필수 | 설명            |
| ---------- | -------- | -- | ------------- |
| user_id    | string   | Y  | 사용자 고유 ID     |
| email      | string   | Y  | 구글 로그인 이메일    |
| name       | string   | Y  | 사용자 이름        |
| roles      | string   | Y  | 역할 목록. 쉼표로 구분 |
| active     | boolean  | Y  | 계정 활성 여부      |
| created_at | datetime | Y  | 생성일시          |
| updated_at | datetime | Y  | 수정일시          |

---

## 4.3 roles 값

| 값           | 설명     |
| ----------- | ------ |
| admin       | 전체 관리자 |
| cell_leader | 셀리더    |

복수 role은 쉼표로 저장한다.

```txt
admin,cell_leader
```

---

## 4.4 예시

| user_id  | email                                             | name  | roles             | active |
| -------- | ------------------------------------------------- | ----- | ----------------- | ------ |
| user_001 | [pastor@example.com](mailto:pastor@example.com)   | 목사님   | admin,cell_leader | TRUE   |
| user_002 | [leader1@example.com](mailto:leader1@example.com) | 1셀 리더 | cell_leader       | TRUE   |
| user_003 | [admin@example.com](mailto:admin@example.com)     | 운영자   | admin             | TRUE   |

---

# 5. user_cell_assignments

## 5.1 설명

사용자와 셀의 담당 관계를 저장한다.

한 사용자는 여러 셀을 담당할 수 있다.
한 셀에도 여러 담당자가 있을 수 있다.

셀리더가 담당하는 셀은 `users`가 아니라 이 Sheet를 기준으로 판단한다.

---

## 5.2 컬럼

| 컬럼명             | 타입       | 필수 | 설명                 |
| --------------- | -------- | -- | ------------------ |
| assignment_id   | string   | Y  | 배정 ID              |
| user_id         | string   | Y  | 사용자 ID             |
| cell_id         | string   | Y  | 셀 ID               |
| assignment_role | string   | Y  | leader / assistant |
| active          | boolean  | Y  | 활성 여부              |
| start_date      | date     | N  | 담당 시작일             |
| end_date        | date     | N  | 담당 종료일             |
| created_at      | datetime | Y  | 생성일시               |
| updated_at      | datetime | Y  | 수정일시               |

---

## 5.3 assignment_role 값

| 값         | 설명     |
| --------- | ------ |
| leader    | 대표 셀리더 |
| assistant | 보조 리더  |

---

## 5.4 규칙

* `users.roles`에 `cell_leader`가 있는 사용자는 셀리더 기능을 사용할 수 있다.
* 실제 담당 셀은 `user_cell_assignments`에서 확인한다.
* `active = TRUE`인 배정만 현재 담당 셀로 본다.
* Admin은 이 배정과 관계없이 전체 셀에 접근할 수 있다.
* 한 사용자가 admin과 cell_leader를 동시에 가질 수 있다.
* 한 사용자가 여러 셀에 배정될 수 있다.
* 한 셀에 여러 사용자가 배정될 수 있다.

---

## 5.5 예시

| assignment_id | user_id  | cell_id  | assignment_role | active |
| ------------- | -------- | -------- | --------------- | ------ |
| assign_001    | user_001 | cell_001 | leader          | TRUE   |
| assign_002    | user_002 | cell_002 | leader          | TRUE   |
| assign_003    | user_003 | cell_002 | assistant       | TRUE   |

---

# 6. cells

## 6.1 설명

셀 정보를 저장한다.

셀리더 정보는 이 Sheet에 직접 저장하지 않고 `user_cell_assignments`에서 관리한다.

---

## 6.2 컬럼

| 컬럼명        | 타입       | 필수 | 설명       |
| ---------- | -------- | -- | -------- |
| cell_id    | string   | Y  | 셀 고유 ID  |
| cell_name  | string   | Y  | 셀 이름     |
| active     | boolean  | Y  | 셀 운영 여부  |
| sort_order | number   | N  | 화면 표시 순서 |
| created_at | datetime | Y  | 생성일시     |
| updated_at | datetime | Y  | 수정일시     |

---

## 6.3 예시

| cell_id  | cell_name | active | sort_order |
| -------- | --------- | ------ | ---------- |
| cell_001 | 1셀        | TRUE   | 1          |
| cell_002 | 2셀        | TRUE   | 2          |

---

# 7. members

## 7.1 설명

성도 기본 정보를 저장한다.

---

## 7.2 컬럼

| 컬럼명                | 타입       | 필수 | 설명                                 |
| ------------------ | -------- | -- | ---------------------------------- |
| member_id          | string   | Y  | 성도 고유 ID                           |
| full_name          | string   | Y  | 전체 이름                              |
| display_name       | string   | Y  | 화면 표시 이름                           |
| name_aliases       | string   | N  | 이름 별칭. 쉼표로 구분                      |
| photo_file_id      | string   | N  | Google Drive 사진 파일 ID              |
| photo_url          | string   | N  | 사진 표시 URL                          |
| phone              | string   | N  | 휴대폰 번호                             |
| birth_date         | date     | N  | 생년월일                               |
| age                | number   | N  | 나이. 가능하면 birth_date 기반 계산 권장       |
| first_visit_date   | date     | N  | 첫방문일                               |
| registration_date  | date     | N  | 등록일                                |
| address            | string   | N  | 거주지                                |
| workplace          | string   | N  | 직장명                                |
| occupation         | string   | N  | 직업                                 |
| job_title          | string   | N  | 직책                                 |
| faith_start_year   | string   | N  | 믿음 시작 년도                           |
| bible_study_status | string   | N  | 학습 여부                              |
| baptism_status     | string   | N  | 세례 여부                              |
| family_info        | string   | N  | 가족관계                               |
| current_cell_id    | string   | N  | 현재 소속 셀 ID                         |
| status             | string   | Y  | active / dormant / left / archived |
| memo               | string   | N  | 기본 메모                              |
| created_at         | datetime | Y  | 생성일시                               |
| updated_at         | datetime | Y  | 수정일시                               |
| created_by         | string   | N  | 생성자 user_id                        |
| updated_by         | string   | N  | 수정자 user_id                        |

기존 `members` Sheet에는 아래 컬럼을 정확한 이름으로 추가한다. 값은 선택값이므로 기존 행은 빈 셀로 유지할 수 있다.

```txt
workplace
occupation
job_title
```

---

## 7.3 status 값

| 값        | 설명          |
| -------- | ----------- |
| active   | 활동          |
| dormant  | 휴면          |
| left     | 이탈 또는 출석 중단 |
| archived | 보관          |

---

## 7.4 bible_study_status 값

| 값           | 설명    |
| ----------- | ----- |
| unknown     | 미확인   |
| not_started | 미학습   |
| in_progress | 학습 중  |
| completed   | 학습 완료 |

---

## 7.5 baptism_status 값

| 값               | 설명   |
| --------------- | ---- |
| unknown         | 미확인  |
| not_baptized    | 미세례  |
| baptized        | 세례   |
| infant_baptized | 유아세례 |
| confirmation    | 입교   |

---

## 7.6 name_aliases 예시

```txt
장지현,지현,지현자매
김진수,진수,진수형제
박주원,주원
```

기도제목 일괄 입력 자동 분리 기능에서 사용한다.

---

# 8. cell_member_history

## 8.1 설명

성도의 셀 이동 이력을 저장한다.

현재 셀은 `members.current_cell_id`에 저장하고, 과거 이력은 이 Sheet에 저장한다.

---

## 8.2 컬럼

| 컬럼명          | 타입       | 필수 | 설명              |
| ------------ | -------- | -- | --------------- |
| history_id   | string   | Y  | 셀 변경 이력 ID      |
| member_id    | string   | Y  | 성도 ID           |
| from_cell_id | string   | N  | 이전 셀 ID         |
| to_cell_id   | string   | Y  | 변경된 셀 ID        |
| start_date   | date     | Y  | 변경 시작일          |
| end_date     | date     | N  | 종료일. 현재 소속이면 비움 |
| reason       | string   | N  | 변경 사유           |
| changed_by   | string   | N  | 변경 처리자 user_id  |
| created_at   | datetime | Y  | 생성일시            |

---

## 8.3 규칙

* 한 성도는 현재 시점에 하나의 활성 셀 이력만 가져야 한다.
* 현재 셀 이력은 `end_date`가 비어 있다.
* 셀 변경 시 기존 이력의 `end_date`를 채우고 새 이력을 생성한다.
* 동시에 `members.current_cell_id`도 최신 셀로 업데이트한다.

---

# 9. weekly_cell_reports

## 9.1 설명

주차별 셀 리포트의 헤더 정보를 저장한다.

한 셀의 한 주차 리포트는 기본적으로 1건만 생성한다.

---

## 9.2 컬럼

| 컬럼명             | 타입       | 필수 | 설명                         |
| --------------- | -------- | -- | -------------------------- |
| report_id       | string   | Y  | 리포트 ID                     |
| week_start_date | date     | Y  | 주차 시작일                     |
| week_end_date   | date     | Y  | 주차 종료일                     |
| report_date     | date     | N  | 실제 모임일                     |
| cell_id         | string   | Y  | 셀 ID                       |
| leader_user_id  | string   | Y  | 작성자 user_id                |
| overall_summary | string   | N  | 전체 나눔 요약                   |
| status          | string   | Y  | draft / submitted / locked |
| locked          | boolean  | Y  | 수정 잠금 여부                   |
| created_at      | datetime | Y  | 생성일시                       |
| updated_at      | datetime | Y  | 수정일시                       |
| submitted_at    | datetime | N  | 제출일시                       |

---

## 9.3 status 값

| 값         | 설명    |
| --------- | ----- |
| draft     | 임시저장  |
| submitted | 제출 완료 |
| locked    | 수정 잠금 |

---

## 9.4 유니크 규칙

다음 조합은 중복되지 않아야 한다.

```txt
cell_id + week_start_date
```

동일 셀, 동일 주차에 이미 리포트가 있으면 새로 생성하지 않고 기존 리포트를 수정한다.

---

# 10. weekly_member_records

## 10.1 설명

주차별 셀 리포트에 포함된 개인별 기록을 저장한다.

성도 개인 상세 페이지의 출결, 나눔, 기도제목, 지원 제안 히스토리의 기반 데이터다.

---

## 10.2 컬럼

| 컬럼명                     | 타입       | 필수 | 설명                                   |
| ----------------------- | -------- | -- | ------------------------------------ |
| record_id               | string   | Y  | 개인 기록 ID                             |
| report_id               | string   | Y  | 연결된 셀 리포트 ID                         |
| member_id               | string   | Y  | 성도 ID                                |
| cell_id                 | string   | Y  | 당시 셀 ID                              |
| week_start_date         | date     | Y  | 주차 시작일                               |
| report_date             | date     | N  | 실제 모임일                               |
| attendance_status       | string   | Y  | present / absent / excused / unknown |
| absence_reason          | string   | N  | 결석 사유                                |
| sharing_summary         | string   | N  | 개인 나눔 요약                             |
| prayer_request          | string   | N  | 개인 기도제목                              |
| support_suggestion      | string   | N  | 지원 제안                                |
| prayer_source_text      | string   | N  | 기도제목 일괄 입력 원본                        |
| prayer_parsed_by        | string   | N  | manual / rule / ai                   |
| prayer_parse_confidence | number   | N  | 매칭 신뢰도                               |
| created_at              | datetime | Y  | 생성일시                                 |
| updated_at              | datetime | Y  | 수정일시                                 |
| created_by              | string   | N  | 생성자 user_id                          |
| updated_by              | string   | N  | 수정자 user_id                          |

---

## 10.3 attendance_status 값

| 값       | 설명    |
| ------- | ----- |
| present | 출석    |
| absent  | 결석    |
| excused | 사유 결석 |
| unknown | 미확인   |

---

## 10.4 prayer_parsed_by 값

| 값      | 설명                       |
| ------ | ------------------------ |
| manual | 직접 입력                    |
| rule   | 규칙 기반 자동 분리              |
| ai     | AI 기반 분리. MVP에서는 사용하지 않음 |

---

## 10.5 유니크 규칙

다음 조합은 중복되지 않아야 한다.

```txt
report_id + member_id
```

한 리포트 안에서 같은 성도의 개인 기록은 1건만 존재해야 한다.

---

# 11. member_notes

## 11.1 설명

성도별 특이사항을 저장한다.

특이사항은 해결 여부를 체크할 수 있다.

---

## 11.2 컬럼

| 컬럼명           | 타입       | 필수 | 설명             |
| ------------- | -------- | -- | -------------- |
| note_id       | string   | Y  | 특이사항 ID        |
| member_id     | string   | Y  | 성도 ID          |
| note          | string   | Y  | 특이사항 내용        |
| recorded_date | date     | Y  | 기록일            |
| recorded_by   | string   | Y  | 기록자 user_id    |
| resolved      | boolean  | Y  | 해결 여부          |
| resolved_date | date     | N  | 해결일            |
| resolved_by   | string   | N  | 해결 처리자 user_id |
| created_at    | datetime | Y  | 생성일시           |
| updated_at    | datetime | Y  | 수정일시           |

---

## 11.3 규칙

* 기본값은 `resolved = FALSE`다.
* 해결 체크 시 `resolved = TRUE`, `resolved_date`, `resolved_by`를 기록한다.
* 미해결 특이사항만 필터링할 수 있어야 한다.

---

# 12. newcomers

## 12.1 설명

로그인 없이 제출된 새신자 등록 정보를 저장한다.

Admin은 이 정보를 확인한 뒤 성도 DB로 전환할 수 있다.

---

## 12.2 컬럼

| 컬럼명                 | 타입       | 필수 | 설명                                     |
| ------------------- | -------- | -- | -------------------------------------- |
| newcomer_id         | string   | Y  | 새신자 ID                                 |
| name                | string   | Y  | 이름                                     |
| phone               | string   | Y  | 휴대폰 번호                                 |
| address             | string   | N  | 주소                                     |
| visit_motivation    | string   | N  | 방문동기                                   |
| visit_channel       | string   | N  | 방문경로                                   |
| faith_experience    | string   | N  | 신앙생활 경험                                |
| after_service_plan  | string   | N  | 예배 이후 일정                               |
| privacy_agreed      | boolean  | Y  | 개인정보 수집 동의                             |
| status              | string   | Y  | new / contacted / converted / archived |
| admin_memo          | string   | N  | Admin 메모                               |
| converted_member_id | string   | N  | 전환된 성도 ID                              |
| submitted_at        | datetime | Y  | 제출일시                                   |
| updated_at          | datetime | Y  | 수정일시                                   |
| converted_at        | datetime | N  | 성도 전환일시                                |
| converted_by        | string   | N  | 전환 처리자 user_id                         |

---

## 12.3 status 값

| 값         | 설명          |
| --------- | ----------- |
| new       | 신규 제출       |
| contacted | 연락 완료       |
| converted | 성도 DB 전환 완료 |
| archived  | 보관          |

---

## 12.4 규칙

* 새신자 등록 시 `privacy_agreed = TRUE`여야 제출 가능하다.
* 성도 DB 전환 시 `members`에 새 row를 생성한다.
* 성도 DB 전환 시 최초 소속 셀을 기록하는 `cell_member_history` row도 생성한다.
* 전환 완료 후 `status = converted`로 변경한다.
* 전환된 성도 ID를 `converted_member_id`에 저장한다.

---

# 13. absence_alerts

## 13.1 설명

장기결석자 확인 및 조치 이력을 저장한다.

장기결석 대상 여부 자체는 `weekly_member_records`의 출석 기록을 기준으로 계산한다.
다만 Admin이 확인하거나 조치한 기록은 이 Sheet에 저장한다.

---

## 13.2 컬럼

| 컬럼명                | 타입       | 필수 | 설명                        |
| ------------------ | -------- | -- | ------------------------- |
| alert_id           | string   | Y  | 장기결석 알림 ID                |
| member_id          | string   | Y  | 성도 ID                     |
| cell_id            | string   | N  | 현재 셀 ID                   |
| last_attended_date | date     | N  | 마지막 출석일                   |
| absence_months     | number   | N  | 결석 개월 수                   |
| status             | string   | Y  | open / checked / resolved |
| memo               | string   | N  | 조치 메모                     |
| created_at         | datetime | Y  | 생성일시                      |
| checked_at         | datetime | N  | 확인일시                      |
| checked_by         | string   | N  | 확인 처리자 user_id            |
| resolved_at        | datetime | N  | 해결일시                      |
| resolved_by        | string   | N  | 해결 처리자 user_id            |

---

## 13.3 status 값

| 값        | 설명    |
| -------- | ----- |
| open     | 미확인   |
| checked  | 확인 완료 |
| resolved | 해결 완료 |

---

## 13.4 규칙

* 기본 장기결석 기준은 `settings.long_absence_months` 값을 사용한다.
* 같은 성도에 대해 열린 상태의 alert가 이미 있으면 중복 생성하지 않는다.
* 출석이 재개되면 기존 alert를 resolved 처리할 수 있다.

---

# 14. settings

## 14.1 설명

시스템 설정값을 저장한다.

---

## 14.2 컬럼

| 컬럼명         | 타입       | 필수 | 설명          |
| ----------- | -------- | -- | ----------- |
| key         | string   | Y  | 설정 키        |
| value       | string   | Y  | 설정 값        |
| description | string   | N  | 설명          |
| updated_at  | datetime | Y  | 수정일시        |
| updated_by  | string   | N  | 수정자 user_id |

---

## 14.3 기본 설정값

| key                      | value          | 설명              |
| ------------------------ | -------------- | --------------- |
| church_name              | Bluelight 홍대교회 | 교회명             |
| app_name                 | BLC Care       | 앱 이름            |
| long_absence_months      | 3              | 장기결석 기준 개월 수    |
| report_edit_deadline_day | Sunday         | 리포트 수정 가능 마감 요일 |
| timezone                 | Asia/Seoul     | 기준 시간대          |

---

# 15. audit_logs

## 15.1 설명

중요 데이터 변경 이력을 저장한다.

---

## 15.2 컬럼

| 컬럼명          | 타입       | 필수 | 설명                                                        |
| ------------ | -------- | -- | --------------------------------------------------------- |
| log_id       | string   | Y  | 로그 ID                                                     |
| action       | string   | Y  | create / update / delete / convert / resolve / login      |
| target_type  | string   | Y  | members / reports / records / notes / newcomers / cells 등 |
| target_id    | string   | Y  | 대상 데이터 ID                                                 |
| changed_by   | string   | N  | 변경자 user_id                                               |
| changed_at   | datetime | Y  | 변경일시                                                      |
| before_value | string   | N  | 변경 전 값. JSON 문자열                                          |
| after_value  | string   | N  | 변경 후 값. JSON 문자열                                          |
| memo         | string   | N  | 추가 메모                                                     |

---

## 15.3 action 값

| 값       | 설명            |
| ------- | ------------- |
| create  | 생성            |
| update  | 수정            |
| delete  | 삭제 또는 비활성화    |
| convert | 새신자 성도 전환     |
| resolve | 특이사항 또는 알림 해결 |
| login   | 로그인           |

---

## 15.4 로그 기록 대상

다음 작업은 audit log를 남긴다.

* 성도 생성/수정/휴면 처리
* 셀 생성/수정/비활성화
* 셀 담당자 배정/해제
* 셀 변경
* 셀 리포트 생성/수정
* 개인 기록 생성/수정
* 특이사항 생성/해결
* 새신자 생성/상태 변경/성도 전환
* 장기결석자 확인/해결
* 사용자 권한 변경

---

# 16. 관계 구조

## 16.1 주요 관계

```txt
users.user_id
  └─ user_cell_assignments.user_id
  └─ weekly_cell_reports.leader_user_id
  └─ member_notes.recorded_by
  └─ audit_logs.changed_by

user_cell_assignments.cell_id
  └─ cells.cell_id

cells.cell_id
  └─ members.current_cell_id
  └─ weekly_cell_reports.cell_id
  └─ weekly_member_records.cell_id
  └─ cell_member_history.from_cell_id
  └─ cell_member_history.to_cell_id
  └─ absence_alerts.cell_id

members.member_id
  └─ weekly_member_records.member_id
  └─ member_notes.member_id
  └─ cell_member_history.member_id
  └─ absence_alerts.member_id

weekly_cell_reports.report_id
  └─ weekly_member_records.report_id

newcomers.converted_member_id
  └─ members.member_id
```

---

# 17. 권한 판단 기준

## 17.1 Admin

사용자의 `roles`에 `admin`이 포함되어 있으면 Admin 권한을 가진다.

Admin은 전체 셀, 전체 성도, 전체 리포트에 접근할 수 있다.

---

## 17.2 셀리더

사용자의 `roles`에 `cell_leader`가 포함되어 있으면 셀리더 기능을 사용할 수 있다.

셀리더가 접근 가능한 셀은 `user_cell_assignments`에서 확인한다.

조건:

```txt
user_id = 로그인 사용자 ID
active = TRUE
end_date 비어 있음 또는 현재 날짜 이후
```

---

## 17.3 Admin + 셀리더 겸임

한 사용자가 `admin,cell_leader` 역할을 동시에 가질 수 있다.

이 경우:

* Admin 기능 전체 사용 가능
* 셀리더 기능도 사용 가능
* 기본 진입은 Admin Dashboard로 한다.
* 셀리더 화면에서는 본인에게 배정된 셀을 기본 선택한다.

---

# 18. Google Sheets 생성 순서

Google Sheets 파일에 아래 순서로 시트를 생성한다.

```txt
users
user_cell_assignments
members
cells
cell_member_history
weekly_cell_reports
weekly_member_records
member_notes
newcomers
absence_alerts
settings
audit_logs
```

---

# 19. 초기 데이터 입력 가이드

## 19.1 settings

초기 settings 예시:

| key                      | value          | description  |
| ------------------------ | -------------- | ------------ |
| church_name              | Bluelight 홍대교회 | 교회명          |
| app_name                 | BLC Care       | 앱 이름         |
| long_absence_months      | 3              | 장기결석 기준      |
| report_edit_deadline_day | Sunday         | 리포트 수정 가능 마감 |
| timezone                 | Asia/Seoul     | 기준 시간대       |

---

## 19.2 users

최초 Admin 계정을 1개 이상 등록한다.

| user_id  | email                                         | name | roles | active |
| -------- | --------------------------------------------- | ---- | ----- | ------ |
| user_001 | [admin@example.com](mailto:admin@example.com) | 관리자  | admin | TRUE   |

Admin이 셀리더도 겸임하는 경우:

| user_id  | email                                           | name | roles             | active |
| -------- | ----------------------------------------------- | ---- | ----------------- | ------ |
| user_001 | [pastor@example.com](mailto:pastor@example.com) | 목사님  | admin,cell_leader | TRUE   |

---

## 19.3 cells

운영 중인 셀을 등록한다.

| cell_id  | cell_name | active | sort_order |
| -------- | --------- | ------ | ---------- |
| cell_001 | 1셀        | TRUE   | 1          |
| cell_002 | 2셀        | TRUE   | 2          |

---

## 19.4 user_cell_assignments

셀리더와 셀의 담당 관계를 등록한다.

| assignment_id | user_id  | cell_id  | assignment_role | active |
| ------------- | -------- | -------- | --------------- | ------ |
| assign_001    | user_001 | cell_001 | leader          | TRUE   |
| assign_002    | user_002 | cell_002 | leader          | TRUE   |

---

## 19.5 members

개발 중에는 실제 성도 정보를 사용하지 않고 mock data를 사용한다.

---

# 20. 향후 DB 이전 고려사항

Google Sheets 기반으로 시작하지만, 추후 데이터가 늘어나면 별도 DB로 이전할 수 있다.

이전을 쉽게 하기 위해 다음 원칙을 지킨다.

* 모든 데이터는 고유 ID를 가진다.
* 화면에서는 row number에 의존하지 않는다.
* 관계는 이름이 아니라 ID로 연결한다.
* 사용자 role과 셀 배정 정보를 분리한다.
* API 응답 구조는 Google Sheets 내부 구조와 분리한다.
* 프론트엔드는 Apps Script가 아닌 API 추상화 계층을 통해 데이터를 요청한다.

---

# 21. Phase 2 TypeScript 매핑

`lib/types.ts`는 Sheet 행 구조를 기준으로 타입을 정의한다.

매핑 원칙:

```txt
date / datetime / year → TypeScript string alias
users.roles 쉼표 문자열 → TypeScript Role[]
members.name_aliases 쉼표 문자열 → TypeScript string[]
members.workplace / occupation / job_title → TypeScript optional string
선택 컬럼 → optional property
필수 컬럼 → required property
```

화면 전용 파생 데이터는 DB 엔티티와 분리한다.

```txt
MemberView = Member + 마지막 출석일 + 미해결 메모 수
WeeklyReportView = weekly_cell_reports + weekly_member_records[]
AppSettings = settings 행을 화면 입력 구조로 변환한 값
```

장기결석 계산은 최신 `present` 기록을 기준으로 한다. 출석 기록이 없으면 `registration_date`, 그 값도 없으면 `first_visit_date`를 기준일로 사용한다.

---

---
