---

- 최종 수정일: 2026.04.27
- 버전: 9차 수정

## 목차

1. 전체 테이블 목록
2. 테이블 컬럼 명세
3. API 명세
4. 테이블 관계도
5. 부록 — 링크 표현 패턴 / 로그인 케이스

---

## 1. 전체 테이블 목록

| 테이블                 | 설명                                                      |
| ---------------------- | --------------------------------------------------------- |
| `user`                 | 계정 (이메일 / 소셜 통합)                                 |
| `user_profile`         | 프로필 상세 정보                                          |
| `user_link`            | 유저 외부 링크 모음 (LinkTypeDetector로 타입/아이콘 판별) |
| `social_account`       | OAuth 소셜 연동 계정 (유저당 1개)                         |
| `school_list`          | 대학 마스터 (이메일 도메인 목록)                          |
| `school_verification`  | 학교 이메일 OTP 인증 이력                                 |
| `skill_list`           | 기술스택 마스터 (shields.io 뱃지 연동)                    |
| `user_skills`          | 유저 보유 기술스택                                        |
| `post`                 | 포스트 (RECRUIT / DISPLAY 통합)                           |
| `post_skills`          | 포스트에서 사용한 기술스택 연결                           |
| `post_member`          | 포스트 팀원 목록                                          |
| `post_application`     | 포스트 팀원 지원 내역                                     |
| `tag_list`             | 태그 마스터 (포스트 주제 라벨)                            |
| `post_tag`             | 포스트 ↔ 태그 연결                                        |
| `timeline`             | 커리어 타임라인 (AI 자동 생성 지원)                       |
| `timeline_achievement` | 타임라인 세부 성과 항목                                   |
| `bookmark`             | 포스트 북마크                                             |
| `like`                 | 포스트 좋아요                                             |
| `post_views`           | 포스트 조회수                                             |
| `follow`               | 유저 팔로우                                               |
| `notification`         | 알림 (지원 수락 / 거절 등)                                |
| `email_verification`   | 이메일 OTP 인증                                           |
| `refresh_token`        | JWT Refresh Token 관리                                    |

---

## 2. 테이블 컬럼 명세

### user — 계정

| 컬럼              | 타입                       | 설명                                                |
| ----------------- | -------------------------- | --------------------------------------------------- |
| id                | BIGINT PK                  | 내부 PK (자동 증가, FK 조인용)                      |
| uuid              | UUID UK                    | 외부 노출용 식별자 (API URL 등에 사용)              |
| email             | VARCHAR(255) UK            | 로그인 이메일. 소셜 전용 계정은 NULL 가능           |
| password_hash     | TEXT                       | 이메일 로그인용 암호화 비밀번호. 소셜 전용이면 NULL |
| name              | VARCHAR(50)                | 사용자 이름                                         |
| school_id         | BIGINT FK → school_list.id | 인증된 학교 ID (school_verification 완료 후 연결)   |
| is_email_verified | BOOLEAN                    | 이메일 인증 완료 여부                               |
| is_active         | BOOLEAN                    | 계정 활성화 여부 (탈퇴 시 false)                    |
| created_at        | TIMESTAMPTZ                | 계정 생성 시각                                      |
| updated_at        | TIMESTAMPTZ                | 마지막 수정 시각                                    |

### user_profile — 프로필

| 컬럼                | 타입                            | 설명                                     |
| ------------------- | ------------------------------- | ---------------------------------------- | --- |
| id                  | BIGINT PK                       |                                          |
| user_id             | BIGINT FK → user.id, **UNIQUE** | 1:1 관계 보장                            |
| avatar_url          | TEXT                            | 프로필 이미지 URL                        |
| bio                 | TEXT                            | 자기소개 한 줄                           |
| position            | VARCHAR(100)                    | 직군 (예: Backend Developer, Designer)   |
| position_started_at | DATE (NULL 허용)                | 현재 포지션 시작일 (경력 개월 수 계산용) |
| created_at          | TIMESTAMPTZ                     | 생성 시각                                |
| updated_at          | TIMESTAMPTZ                     | 수정 시각                                |     |

