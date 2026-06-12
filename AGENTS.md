# AGENTS.md

## Project Overview

This project is **BLC Care**, a church attendance and care management web application for Bluelight Hongdae Church.

The app helps church admins and cell leaders manage:

* church members
* cell assignments
* weekly attendance reports
* sharing summaries
* prayer requests
* care notes
* newcomers
* long-term absence checks

This project handles sensitive personal and pastoral care data. Privacy, access control, and safe data handling are mandatory.

---

## Required Reference Documents

Before making changes, read the relevant documents in `docs/`.

Core documents:

```txt
docs/01_REQUIREMENTS.md
docs/02_DB_SCHEMA.md
docs/03_SCREEN_FLOW.md
docs/04_API_SPEC.md
docs/05_PERMISSION_RULES.md
docs/06_PRAYER_PARSER_RULES.md
docs/07_PRIVACY_POLICY.md
docs/08_DEVELOPMENT_PLAN.md
docs/09_DESIGN_SYSTEM.md
```

When implementing a feature, follow the document most closely related to that feature.

Examples:

* DB or type changes → `02_DB_SCHEMA.md`
* Routing or screens → `03_SCREEN_FLOW.md`
* API calls → `04_API_SPEC.md`
* Role/access logic → `05_PERMISSION_RULES.md`
* Prayer parser → `06_PRAYER_PARSER_RULES.md`
* Personal data handling → `07_PRIVACY_POLICY.md`

---

## Tech Stack

Use the following stack unless explicitly instructed otherwise.

```txt
Frontend: Next.js App Router
Language: TypeScript
UI: Tailwind CSS + shadcn/ui
Forms: React Hook Form + Zod
Backend: Google Apps Script Web App
Database: Google Sheets
File Storage: Google Drive
Auth: Google OAuth
Deploy: Vercel
```

---

## Development Phase Rule

Do not implement everything at once.

Follow this order:

```txt
1. Mock UI
2. Type definitions
3. Domain logic
4. Prayer parser
5. Mock API client
6. Google Apps Script API
7. Real API integration
8. Google OAuth
9. Permission hardening
10. Production cleanup
```

Unless the task explicitly says otherwise, prefer mock data first.

---

## Privacy and Data Safety Rules

Never add real church member data to the repository.

Do not create sample data that looks like real personal information.

Use fake data only, for example:

```txt
홍길동
김철수
박영희
010-0000-0000
서울시 샘플구
```

Never commit:

```txt
.env
.env.local
Google OAuth secrets
Apps Script deployment secrets
real member data
real phone numbers
real addresses
real workplace, occupation, or job title information
real prayer requests
photos of real people
Google Sheets exports containing personal data
```

Prayer requests, sharing summaries, care notes, faith history, and newcomer information must be treated as sensitive data.

Do not send prayer requests or personal data to external AI APIs.

---

## Permission Rules

The app supports multiple roles per user.

Examples:

```txt
admin
cell_leader
admin,cell_leader
```

Important rules:

* A user can have both `admin` and `cell_leader`.
* Admin users can access all data.
* Cell leaders can access only assigned cells.
* Cell assignments are stored separately from users.
* Use `user_cell_assignments` to determine which cells a cell leader can access.
* Never rely on frontend-only checks for permissions.
* Server/API logic must verify permissions again.

---

## Data Model Rules

Use ID-based relationships.

Do not rely on Google Sheets row numbers.

Use the schema from `docs/02_DB_SCHEMA.md`.

Important entities:

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

Roles are stored as comma-separated strings in the DB but should be handled as arrays in TypeScript.

Name aliases are stored as comma-separated strings in the DB but should be handled as arrays in TypeScript.

---

## Prayer Parser Rules

The prayer parser is a core feature.

MVP must use rule-based parsing only.

Do not use external AI.

Supported examples:

```txt
지현 : 회사 일이 잘 마무리되도록
김진수: 가족 건강을 위해
주원자매 - 시험 준비를 위해
민지) 가족과의 관계 회복을 위해
하은/ 새로운 직장 적응을 위해
```

Parser requirements:

* Match within the selected cell only.
* Support full name and given name.
* Support aliases from `name_aliases`.
* Remove common titles such as `님`, `자매`, `형제`, `집사`, `목사`, `전도사`, `리더`.
* If multiple members match, return `ambiguous`.
* If no member matches, return `unmatched`.
* Never save parsed results automatically.
* Always require user confirmation before saving.

Follow `docs/06_PRAYER_PARSER_RULES.md`.

---

## UI Rules

When implementing UI, follow:

```txt
docs/09_DESIGN_SYSTEM.md
```

General UI principles:

