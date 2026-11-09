# [구현] 서비스 전환 1~4 — 모집 숨김 · 팀 레포 · 분석 이력 · 새 점검 규칙

> 기준: [종합 11장](2026-11-06-pivot-summary.md) 작업 순서 1~4. 프론트 `feature/ui-foundation`, 백엔드 `feature/project-asset` (둘 다 푸시 전).
> 모든 단계는 프론트 tsc · eslint · 테스트, 백엔드 전체 테스트 · jacoco 커버리지 기준(LINE 80% · BRANCH 60%) 통과 후 커밋.

| # | 작업 | 프론트 커밋 | 백엔드 커밋 |
|---|---|---|---|
| 1 | 팀원 모집 숨김 + 게시판 메인 메뉴 제외 | `ecf77e7`, `47fafc4`(헤더) | — |
| 2 | Organization · 협업 레포 | `a12b4cf` | `82bd018` |
| 3 | 분석 이력 테이블 | `f9fe421` | `d675a57` |
| 4 | 새 점검 규칙 + AI 입력 개선 | `96047dd` | `1403443` |

---

## 1. 팀원 모집 숨김 (1단계)

**방식**: 화면에서만 뺀다. 백엔드 API · 데이터 · 모집 관련 컴포넌트 파일은 그대로 둔다. 코드 삭제는 2단계.

| 위치 | 바뀐 것 |
|---|---|
| 헤더 `components/Header.tsx` | "탐방"(게시판) 메뉴, `＋`(글쓰기) 버튼 삭제. 메뉴는 "내 프로젝트" · "채용 트렌드" |
| 프로필 메뉴 `components/ProfileMenu.tsx` | "모집 관리" 삭제 (북마크 · 설정만) |
| `/recruitment` | 페이지 대신 `/board`로 리다이렉트 |
| 게시판 카테고리 `board/_components/categories.ts` | `["All", "School", "Bookmarks"]` — "모집중" 삭제. 글쓰기 링크는 카테고리 줄 끝으로 이동 |
| 게시글 상세 | 지원 영역(`ApplicationSection`) 미표시 |
| 글쓰기 `board/write` | 1단계의 "팀원 모집" 유형 카드와 모집 섹션 삭제. 임시 저장 복원도 `project`일 때만 단계 복원 |
| 랜딩 `app/[locale]/page.tsx` | "03 팀원 모집" 소개 카드 삭제 |
| i18n | `profileMenu.recruitment`, `header.explore`, `home.recruitment`, `board.categories.recruiting` 삭제 |

**남은 것**: 기존 모집 글 데이터 처리 방식(종합 10장 결정), 2단계 코드 삭제.

## 2. Organization · 협업 레포

예전엔 `affiliation=owner`만 받아서 팀 프로젝트(Organization 레포)가 분석에 빠졌다.

**수집** (`GitHubCollector`)
- 내 레포: 기존 그대로 `/user/repos?affiliation=owner`.
- 팀 레포: `/user/repos?affiliation=collaborator,organization_member`에서 공개 · 포크 아님 · 보관 아님만 추리고, 최근 push 순 최대 **30개**를 `/repos/{r}/commits?author={login}`로 확인 → **내 커밋이 있는 것만, 최대 10개**.
- 소유 구분: `OWNER` / `ORG`(owner.type이 Organization) / `COLLABORATOR`.

**점수 · 통계 반영** (`RepoScorer`)
- 계정 통계(언어 비중 · 스타 등)는 내 레포만.
- 팀 레포의 "꾸준한 커밋" 근거는 팀 전체가 아니라 **내 커밋 수**로 판단. 스타 근거는 내 레포에만.

**응답**: `repos[].ownership`, `repos[].myCommitCount` (내 레포는 `null`).

**화면**
- 레포 카드에 "팀 레포 · 내 커밋 N개" 배지.
- 팀 레포의 점검 항목은 "팀에 제안"으로 표시 — 내가 혼자 고칠 수 없는 레포라서.
- AI 입력 · 이력서 검증 문장도 팀 레포는 "내 커밋 N개"만 쓴다 (`lib/coachContent.ts` `verifiedFacts`).

**레포 선택 목록**(`GitHubService.getRepos`, 글쓰기 · 레포 가져오기)도 내 레포 + 팀 레포를 함께 보여준다.