> 기존의 `github_url`, `blog_url`, `portfolio_url`은 제거. → `user_link`로 분리.

### user_link — 외부 링크 (신규)

| 컬럼        | 타입                | 설명                                                   |
| ----------- | ------------------- | ------------------------------------------------------ |
| id          | BIGINT PK           |                                                        |
| user_id     | BIGINT FK → user.id |                                                        |
| url         | TEXT                | 외부 링크 URL (GitHub 프로필 / 블로그 / 포트폴리오 등) |
| order_index | INT                 | 표시 순서                                              |
| created_at  | TIMESTAMPTZ         | 등록 시각                                              |

- 유니크: `UNIQUE(user_id, url)` — 동일 유저가 같은 URL을 중복 등록 방지
- 타입/아이콘은 DB에 저장하지 않음. 서버에서 `LinkTypeDetector.detect(url)`로 판별 후 `{ url, type, iconSlug }`로 응답.
- 프론트는 `https://cdn.simpleicons.org/{iconSlug}`로 아이콘 렌더링.

### social_account — 소셜 연동 (수정)

| 컬럼         | 타입                            | 설명                                                             |
| ------------ | ------------------------------- | ---------------------------------------------------------------- |
| id           | BIGINT PK                       |                                                                  |
| user_id      | BIGINT FK → user.id, **UNIQUE** | 유저당 소셜 계정 1개                                             |
| provider     | VARCHAR(30)                     | OAuth 공급자 (`GITHUB` / `GOOGLE` / `KAKAO` 등, 대문자 저장)     |
| provider_uid | VARCHAR(255)                    | 공급자가 발급한 사용자 고유 ID                                   |
| access_token | TEXT                            | OAuth 액세스 토큰 (GitHub API 호출 등에 사용)                    |
| scope        | TEXT                            | 부여된 OAuth scope 목록 (예: `read:user,user:email,public_repo`) |
| created_at   | TIMESTAMPTZ                     | 연동 시각                                                        |
| updated_at   | TIMESTAMPTZ                     | scope 업그레이드 / 토큰 재발급 시각                              |

- 정책: 유저당 소셜 계정 **1개**만 보유 가능 (멀티 OAuth 동시 연동 불가).
- "이메일 가입 + GitHub OAuth 연동"은 가능 — 이메일 로그인 유저가 GitHub 기능(레포 조회 등)을 쓰려고 추가 연동하는 케이스.
- 레포 조회 가능 여부는 `scope`에 `public_repo` 포함 여부로 판정.
- `user_link`(단순 링크 표시)와는 역할이 완전히 다름. `social_account`는 access_token/scope를 가진 실제 OAuth 연결.

### school_list — 대학 마스터

| 컬럼         | 타입         | 설명                                          |
| ------------ | ------------ | --------------------------------------------- |
| id           | BIGINT PK    |                                               |
| name         | VARCHAR(100) | 학교명 (예: 한국대학교)                       |
| email_domain | VARCHAR(100) | 인증에 사용할 이메일 도메인 (예: korea.ac.kr) |
| created_at   | TIMESTAMPTZ  | 등록 시각                                     |

### school_verification — 학교 이메일 인증

| 컬럼           | 타입                       | 설명                             |
| -------------- | -------------------------- | -------------------------------- |
| id             | BIGINT PK                  |                                  |
| user_id        | BIGINT FK → user.id        |                                  |
| school_list_id | BIGINT FK → school_list.id |                                  |
| school_email   | VARCHAR(255)               | 사용자가 입력한 학교 이메일 주소 |
| school_grade   | SMALLINT                   | 학년 (선택 입력, 1~6)            |
| otp_code       | VARCHAR(10)                | 발송된 OTP 코드                  |
| verified       | BOOLEAN                    | 인증 완료 여부                   |
| expires_at     | TIMESTAMPTZ                | OTP 만료 시각                    |
| verified_at    | TIMESTAMPTZ                | 실제 인증 완료 시각              |
| created_at     | TIMESTAMPTZ                | OTP 발송 시각                    |