* Prioritize mobile usability for cell leaders.
* Prioritize clear overview and efficient management for Admin users.
* Use calm, warm, clear, pastoral-care-oriented design.
* Reuse existing components and design patterns.
* Do not create inconsistent one-off styles.
* Use consistent status badges for member status, attendance status, report status, newcomer status, and absence status.
* Keep sensitive information visually calm. Do not over-highlight prayer requests, care notes, or private member details.
* Prayer Parser UI must always include user confirmation before saving parsed results.

Especially optimize:

```txt
/reports/new
PrayerBulkInput
PrayerParseResultList
MemberCard
MemberDetail
AdminDashboard
```


---

## Code Style

Use TypeScript strictly.

Prefer:

```txt
small components
clear types
pure utility functions
server/API wrappers isolated in lib/api.ts
mock data isolated in lib/mock-data.ts
permission helpers isolated in lib/permissions.ts
prayer parser isolated in lib/prayer-parser.ts
date helpers isolated in lib/date.ts
```

Avoid:

```txt
large page files
duplicated role logic
hardcoded user emails
hardcoded sheet row numbers
business logic hidden inside components
direct fetch calls scattered across components
```

---

## Suggested Project Structure

```txt
app/
components/
lib/
hooks/
docs/
gas-backend/
public/
```

Suggested `lib/` files:

```txt
lib/api.ts
lib/auth.ts
lib/types.ts
lib/permissions.ts
lib/prayer-parser.ts
lib/date.ts
lib/mock-data.ts
```

Suggested `gas-backend/` files:

```txt
gas-backend/Code.gs
gas-backend/Router.gs
gas-backend/Response.gs
gas-backend/Auth.gs
gas-backend/Sheets.gs
gas-backend/Users.gs
gas-backend/Cells.gs
gas-backend/Members.gs
gas-backend/Reports.gs
gas-backend/PrayerParser.gs
gas-backend/Notes.gs
gas-backend/Newcomers.gs
gas-backend/Absence.gs
gas-backend/Settings.gs
gas-backend/AuditLogs.gs
```

---

## Testing Expectations

When changing logic, add or update tests when practical.

Priority test targets:

```txt
permission helpers
prayer parser
date/week calculation
long absence calculation
API payload transformation
```

At minimum, manually verify:

```txt
npm run lint
npm run typecheck
npm run dev
```

If these scripts do not exist, add reasonable scripts to `package.json`.

---

## Implementation Rules for Codex

Before editing, inspect the relevant files and docs.

After editing:

1. summarize changed files
2. explain what was implemented
3. mention any tests or checks run
4. list remaining TODOs

Do not make unrelated large refactors.

Do not change documented requirements unless explicitly asked.

If a requirement is unclear, make the smallest safe assumption and document it in the response.

---
## Documentation Sync Rules

When requirements, data schema, screen flow, API behavior, permission logic, or privacy rules change during development, update the related document immediately.

Do not leave implementation changes only in code.

Update the matching document:

```txt
Requirement changes → docs/01_REQUIREMENTS.md
DB or type changes → docs/02_DB_SCHEMA.md
Screen or route changes → docs/03_SCREEN_FLOW.md
API changes → docs/04_API_SPEC.md
Permission changes → docs/05_PERMISSION_RULES.md
Prayer parser changes → docs/06_PRAYER_PARSER_RULES.md
Privacy or data handling changes → docs/07_PRIVACY_POLICY.md
Development process changes → docs/08_DEVELOPMENT_PLAN.md
```

Rules:

* If code and docs conflict, do not silently choose one.
* Update the docs to match the final decision.
* Mention the documentation update in the final work summary.
* If a requirement is unclear, make the smallest safe assumption and record it as a TODO in the relevant document or `HISTORY.md`.
* Keep docs concise but current.


---

## Current MVP Priority

Build the MVP in this order:

```txt
1. Basic routing and layouts
2. Mock auth and role switching
3. Member list and member detail
4. Weekly report creation
5. Rule-based prayer parser
6. Newcomer form
7. Admin dashboard
8. Permission helpers
9. Mock API client
10. Google Apps Script integration
```

The first implementation should use mock data, not real APIs.

---
## Work History Rules

Maintain a `HISTORY.md` file at the project root.

After each meaningful development task, append a short history entry.

Record:

```txt
date
summary
changed files
reason for change
tests or checks run
remaining TODOs
```

The purpose of `HISTORY.md` is to preserve project context across sessions.

Use it to track:

* what was implemented
* why decisions were made
* what changed in docs
* known issues
* next recommended tasks

Do not record sensitive personal data in `HISTORY.md`.

Do not include real church member names, phone numbers, addresses, prayer requests, or private care notes.