**확인 안 된 것**: Organization이 서드파티 앱 접근 제한(OAuth App access restrictions)을 켜 두면 목록에 안 나온다. 실제 계정으로 확인 필요.

## 3. 분석 이력 테이블

목적: "지난번보다 N개 해결" 표시 + 재점검 비율 · 해결률 측정 (종합 8.1).

**테이블** `github_analysis_history` (JPA `ddl-auto=update`로 생성, 마이그레이션 파일 없음)

| 컬럼 | 내용 |
|---|---|
| `user_id` | 사용자 |
| `analyzed_at` | 분석 완료 시각 |
| `repo_count` | 분석한 레포 수 |
| `open_checks_json` (jsonb) | `{ 레포 이름 또는 계정: [남은 점검 코드…] }` — 무시한 항목 제외 |
| `open_check_count` | 남은 점검 항목 수 |

인덱스 `(user_id, analyzed_at)`. 분석이 **성공했을 때만** 같은 트랜잭션에서 한 줄 추가 (`GitHubAnalysisRunner`). 회원 탈퇴 시 삭제.

**해결 수 계산** (`CheckProgress.resolved`): 직전 분석에 있던 코드 중 이번에 사라진 것의 개수. 이번 분석에 아예 없는 레포(삭제 · 비공개 전환)는 세지 않는다 — 고친 게 아니라서.

**응답**: `progress: { previousAnalyzedAt, resolvedCount } | null` — 최근 2건 비교. 이력이 1건 이하면 `null`.

**화면**: `resolvedCount > 0`일 때만 "지난 분석(○일 전)보다 N개 해결했어요".

## 4. 새 점검 규칙 + AI 입력 개선

**규칙** (`RepoCheckRule`, 모두 레포 단위)

| 코드 | 조건 | 해결 안내 (`RepoChecklist`) |
|---|---|---|
| `ENV_FILE_COMMITTED` | 루트에 `.env`, `.env.local` 같은 파일. `.env.example` · `.sample` · `.template` · `.dist` · `.defaults`는 제외 | GitHub "민감한 데이터 제거" 문서 링크 |
| `NO_CI` | `.github/workflows`가 비었거나 없고, `.gitlab-ci.yml` · `Jenkinsfile` · `.travis.yml` · `azure-pipelines.yml` · `.circleci`도 없음 | GitHub Actions 빠른 시작 링크 |
| `README_NO_RUN_GUIDE` | README에 설치 · 실행 · 빌드 · usage 같은 제목도, `npm install` · `./gradlew` · `docker compose` 같은 명령도 없음 | README 템플릿 복사 (README 없음과 같은 안내) |

- `README_NO_RUN_GUIDE`는 **README 전체를 받았을 때만** 판단한다 (발췌가 잘린 긴 README는 판단 안 함 — 뒤에 있을 수 있어서).
- 빈 레포는 `.env` 없음, CI는 판단 안 함(`null`).
- 루트 목록 조회는 기존 호출을 재사용. `.github` 폴더가 있을 때만 `workflows` 확인 호출을 한 번 더 한다.

**AI 입력** (`lib/coachContent.ts` `compactAnalysis`)
- README 발췌 300자 → **800자**.
- `readmeHeadings`: README 제목 최대 15개 — 앞부분만 잘라도 구성이 보이게.
- `confirmedIssues`: 무시하지 않은 점검 코드 — AI가 문제를 새로 지어내지 않고 "어떻게 고칠지"만 쓰게.
- `ownership`, `myCommits`: 팀 레포 커밋을 내 것으로 쓰지 않게.

---

## 테스트

| 쪽 | 파일 | 확인하는 것 |
|---|---|---|
| 백엔드 | `GitHubAnalyzerTest` | 새 규칙 3개 (잘린 README 미판단, `.env.example` 제외 등), `isEnvFile` |
| 백엔드 | `CheckProgressTest` | 무시 항목 제외, 사라진 레포 미집계 |
| 백엔드 | `PortfolioCoachTest` | 팀 레포 수집(내 커밋 0개 제외) · 소유 구분, 재분석 시 `progress` |
| 프론트 | `tests/portfolio-coach.test.ts` | 팀 레포 검증 문장, `compactAnalysis`의 새 필드 |

브라우저 확인은 아직 안 했다.