### skill_list — 기술스택 마스터

| 컬럼        | 타입         | 설명                                        |
| ----------- | ------------ | ------------------------------------------- |
| id          | BIGINT PK    |                                             |
| name        | VARCHAR(100) | 기술명 (예: React, TypeScript)              |
| icon_slug   | VARCHAR(100) | Simple Icons 슬러그 (예: react, typescript) |
| badge_color | VARCHAR(7)   | shields.io 뱃지 색상 HEX (예: #61DAFB)      |
| created_at  | TIMESTAMPTZ  | 등록 시각                                   |

> 클라이언트에서 URL 조합: `https://img.shields.io/badge/{name}-{badge_color}?logo={icon_slug}`

### user_skills — 유저 기술스택

| 컬럼          | 타입                      | 설명 |
| ------------- | ------------------------- | ---- |
| id            | BIGINT PK                 |      |
| user_id       | BIGINT FK → user.id       |      |
| skill_list_id | BIGINT FK → skill_list.id |      |

- 유니크: `UNIQUE(user_id, skill_list_id)`

### post — 포스트

| 컬럼             | 타입                | 설명                             |
| ---------------- | ------------------- | -------------------------------- |
| id               | BIGINT PK           | 내부 PK                          |
| uuid             | UUID UK             | 외부 노출용 식별자               |
| user_id          | BIGINT FK → user.id | 작성자                           |
| type             | VARCHAR(20)         | `RECRUIT` / `DISPLAY`            |
| title            | VARCHAR(200)        | 제목                             |
| content          | TEXT                | 본문 (마크다운)                  |
| thumbnail_url    | TEXT                | 썸네일 이미지 URL                |
| repo_url         | TEXT                | GitHub 저장소 URL (project 전용) |
| deploy_url       | TEXT                | 배포 주소 URL (project 전용)     |
| is_recruiting    | BOOLEAN             | 팀원 모집 여부 (project 전용)    |
| recruit_position | TEXT                | 모집 포지션 설명                 |
| recruit_note     | TEXT                | 지원자에게 전달할 안내 메시지    |
| view_count       | INT                 | 조회수 (post_views와 동기화)     |
| like_count       | INT                 | 좋아요 수 (like와 동기화)        |
| is_published     | BOOLEAN             | 공개 여부 (false = 임시저장)     |
| created_at       | TIMESTAMPTZ         | 작성 시각                        |
| updated_at       | TIMESTAMPTZ         | 수정 시각                        |

> `type`에 따른 활성 필드: `repo_url` / `deploy_url` / `is_recruiting` / `recruit_position` / `recruit_note` 는 project일 때만 사용.

### post_skills — 포스트 기술스택

| 컬럼          | 타입                      | 설명 |
| ------------- | ------------------------- | ---- |
| id            | BIGINT PK                 |      |
| post_id       | BIGINT FK → post.id       |      |
| skill_list_id | BIGINT FK → skill_list.id |      |

- 유니크: `UNIQUE(post_id, skill_list_id)`

### post_member — 포스트 팀원

| 컬럼      | 타입                | 설명                           |
| --------- | ------------------- | ------------------------------ |
| id        | BIGINT PK           |                                |
| post_id   | BIGINT FK → post.id |                                |
| user_id   | BIGINT FK → user.id | 팀원                           |
| role      | VARCHAR(100)        | 팀 내 역할 (예: 백엔드 개발자) |
| joined_at | TIMESTAMPTZ         | 팀 합류 시각                   |

### post_application — 팀원 지원

| 컬럼       | 타입                | 설명                                |
| ---------- | ------------------- | ----------------------------------- |
| id         | BIGINT PK           |                                     |
| post_id    | BIGINT FK → post.id | 지원 대상                           |
| user_id    | BIGINT FK → user.id | 지원자                              |
| position   | VARCHAR(100)        | 지원하는 포지션                     |
| message    | TEXT                | 지원 메시지                         |
| status     | VARCHAR(20)         | `pending` / `accepted` / `rejected` |
| created_at | TIMESTAMPTZ         | 지원 시각                           |
| updated_at | TIMESTAMPTZ         | 상태 변경 시각                      |

### tag_list — 태그 마스터

| 컬럼       | 타입        | 설명                                     |
| ---------- | ----------- | ---------------------------------------- |
| id         | BIGINT PK   |                                          |
| name       | VARCHAR(50) | 태그 이름 (예: #일기장, #사이드프로젝트) |
| created_at | TIMESTAMPTZ | 최초 사용 시각                           |

> 포스트 저장 시 없는 태그는 자동 생성(Upsert). SKILL과 구분: TAG는 포스트 주제 라벨, SKILL은 기술스택 마스터 데이터.

### post_tag — 포스트 ↔ 태그

| 컬럼    | 타입                    | 설명 |
| ------- | ----------------------- | ---- |
| id      | BIGINT PK               |      |
| post_id | BIGINT FK → post.id     |      |
| tag_id  | BIGINT FK → tag_list.id |      |

### timeline — 커리어 타임라인

| 컬럼                | 타입                            | 설명                                  |
| ------------------- | ------------------------------- | ------------------------------------- |
| id                  | BIGINT PK                       |                                       |
| user_id             | BIGINT FK → user.id             |                                       |
| post_id             | BIGINT FK → post.id (NULL 허용) | 생성 기반 포스트 (수동 생성이면 NULL) |
| title               | VARCHAR(200)                    | 타임라인 카드 제목                    |
| planning_intent     | TEXT                            | 기획 의도 (AI 생성 입력 소스)         |
| service_description | TEXT                            | 서비스 설명 (AI 생성 입력 소스)       |
| start_date          | DATE                            | 프로젝트 시작일                       |
| end_date            | DATE                            | 프로젝트 종료일                       |
| is_ai_generated     | BOOLEAN                         | AI 자동 생성 여부                     |
| ai_generated_at     | TIMESTAMPTZ                     | AI 생성 시각                          |
| order_index         | INT                             | 타임라인 카드 표시 순서               |
| created_at          | TIMESTAMPTZ                     | 생성 시각                             |
| updated_at          | TIMESTAMPTZ                     | 수정 시각                             |

### timeline_achievement — 타임라인 세부 성과

| 컬럼        | 타입                    | 설명                  |
| ----------- | ----------------------- | --------------------- |
| id          | BIGINT PK               |                       |
| timeline_id | BIGINT FK → timeline.id |                       |
| content     | TEXT                    | 세부 성과 / 역할 항목 |
| order_index | INT                     | 항목 표시 순서        |
| created_at  | TIMESTAMPTZ             | 생성 시각             |

### bookmark — 북마크

| 컬럼       | 타입                | 설명        |
| ---------- | ------------------- | ----------- |
| id         | BIGINT PK           |             |
| user_id    | BIGINT FK → user.id |             |
| post_id    | BIGINT FK → post.id |             |
| created_at | TIMESTAMPTZ         | 북마크 시각 |

### like — 좋아요

| 컬럼       | 타입                | 설명        |
| ---------- | ------------------- | ----------- |
| id         | BIGINT PK           |             |
| user_id    | BIGINT FK → user.id |             |
| post_id    | BIGINT FK → post.id |             |
| created_at | TIMESTAMPTZ         | 좋아요 시각 |

### post_views — 조회수

| 컬럼       | 타입                | 설명                                        |
| ---------- | ------------------- | ------------------------------------------- |
| id         | BIGINT PK           |                                             |
| post_id    | BIGINT FK → post.id | 조회된 포스트                               |
| viewer_id  | BIGINT              | 비로그인이면 NULL (FK 미설정 — 단순 식별용) |
| ip_address | INET                | 조회한 IP 주소 (중복 방지용)                |
| viewed_at  | TIMESTAMPTZ         | 조회 시각                                   |

> 동일 viewer_id(또는 ip) + post_id 조합이 1시간 내 재조회 시 INSERT 생략하여 어뷰징 방지.

### follow — 팔로우

| 컬럼        | 타입                | 설명             |
| ----------- | ------------------- | ---------------- |
| id          | BIGINT PK           |                  |
| follower_id | BIGINT FK → user.id | 팔로우 하는 사람 |
| followee_id | BIGINT FK → user.id | 팔로우 받는 사람 |
| created_at  | TIMESTAMPTZ         | 팔로우 시각      |

### notification — 알림

| 컬럼           | 타입                            | 설명                                               |
| -------------- | ------------------------------- | -------------------------------------------------- |
| id             | BIGINT PK                       |                                                    |
| user_id        | BIGINT FK → user.id             | 알림 수신자                                        |
| type           | VARCHAR(50)                     | `application_accepted` / `application_rejected` 등 |
| post_id        | BIGINT FK → post.id             | 관련 포스트                                        |
| application_id | BIGINT FK → post_application.id | 관련 지원                                          |
| message        | TEXT                            | 알림 메시지 본문                                   |
| is_read        | BOOLEAN                         | 읽음 여부                                          |
| created_at     | TIMESTAMPTZ                     | 알림 생성 시각                                     |

> WebSocket 미사용. 클라이언트에서 30~60초 간격 폴링으로 읽지 않은 알림 수 확인. 탭 비활성 시 폴링 중단.

### email_verification — 이메일 OTP

| 컬럼       | 타입         | 설명                     |
| ---------- | ------------ | ------------------------ |
| id         | BIGINT PK    |                          |
| email      | VARCHAR(255) | OTP를 발송한 이메일 주소 |
| otp_code   | VARCHAR(10)  | 발송된 인증 코드         |
| verified   | BOOLEAN      | 인증 완료 여부           |
| expires_at | TIMESTAMPTZ  | OTP 만료 시각            |
| created_at | TIMESTAMPTZ  | OTP 발송 시각            |

### refresh_token — Refresh Token

| 컬럼       | 타입                | 설명                         |
| ---------- | ------------------- | ---------------------------- |
| id         | BIGINT PK           |                              |
| user_id    | BIGINT FK → user.id |                              |
| token_hash | TEXT                | 토큰 해시값 (원본 저장 금지) |
| expires_at | TIMESTAMPTZ         | 토큰 만료 시각               |
| created_at | TIMESTAMPTZ         | 발급 시각                    |

---

## 3. API 명세

### 인증 (Auth)

| 메서드 | 경로                      | 설명                                                                                     | 주요 처리 테이블                 |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| POST   | /api/auth/email/send-otp  | 이메일 OTP 발송                                                                          | email_verification               |
| POST   | /api/auth/email/verify    | OTP 인증 확인                                                                            | email_verification               |
| POST   | /api/auth/register        | 회원가입                                                                                 | user, user_profile               |
| POST   | /api/auth/login           | 이메일 로그인                                                                            | user, refresh_token              |
| POST   | /api/auth/logout          | 로그아웃 (토큰 폐기)                                                                     | refresh_token                    |
| POST   | /api/auth/token/refresh   | Access Token 재발급                                                                      | refresh_token                    |
| GET    | /api/auth/github          | GitHub OAuth 시작 (로그인/회원가입, state 없음)                                          | —                                |
| GET    | /api/auth/github/connect  | GitHub 연동 시작 (JWT 필수, state를 Redis에 저장 후 GitHub 인증 페이지로 302 리다이렉트) | —                                |
| GET    | /api/auth/github/callback | GitHub OAuth 콜백 — state 있으면 연동 플로우, 없으면 로그인 플로우                       | user, social_account             |
| GET    | /api/auth/github/status   | GitHub 연동 여부 조회 (JWT 필수)                                                         | social_account                   |
| POST   | /api/auth/school/send-otp | 학교 이메일 OTP 발송                                                                     | school_verification, school_list |
| POST   | /api/auth/school/verify   | 학교 이메일 OTP 인증                                                                     | school_verification, user        |

### 유저 (User)

| 메서드 | 경로                         | 설명                           | 주요 처리 테이블                           |
| ------ | ---------------------------- | ------------------------------ | ------------------------------------------ |
| GET    | /api/user/:uuid              | 유저 프로필 조회               | user, user_profile, user_link, user_skills |
| PATCH  | /api/user/me/profile         | 내 프로필 수정                 | user_profile                               |
| GET    | /api/user/:uuid/post         | 유저 포스트 목록               | post                                       |
| GET    | /api/user/:uuid/timeline     | 유저 타임라인 목록             | timeline, timeline_achievement             |
| POST   | /api/user/me/skills          | 내 기술스택 추가               | user_skills                                |
| DELETE | /api/user/me/skills/:skillId | 내 기술스택 제거               | user_skills                                |
| POST   | /api/user/me/links           | 내 외부 링크 추가              | user_link                                  |
| PATCH  | /api/user/me/links/:id       | 내 외부 링크 수정 (URL / 순서) | user_link                                  |
| DELETE | /api/user/me/links/:id       | 내 외부 링크 제거              | user_link                                  |
| POST   | /api/user/:uuid/follow       | 팔로우                         | follow                                     |
| DELETE | /api/user/:uuid/follow       | 언팔로우                       | follow                                     |
| GET    | /api/user/:uuid/followers    | 팔로워 목록                    | follow, user                               |
| GET    | /api/user/:uuid/following    | 팔로잉 목록                    | follow, user                               |

### 포스트 (Post)

| 메서드 | 경로                     | 설명                                       | 주요 처리 테이블                        |
| ------ | ------------------------ | ------------------------------------------ | --------------------------------------- |
| GET    | /api/post                | 포스트 목록 (필터: type, tag, skill)       | post, post_tag, post_skills             |
| POST   | /api/post                | 포스트 작성                                | post, post_skills, post_tag             |
| GET    | /api/post/:uuid          | 포스트 상세 조회                           | post, post_skills, post_tag, post_views |
| PATCH  | /api/post/:uuid          | 포스트 수정                                | post, post_skills, post_tag             |
| DELETE | /api/post/:uuid          | 포스트 삭제                                | post                                    |
| POST   | /api/post/:uuid/like     | 좋아요 토글                                | like, post                              |
| POST   | /api/post/:uuid/bookmark | 북마크 토글                                | bookmark                                |
| GET    | /api/post/bookmarked     | 내 북마크 목록                             | bookmark, post                          |
| GET    | /api/post/:uuid/related  | 관련 포스트 조회 (기술/카테고리 태그 기반) | post, post_skills, post_tag             |

### 팀원 모집 (Application)

| 메서드 | 경로                             | 설명                           | 주요 처리 테이블                            |
| ------ | -------------------------------- | ------------------------------ | ------------------------------------------- |
| POST   | /api/post/:uuid/applications     | 팀원 지원                      | post_application                            |
| GET    | /api/post/:uuid/applications     | 지원자 목록 조회 (작성자 전용) | post_application, user, user_profile        |
| PATCH  | /api/post/:uuid/applications/:id | 지원 수락 / 거절               | post_application, post_member, notification |
| GET    | /api/user/me/applications        | 내 지원 내역 목록              | post_application, post                      |

### 타임라인 (Timeline)

| 메서드 | 경로                              | 설명                  | 주요 처리 테이블               |
| ------ | --------------------------------- | --------------------- | ------------------------------ |
| GET    | /api/users/:uuid/timeline         | 타임라인 목록         | timeline, timeline_achievement |
| POST   | /api/timeline                     | 타임라인 수동 생성    | timeline, timeline_achievement |
| POST   | /api/post/:uuid/timeline/generate | AI 타임라인 자동 생성 | timeline, timeline_achievement |
| PATCH  | /api/timeline/:id                 | 타임라인 수정         | timeline, timeline_achievement |
| DELETE | /api/timeline/:id                 | 타임라인 삭제         | timeline                       |

### 알림 (Notification)

| 메서드 | 경로                       | 설명                       | 주요 처리 테이블 |
| ------ | -------------------------- | -------------------------- | ---------------- |
| GET    | /api/notification          | 내 알림 목록 (최신 20개)   | notification     |
| GET    | /api/notification/count    | 읽지 않은 알림 수 (폴링용) | notification     |
| PATCH  | /api/notification/:id/read | 알림 읽음 처리             | notification     |
| PATCH  | /api/notification/read-all | 전체 알림 읽음 처리        | notification     |

### 기술스택 / 태그 (Skill / Tag)

| 메서드 | 경로                      | 설명               | 주요 처리 테이블 |
| ------ | ------------------------- | ------------------ | ---------------- |
| GET    | /api/skill_list           | 기술스택 전체 목록 | skill_list       |
| GET    | /api/skill_list/search?q= | 기술스택 검색      | skill_list       |
| GET    | /api/tag_list             | 태그 전체 목록     | tag_list         |
| GET    | /api/tag_list/search?q=   | 태그 검색          | tag_list         |

---

## 4. 테이블 관계도

```
user
 ├── user_profile           (1:1)
 ├── user_link              (1:N)
 ├── social_account         (0..1)         ← 유저당 소셜 계정 1개 (없을 수도 있음)
 ├── school_verification    (1:N) → school_list
 ├── user_skills            (N:M) → skill_list
 ├── post                   (1:N)
 │    ├── post_skills       (N:M) → skill_list
 │    ├── post_member       (1:N) → user
 │    ├── post_application  (1:N) → user  (지원자)
 │    ├── post_tag          (N:M) → tag_list
 │    ├── like              (N:M) → user
 │    ├── bookmark          (N:M) → user
 │    ├── post_views        (1:N)
 │    └── related_post      (1:N, 동적 조회)
 │         ├── via post_skills (기술 태그 일치)
 │         └── via post_tag    (카테고리 태그 일치)
 ├── timeline               (1:N) → post  (post_id FK, NULL 허용)
 │    └── timeline_achievement  (1:N)
 ├── notification           (1:N)
 ├── follow                 (N:M) → user
 ├── refresh_token          (1:N)

email_verification          (독립)         ← email로만 매칭, user FK 없음
school_list                 (마스터)
skill_list                  (마스터)
tag_list                    (마스터)
```

### Mermaid ERD (로그인 도메인)

```mermaid
erDiagram
    user ||--|| user_profile : has
    user ||--o{ user_link : owns
    user |o--o| social_account : "0..1 (선택)"
    user ||--o{ refresh_token : issues
    user }o--|| school_list : "school_id"
    user ||--o{ school_verification : verifies
    school_verification }o--|| school_list : "school_list_id"

    user {
        BIGINT id PK
        UUID uuid UK
        VARCHAR email UK
        TEXT password_hash
        VARCHAR name
        BIGINT school_id FK
        BOOLEAN is_email_verified
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    user_profile {
        BIGINT id PK
        BIGINT user_id FK_UK
        TEXT avatar_url
        TEXT bio
        VARCHAR position
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    user_link {
        BIGINT id PK
        BIGINT user_id FK
        TEXT url
        INT order_index
        TIMESTAMPTZ created_at
    }
    social_account {
        BIGINT id PK
        BIGINT user_id FK_UK
        VARCHAR provider
        VARCHAR provider_uid
        TEXT access_token
        TEXT scope
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    refresh_token {
        BIGINT id PK
        BIGINT user_id FK
        TEXT token_hash
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
    }
    email_verification {
        BIGINT id PK
        VARCHAR email
        VARCHAR otp_code
        BOOLEAN verified
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
    }
    school_list {
        BIGINT id PK
        VARCHAR name
        VARCHAR email_domain
        TIMESTAMPTZ created_at
    }
    school_verification {
        BIGINT id PK
        BIGINT user_id FK
        BIGINT school_list_id FK
        VARCHAR school_email
        SMALLINT school_grade
        VARCHAR otp_code
        BOOLEAN verified
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ verified_at
        TIMESTAMPTZ created_at
    }
```

---

## 5. 부록

### 5.1. 링크 표현 패턴

```
DB: url만 저장
  ↓
서버 응답 시 LinkTypeDetector.detect(url) 호출
  ↓
{ url, type, iconSlug } 형태로 반환
  ↓
프론트: iconSlug로 Simple Icons 렌더링
  https://cdn.simpleicons.org/{iconSlug}
```

`user_link`는 단순 노출용 외부 링크를 담고, OAuth 연결(access_token/scope를 가진)은 `social_account`가 담당. 두 테이블은 역할이 분리됨.

### 5.2. 로그인 / GitHub 연동 케이스

### 케이스 1 — 일반 이메일 로그인

| 테이블         | 상태                       |
| -------------- | -------------------------- |
| user           | ✅ (email + password_hash) |
| user_profile   | ✅                         |
| social_account | ❌                         |

### 케이스 2 — GitHub 소셜 로그인

| 테이블         | 상태                                             |
| -------------- | ------------------------------------------------ |
| user           | ✅ (email은 GitHub에서 받음, password_hash NULL) |
| user_profile   | ✅                                               |
| social_account | ✅ (scope = `read:user, user:email`)             |

> 이 상태에선 `public_repo` scope가 없어 레포 목록 조회 불가.

### 케이스 3 — GitHub 연동 버튼 클릭 (로그인된 유저)

**플로우:**

1. 로그인된 유저가 `GET /api/auth/github/connect` 호출 (JWT 필수)
2. 서버가 UUID state를 생성 → Redis에 `OAUTH_CONNECT_STATE:{state} = userId` (TTL 5분) 저장
3. GitHub 인증 페이지로 302 리다이렉트 (scope: `read:user,user:email,public_repo`, state 포함)
4. 유저가 GitHub 승인 → `/api/auth/github/callback?code=...&state=...` 호출
5. 서버가 Redis에서 state로 userId 조회 후 즉시 삭제 (일회성)
6. code → access_token 교환 → SocialAccount 생성 또는 갱신
7. 프론트엔드 `/board/write?github_connected=true`로 302 리다이렉트

**케이스별 처리:**

- 해당 GitHub 계정이 **이미 다른 유저에 연동**된 경우 → `?github_error=already_linked` 리다이렉트
- 케이스 1 유저 → `social_account`에 새 행 INSERT (`public_repo` scope 포함)
- 케이스 2 유저 → 기존 행 UPDATE (access_token, scope 갱신)

| 상태                    | user | user_profile | social_account                | 레포 조회 |
| ----------------------- | ---- | ------------ | ----------------------------- | --------- |
| 일반 가입 직후          | ✅   | ✅           | ❌                            | ❌        |
| GitHub 소셜 로그인 직후 | ✅   | ✅           | ✅ (`public_repo` scope 포함) | ✅        |
| 연동 버튼 클릭 후       | ✅   | ✅           | ✅ (`public_repo` scope 포함) | ✅        |

> 로그인과 연동 모두 scope `read:user,user:email,public_repo`를 요청하므로 어느 케이스든 연동 후 레포 조회 가능.  
> 레포 조회 가능 여부는 `social_account.scope`에 `public_repo`가 있냐 없냐로 판정.
