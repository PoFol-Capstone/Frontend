# [구현] 포트폴리오 코치 — 프론트엔드

- 작성일: 2026.10.25
- 브랜치: `feature/portfolio-coach` (main 기준)
- 기획: `docs/plan-2026-10-25-portfolio-coach.md` / 백엔드 짝 문서: `api/docs/impl-2026-10-25-portfolio-coach.md`
- 백엔드 같은 이름의 브랜치가 먼저 배포돼야 동작한다 (새 API·`/api/github/token` 제거).

## 1. 구현 계획과 진행 상태

| 단계 | 범위 (기획 장) | 주요 파일 | 상태 |
| --- | --- | --- | --- |
| S1 | GitHub 탭 대시보드(3.1), 체크리스트(3.2), 분석 상태 폴링, 프로필 사진(3.6) | `profile/_components/GitHubTab`, `RepoChecklist`, `ProfileTabs`, `ProfileEditModal`, `api/upload/avatar` | 완료 |
| S2 | 대표 프로젝트·방향성(3.4), 프로필 README(3.3), AI 라우트 2종, 남은 횟수 표시 | `TopProjects`, `ProfileReadmePanel`, `api/ai/github-direction`, `api/ai/profile-readme`, `lib/aiCoachServer`, `lib/coachContent` | 완료 |
| S3 | 발표자료(3.5): Blob 직접 업로드, 작성·수정 섹션, 뷰어, 슬라이드 변환 | `board/write/_components/DocumentSection`, `board/[id]/_components/DocumentViewer`, `api/upload/document`, `lib/slides` | 완료 |
| S4 | AI 이력서(3.7): 설문 → 초안 → 편집 → PDF 저장 | `app/[locale]/resume/*`, `api/ai/resume`, `lib/resume` | 완료 |
| — | 타인 프로필 GitHub 요약, i18n(ko·en), `repo-info` 토큰 제거 | `PublicGitHubSection`, `messages/*.json`, `api/github/repo-info` | 완료 |

## 2. 화면

- `/profile?tab=github` — 내 GitHub 탭. 미연동이면 연동 카드, 분석 전이면 시작 화면, 분석 중이면 스켈레톤
  (재분석 중에는 이전 결과를 그대로 보여준다), 실패 시 사유와 재연동 버튼.
  요약 카드 → 언어 막대(상위 5 + 기타) → 레포 카드 → 정리할 것 → 대표 프로젝트·방향성 → 프로필 README → 공개 범위.
- `/profile/[id]` — 공개로 켠 항목과 고정한 대표 프로젝트만.
- 게시글 작성(4단계)·수정 — "발표자료" 섹션. 상세 화면 상단에 뷰어.
- `/resume` (프로필 메뉴 → 이력서) — 목록 + 1분 설문. `/resume/[id]` — 편집·사진 표시·PDF 저장.

## 3. AI 라우트 공통 흐름

```
인증(requireVerifiedUser) → 분당 제한(rateLimit) → 입력 검증(lib/aiInput)
→ 백엔드에서 분석 결과 직접 조회 (클라이언트가 보낸 요약을 믿지 않음)
→ POST /api/ai/usage/consume (월 한도, 429면 OpenAI 호출 없이 종료)
→ gpt-4o-mini (JSON 응답) → 결과 정리 → 백엔드에 저장(방향성·README)
```

- 코드 원문은 보내지 않는다. `compactAnalysis`가 레포 메타데이터와 README 앞 300자만 추린다.
- README 장식(뱃지·통계 카드·배너·solved.ac·블로그)은 AI가 아니라 코드로 만든다 — AI가 URL을 지어내지 않도록.
- 이력서의 ✅ 검증 문장은 GitHub 수집값으로 라우트가 직접 만든다. AI가 쓴 문장은 🤖, 사용자가 고친 문장은 ✏️.
  PDF(인쇄)에는 ✅만 남긴다.

## 4. 기획과 다르게 정한 것

| 항목 | 기획 | 구현 | 이유 |
| --- | --- | --- | --- |
| PDF 뷰어 | pdf.js 기반(`react-pdf` 등) | 브라우저 내장 PDF 뷰어(iframe) + 전체화면·새 탭 | 새 의존성 없이 페이지 넘김·확대가 된다. 모바일 일부 브라우저는 첫 페이지만 보일 수 있어 "새 탭에서 열기"를 함께 둠 |
| PDF 첫 페이지 썸네일 제안 | 제안 | 미구현 | 첫 페이지 렌더링에 pdf.js가 필요. 뷰어를 pdf.js로 바꿀 때 함께 |
| 원형 크롭 | 크롭 미리보기 | 원형 미리보기(`object-cover`)만 | 크롭 영역 조절 UI는 범위 대비 비용이 큼 |
| README 미리보기 | 미리보기 | 최소 마크다운 렌더러(`components/MarkdownPreview`) | HTML 문자열을 만들지 않아 초안 속 태그가 실행되지 않는다 |
| GitHub 연동 후 돌아오는 곳 | — | 기존 흐름 그대로 `/board/write` | 백엔드 OAuth 콜백이 돌아갈 경로를 고정하고 있다 (아래 남은 일) |

## 5. 확인한 것

- `npx tsc --noEmit`, `npx eslint` 통과
- `yarn test` 159개 통과 (새 `tests/portfolio-coach.test.ts` 14개 포함)
  - 슬라이드 링크 변환·거절, 언어 묶기, 무시 항목 집계, README 조립 순서, 검증 문장, 입력 검증
  - `github-direction`: 한도 초과 시 OpenAI 미호출 429, 분석 없으면 차감 없이 409, 차감 → 생성 → 저장
  - `repo-info`: `/api/github/token`을 부르지 않고 `repo-files` 사용, 잘못된 레포 이름은 백엔드 미호출
- `next build --webpack` 성공
- **실제 브라우저 확인은 하지 않았다.** 백엔드·DB·Redis·Blob·OpenAI 키가 필요한 화면이라 1월 통합 QA 때 확인 필요.

## 6. 남은 일

- 통합 QA: 실제 계정으로 분석 → 체크리스트 → README 초안 → 이력서 PDF까지 한 번 돌려보기
- GitHub 연동 후 원래 화면(프로필 GitHub 탭)으로 돌아가기 — 백엔드 OAuth state에 돌아갈 경로를 싣는 변경 필요
- PDF 뷰어 pdf.js 전환 + 첫 페이지 썸네일 제안 (필요하면)
- 프로필 README GitHub 직접 커밋 (기획 7장, 2차 검토 항목)
