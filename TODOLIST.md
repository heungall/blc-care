# BLC Care Supabase Migration TODO

서비스 중단을 허용하고 Google Apps Script / Google Sheets 런타임을 Supabase로 일괄 전환한다.
민감한 성도 및 돌봄 데이터는 Row Level Security(RLS) 검증이 끝난 뒤에만 반입한다.

## 1. Supabase 프로젝트 및 로컬 기반 준비

- [x] 저장소에 `supabase/config.toml`과 migration 디렉터리 추가
- [x] Supabase 환경변수 템플릿 추가
- [x] 기술 스택 변경을 요구사항, DB, 권한, 개인정보, 개발 계획 문서에 기록
- [x] Supabase CLI를 개발 의존성으로 설치
- [x] Supabase hosted project 생성
- [x] Project URL, publishable key, secret key를 로컬 환경변수에 등록
- [ ] Project URL, publishable key, secret key를 Vercel 환경변수에 등록
- [x] Supabase CLI로 hosted project link 확인

완료 기준:

- 저장소에 실제 key나 실제 개인정보가 포함되지 않는다.
- `supabase/config.toml`이 로컬 개발 기준을 정의한다.
- hosted project 연결 정보가 `.env.local`과 Vercel에만 존재한다.

## 2. PostgreSQL 스키마 및 RLS 구현

- [x] 기존 12개 Sheet 엔티티를 PostgreSQL migration SQL로 변환
- [x] UUID, 외래키, unique constraint, enum/check constraint, 인덱스 적용
- [x] `users.auth_user_id`와 `auth.users.id` 연결
- [x] Admin / 셀리더 접근 helper SQL 함수 구현
- [x] 모든 민감 테이블에 RLS 활성화
- [x] Admin 전체 접근, 셀리더 배정 셀 접근 정책 구현
- [x] 공개 새신자 등록용 제한된 서버 경로 설계
- [x] RLS 정책 테스트 추가
- [x] hosted Supabase에 초기 migration 적용 및 원격 DB lint 통과 확인
- [ ] Docker 기반 로컬 Supabase에서 migration reset, RLS 테스트, DB lint 통과 확인

## 3. Supabase Auth 및 API 전환

- [ ] `@supabase/supabase-js`, `@supabase/ssr` 설치
- [ ] Supabase Google OAuth 설정
- [ ] 브라우저 / 서버 Supabase client 구성
- [ ] 기존 Auth.js 및 `/api/gas` 의존성 제거
- [ ] `lib/api.ts`를 Supabase query / RPC 기반으로 교체
- [ ] Members, Reports, Newcomers, Admin 기능을 Supabase로 연결
- [ ] 복합 저장 작업을 PostgreSQL 함수 또는 서버 Route Handler로 구현

## 4. Storage, 백업 및 운영 기능 전환

- [ ] 성도 사진을 private Supabase Storage bucket으로 이전
- [ ] Storage 접근 정책 구현
- [ ] PostgreSQL 백업 및 복구 절차 문서화
- [ ] Audit log 기록과 조회 검증
- [ ] Apps Script Backup 기능 대체

## 5. 데이터 반입 및 전환 검증

- [ ] Google Sheets 데이터를 민감정보 없는 테스트 데이터로 먼저 반입
- [ ] 실제 데이터 반입 전 백업 생성
- [ ] 소량의 운영 데이터를 CSV로 export 후 Supabase에 일회성 import
- [ ] ID 관계, 날짜, role 배열, name alias 배열 검증
- [ ] Admin / 셀리더 / 미등록 사용자 권한 검증
- [ ] 기도제목, 나눔, 특이사항 비인가 노출 차단 검증
- [ ] 주요 화면 및 저장 흐름 통합 테스트

## 6. 전환 완료 및 정리

- [ ] Vercel 환경변수를 Supabase 기준으로 교체
- [ ] Supabase 버전을 Vercel에 배포
- [ ] 운영 확인 후 Apps Script Web App 사용 중단
- [ ] `gas-backend/`, GAS 환경변수, 배포 문서 제거
- [ ] Google Sheets는 읽기 전용 백업으로 보관
- [ ] 문서와 `HISTORY.md` 최종 동기화
