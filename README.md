# PoFol

**대학생 개발자를 위한 협업 포트폴리오 플랫폼**

코드 리뷰, 팀원 모집, 프로젝트 관리를 한 곳에서 진행하고, 완료된 프로젝트가 자동으로 나만의 포트폴리오로 정리되는 서비스입니다.
캡스톤 디자인 프로젝트의 프론트엔드 레포지토리이며, Next.js 16(App Router) 기반으로 구현했습니다.

---

## 목차

- [소개](#소개)
- [핵심 기능](#핵심-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [폴더 구조](#폴더-구조)
- [시작하기](#시작하기)
- [환경 변수](#환경-변수)
- [문서](#문서)

---

## 소개

PoFol은 대학생 개발자들이 사이드 프로젝트를 시작하고, 팀원을 구하고, 결과물을 포트폴리오로 남기는 과정을 하나의 플랫폼에서 해결하는 것을 목표로 합니다.

- 프로젝트를 게시물로 공유하고 댓글로 피드백을 주고받습니다.
- 기술 스택과 모집 포지션을 기준으로 팀원을 모집하고 지원자를 관리합니다.
- GitHub 저장소 정보를 불러와 AI로 프로젝트 소개와 썸네일을 자동 생성합니다.
- 완료된 프로젝트는 유저 프로필에 쌓여 포트폴리오 역할을 합니다.

프론트엔드는 별도의 백엔드 API 서버와 통신하며, `next.config.ts`의 rewrites를 통해 `/api/*` 요청을 백엔드로 프록시합니다. GitHub README 요약, 썸네일 생성처럼 프론트에서 직접 처리하는 것이 유리한 기능은 Next.js Route Handler로 자체 구현했습니다.

## 핵심 기능

### 프로젝트 보드 & 댓글
- 프로젝트(전시/모집) 게시물 목록, 상세, 작성/수정 페이지 제공 ([app/board](app/board))
- 대댓글(1단계), 좋아요, 삭제 처리를 지원하는 댓글 시스템 ([CommentSection.tsx](app/board/[id]/_components/CommentSection.tsx))
- 카테고리 필터, 관련 게시물 추천, 북마크

### 팀원 모집 & 지원 워크플로우
- 포지션(프론트/백엔드/디자이너)별 모집 인원 설정, 지원서 제출/수정/취소 ([app/recruitment](app/recruitment))
- 작성자 전용 지원자 목록 조회 및 수락/거절 처리
- 지원 상태(`PENDING`/`ACCEPTED`/`REJECTED`)에 따른 UI 분기

### AI 기반 프로젝트 소개 자동화
- GitHub 저장소를 연동해 README와 package.json을 분석, 기술 스택을 자동 추출 ([lib/github.ts](lib/github.ts))
- OpenAI(`gpt-4o-mini`)로 프로젝트 설명·주요 기능을 한국어로 요약 ([app/api/ai/summarize](app/api/ai/summarize/route.ts))
- 프로젝트 정보를 기반으로 파스텔톤 SVG 썸네일을 생성해 Vercel Blob에 업로드 ([app/api/ai/thumbnail](app/api/ai/thumbnail/route.ts))

### 계정 & 프로필
- 이메일 OTP 기반 회원가입/로그인, GitHub 소셜 계정 연동
- JWT Access/Refresh Token을 httpOnly 쿠키로 관리하고, axios 인터셉터로 401 발생 시 자동 재발급 ([lib/http.ts](lib/http.ts))
- 프로필 페이지에서 자기소개, 기술 스택, 외부 링크, 작성한 프로젝트, 팔로워/팔로잉 확인

## 기술 스택

| 구분 | 스택 |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript 5 (strict) |
| UI | React 19, Tailwind CSS 4 |
| 상태 관리 | Zustand, TanStack Query |
| 통신 | Axios (Server/Client 분리 인터셉터) |
| AI | OpenAI API (`gpt-4o-mini`) |
| 스토리지 | Vercel Blob |
| 외부 연동 | GitHub API/OAuth |
| 배포 | Vercel |

## 아키텍처

```
Browser
  │
  ▼
Next.js (App Router)
  ├─ Server Components ─ 인증 세션 확인 후 백엔드 API 직접 호출 (lib/http.server.ts)
  ├─ Client Components ─ axios 인터셉터로 access_token 첨부 + 401 시 자동 refresh (lib/http.ts)
  └─ Route Handlers (app/api/*)
       ├─ /api/ai/summarize   → OpenAI로 프로젝트 설명 생성
       ├─ /api/ai/thumbnail   → 파스텔 SVG 썸네일 생성 → Vercel Blob 업로드
       ├─ /api/github/*       → GitHub 저장소 목록/정보 조회
       └─ /api/auth/github/*  → GitHub OAuth 연동 프록시
              │
              ▼
      백엔드 API 서버 (NEXT_PUBLIC_API_URL, rewrites로 프록시)
```

인증/게시물/지원/댓글 등 핵심 도메인 로직은 별도의 백엔드 서버가 담당하고, 프론트엔드는 UI 렌더링과 AI·GitHub 연동처럼 프론트에서 처리하는 편이 자연스러운 기능을 함께 구현합니다.

## 폴더 구조

```
pofol/
├─ app/
│  ├─ board/           # 프로젝트 게시물 목록/상세/작성
│  ├─ recruitment/      # 팀원 모집 관리 (내 모집글, 지원자 관리)
│  ├─ profile/          # 유저 프로필, 포트폴리오
│  ├─ bookmark/         # 북마크한 게시물
│  ├─ search/           # 통합 검색
│  ├─ login, signup/    # 이메일 OTP 인증 기반 로그인/회원가입
│  └─ api/              # AI 요약·썸네일, GitHub 연동 Route Handler
├─ components/          # 공통 UI (헤더, 알림, 프로필 메뉴 등)
├─ hooks/                # 커스텀 훅 (알림 등)
├─ lib/                  # API 클라이언트, 인증, GitHub 파싱 등 도메인 로직
├─ types/                # 공용 타입 정의
├─ docs/                 # API 명세, DB 스키마 문서
└─ proxy.ts              # Next.js 16 미들웨어 진입점
```

## 시작하기

```bash
# 의존성 설치
yarn install

# 개발 서버 실행 (Turbopack 미들웨어 이슈로 --webpack 사용)
yarn dev

# 프로덕션 빌드
yarn build
yarn start
```

- 개발환경 세팅: VSCode 플러그인으로 **Prettier - Code formatter**를 사용합니다.

## 환경 변수

`.env.local`에 아래 값을 설정합니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | 백엔드 API 베이스 URL |
| `OPENAI_API_KEY` | 프로젝트 설명 자동 요약(AI)용 OpenAI API 키 |
| `BLOB_READ_WRITE_TOKEN` | AI 생성 썸네일 업로드용 Vercel Blob 토큰 |
| `GITHUB_TOKEN` | GitHub 저장소 정보 조회용 토큰 |

## 문서

- [docs/db.md](docs/db.md) — 전체 테이블 명세 및 관계도
- [docs/apply.md](docs/apply.md) — 팀원 모집/지원 API 명세
- [docs/comments.md](docs/comments.md) — 댓글/대댓글 API 명세
