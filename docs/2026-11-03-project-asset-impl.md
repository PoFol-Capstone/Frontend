# [구현 계획] 프로젝트 자산화 — 프론트엔드

> **11/06 서비스 전환 이후 주의:** S2 이후 일정은 전환 전에 짠 것이다. 우선순위는 [`2026-11-06-pivot-summary.md`](2026-11-06-pivot-summary.md) 11장을 따른다.

- 작성일: 2026.11.03
- 상태: **진행 중** (S0 대기 · S1 구현 완료)
- 브랜치: S0은 `feature/portfolio-coach`, S1부터 `feature/project-asset` (main에서 분기)
- 기획: `docs/2026-10-27-project-asset-plan.md` (2차) · `docs/archive/2026-10-25-portfolio-coach-plan.md` (1차)
- 1차 구현: `docs/archive/2026-10-25-portfolio-coach-impl.md`
- 짝 문서: 백엔드 `api/docs/2026-11-03-project-asset-impl.md`

> **기준 문서 나누기:** 테이블 · API 계약 · 근거 검증 · 질문 선택 규칙은 **백엔드 문서**가 기준이고, 화면 · AI 라우트 · 프롬프트는 **이 문서와 기획 6장**이 기준이다.
> 기획에 있는 내용(배경, 프롬프트 전문, 응답 스키마)은 옮겨 적지 않고 "기획 N장"으로 가리킨다.

---

## 1. 진행 상태

구현하면서 이 표의 "상태" 열과 각 장의 체크박스만 갱신한다.

| 단계 | 기간 | 범위 (기획 장) | 주요 파일 | 상태 |
|---|---|---|---|---|
| S0 | 11/3 ~ 11/5 | 1차 병합 · 배포 · 통합 QA (2장) | — | 진행 |
| S1 | 11/6 ~ 11/15 | 화면 구조 변경(3장), 프로젝트 탭 · 정리 카드 직접 작성(4장, 5.1) | `ProjectsTab`, `ProjectList`, `ProjectCardEditor`, `RepoImportModal`, `lib/projects` | 구현 완료 (브라우저 확인 전) |
| S2 | 11/16 ~ 11/29 | `completeJson` 분리, ① 핵심 기능 · ② 구현 설명, 내 기여 표시 (6.1 ~ 6.4) | `api/ai/project-features`, `api/ai/project-explain`, `ImplementationExplainer`, `ContributionSummary` | 대기 |
| S3 | 11/30 ~ 12/13 | ③ 질문 은행 · 면접 연습, ④ 기술 추천 (6.5, 6.6) | `api/ai/interview-questions`, `api/ai/tech-reco`, `InterviewPractice`, `TechRecommendations` | 대기 |
| S4 | 12/14 ~ 12/27 | 골든셋 평가 · 프롬프트 조정 · 문구 정리 (6.7) | `lib/projectPrompts`, `tests/project-asset.test.ts` | 대기 |
| — | 1월 | 통합 QA · 사용자 테스트 | | 대기 |

S0이 10/27 기획 일정(~11/1)보다 늦어져 S1 시작을 11/6으로 미뤘다. S1 종료일은 그대로 둔다.

---

## 2. S0 — 1차 병합 · 배포 (11/3 ~ 11/5)

### 2.1 10/27 기획과 달라진 점

| 항목 | 10/27 기획 | 지금 (11/3 확인) |
|---|---|---|
| 모집 관리 변경 | 작업 트리에 커밋 안 된 25개 파일 → `feature/recruitment-management`로 분리 | `f658f57`로 `feature/portfolio-coach`에 이미 커밋 · 푸시됨 |
| 처리 방법 | 분리 후 별도 PR | **분리하지 않고 함께 병합** (결정) |
| 원격 | 미푸시 | `origin/feature/portfolio-coach` = `f658f57` (백엔드 = `eb1f6d5`) |

### 2.2 할 일

- [ ] `yarn test`, `npx tsc --noEmit`, `npx eslint`, `next build --webpack` 통과
- [ ] PR `feature/portfolio-coach` → `main`. 본문에 범위 두 개를 나눠 적는다: ① 포트폴리오 코치 1차 ② 모집 관리 개선 (지원자 카드 · 포지션 진행도 · 확인 다이얼로그, `Modal.tsx`를 `components/`로 이동)
- [ ] **백엔드가 먼저 배포**된 것을 확인한 뒤 병합 · 배포 (`/api/github/token` 제거, `/api/github/repo-files` 등 새 API)
- [ ] Vercel 환경변수: `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `THUMBNAIL_PROVIDER`
- [ ] 배포본에서 2.3 통합 QA
- [ ] `main`에서 `feature/project-asset` 분기
- [ ] stash 3개(`stash@{0}` 모집 관리 WIP 외 2개)가 이미 커밋된 내용과 같은지 확인 → 정리 여부는 팀 확인 후

### 2.3 통합 QA 체크리스트 (1차 기능)

- [ ] GitHub 미연동 → 연동 → GitHub 탭 분석 시작 → 결과 · 체크리스트 표시
- [ ] 체크리스트 무시 토글, 다시 분석 (10분 제한 안내)
- [ ] 대표 프로젝트 고정 → 타인 프로필(`/profile/[id]`)에서 공개 항목만 보이는지
- [ ] AI 방향성 · 프로필 README 초안 · 한도 초과(429) 안내
- [ ] 프로필 사진 업로드 · 변경
- [ ] 게시글 발표자료: PDF 업로드 · 뷰어, 구글 슬라이드 링크
- [ ] AI 이력서: 설문 → 초안 → 편집 → PDF 저장, 사진 표시 토글
- [ ] 모집 관리: 지원 → 지원자 카드 → 수락 · 거절 → 포지션 진행도
- [ ] 모바일 폭(375px)에서 GitHub 탭 · 이력서

---

## 3. S1 — 화면 구조 변경 + 정리 카드 (11/6 ~ 11/15)

**의존:** 백엔드 S1 `GET/POST/PATCH/DELETE /api/projects`, `PATCH /api/projects/:uuid/card`. 나오기 전에는 7장 응답 예시로 목업.

### 3.1 화면 구조 (기획 3장)

- [x] 로그인 후 첫 화면 `/board` → `/profile`
  - `app/[locale]/page.tsx`: `redirect({ href: "/profile" })`, 주석 수정
  - `lib/safeRedirect.ts`: `defaultBoardPath` → `defaultHomePath` (경로 `/profile`), `resolvePostLoginPath` 주석 수정
  - 호출부: `app/[locale]/signup/verify/page.tsx`, `tests/auth-flow.test.ts`
- [x] 헤더 메뉴: 피드 · 학교 · 글쓰기 → **내 프로젝트** · 탐방 · 더보기(팀원 모집 · 이력서 · 북마크) — `components/Header.tsx`, `components/ProfileMenu.tsx`. 로고 링크도 로그인 시 `/profile`
- [x] 프로필 탭: 게시물 / GitHub → **프로젝트** / GitHub / 게시물 — `profile/_components/ProfileTabs.tsx`
  - `ProfileTab`에 `"projects"` 추가, `parseProfileTab` 기본값을 `"projects"`로, 게시물 탭 링크는 `?tab=posts`
  - `app/[locale]/profile/page.tsx`에서 탭 분기 추가
- [x] 랜딩 문구: "AI로 만든 프로젝트를, 면접에서 말할 수 있게" — `messages/ko.json`, `en.json`의 `home.*` (미구현인 "코드 리뷰" 문구 제거)

### 3.2 프로젝트 탭 (기획 4장, 5.1)

- [x] `types/project.ts`: `Project`, `ProjectStage`, `ProjectCard`(칸별 `{ value, source }`), `CardSource = "AI" | "SELF" | "VERIFIED"`
- [x] `lib/projects.ts`: 백엔드 프로젝트 API 클라이언트 (`lib/githubAnalysis.ts`와 같은 방식)
- [x] `ProjectsTab.tsx`: 왼쪽 목록 + 오른쪽 상세 레이아웃, 상세 4탭(정리 카드 · 구현 설명 · 면접 연습 · 기술 추천 — S1에서는 정리 카드만 활성, 나머지는 "준비 중")
- [x] `ProjectList.tsx`: 제목 자리 프로젝트 전환 토글(진행도 `filledSlots`/7) + 추가(+) 버튼, 본문은 가운데 정렬
- [x] `RepoImportModal.tsx`: 기존 `GET /api/github/repos` 목록에서 선택 → `POST /api/projects`. 이미 등록한 레포는 비활성
- [x] `ProjectCardEditor.tsx`: 7칸 직접 작성 · 칸별 저장, 5칸은 "문제 → 원인 → 해결 → 결과" 4칸 입력, 출처 배지는 `lib/coachContent.ts` 표기 재사용
- [x] 게시글 연결(선택): 상세에 "게시글 보기" 링크
- [x] `messages/*`: `projects.*` 문구

**완료 기준:** 레포 가져오기 → 7칸 저장 → 진행도 배지 갱신, 모바일 칩 목록, 로그인 직후 `/profile?tab=projects` 진입. `auth-flow.test.ts` 기본 경로 테스트 갱신.

---

## 4. S2 — AI ① ② + 내 기여 (11/16 ~ 11/29)

**의존:** 백엔드 S2 `GET /context`, `GET /contribution`, `PUT/GET /ai/:type`(FEATURES · EXPLANATION), `AiFeature` 2개.

- [ ] `lib/aiCoachServer.ts`: `completeJson(prompt, temperature)` → `completeJson({ system?, user, temperature? })`. 기존 `github-direction` · `profile-readme` · `resume` 라우트는 `system` 없이 같은 동작 (기획 6.1 변경 1)
- [ ] `lib/projectPrompts.ts`: 기획 6.3 · 6.4 system 프롬프트 상수
- [ ] `lib/aiInput.ts`: `parseProjectAiInput` (`projectUuid`만)
- [ ] `types/githubAnalysis.ts`: `AiFeature`에 `project-features`, `project-explain`
- [ ] `app/api/ai/project-features/route.ts` (온도 0.2, 저장 타입 `FEATURES`)
- [ ] `app/api/ai/project-explain/route.ts` (온도 0.2, 저장 타입 `EXPLANATION`)
  - 흐름은 기획 6.1: 인증 → `rateLimit` → 입력 검증 → 컨텍스트 조회 → 사용량 차감 → OpenAI → 백엔드 저장(근거 검증) → **백엔드가 돌려준 결과만** 응답
  - 컨텍스트 없음 → 차감 없이 409, 근거 0개(백엔드 422) → "레포에서 근거를 찾지 못했어요" 안내
- [ ] `ProjectCardEditor`: 1 · 3칸 [AI 초안] 버튼, 수정하면 🤖 → ✏️, 기능마다 근거 경로 칩
- [ ] `ContributionSummary.tsx` (2칸 옆): 내 커밋 수 · 내 영역 칩 · 내 파일 상위 5개, 다른 기여자는 "N명"만. `available = false`면 Git 이메일 연결 안내
- [ ] `ImplementationExplainer.tsx`: 구조 · 요청 흐름 단계 · 주요 파일 5개 · 설계 선택(`isGuess`면 "추정" 배지)
- [ ] 컨텍스트 수집 중이면 스켈레톤 (`GitHubTab` 폴링 패턴)

**완료 기준:** 1 · 3칸 AI 초안, 구현 설명 탭 표시, 근거 경로 표시, 내 커밋 · 영역 표시. 테스트는 9장 참고.

---

## 5. S3 — 면접 연습 · 기술 추천 (11/30 ~ 12/13)

**의존:** 백엔드 S3 `GET /interview/next`, `POST /interview/practice`, `PUT /tech-reco/:code/done`, 컨텍스트의 `frameworkSignals` · `recommendations`.

- [ ] `AiFeature`에 `interview-questions`, `tech-reco` 추가, 프롬프트 6.5 · 6.6 상수
- [ ] `app/api/ai/interview-questions/route.ts` (온도 0.7, `QUESTION_BANK`) — user 메시지에 정리 카드 포함
- [ ] `app/api/ai/tech-reco/route.ts` (온도 0.2, `TECH_RECO`) — 응답 `code`가 컨텍스트 `recommendations`에 없으면 라우트에서 먼저 버림
- [ ] `InterviewPractice.tsx`: 5문제 카드(출제는 백엔드가 고름), 유형 배지(내 코드 · 프레임워크 · 트러블슈팅 · 기술 선택 · 협업 · 확장), 근거(파일 경로 또는 커밋 메시지), 답 입력 · "좋은 답의 요소" 펼치기, 연습 기록 저장, [다음 5문제], `pushedAt`이 바뀌면 [질문 새로 만들기]
- [ ] `TechRecommendations.tsx`: 이유 · 근거 파일 · 첫 단계 · [해봤어요] 체크
- [ ] 단계 배지가 `INTERVIEW_READY`까지 올라가는지 확인

**완료 기준:** 랜덤 5문제 연습(구성 고정) · 유형 배지 · 커밋 근거 표시 · 연습 기록, 추천 · [해봤어요].

---

## 6. S4 — 품질 (12/14 ~ 12/27)

- [ ] 골든셋: Pofol 프론트 · 백엔드 레포 + 팀원 개인 레포 3개로 4종 결과 생성
- [ ] 팀원 3명이 근거 정확성 · 질문 적합성 · 지어낸 내용 여부를 5점으로 평가 → 평가표를 이 문서 부록에 남김
- [ ] 프롬프트 조정 후 다시 평가 (백엔드 `dropped_count` 집계 함께 확인)
- [ ] 면접 답변 피드백(2차) 넣을지 결정
- [ ] 문구(i18n) 정리

**일정이 밀리면:** S3 기술 추천 → S4 답변 피드백 순으로 뺀다. S1 · S2 · 면접 연습만으로 "정리 → 이해 → 설명 연습" 흐름은 완성된다.

---

## 7. API 계약 요약

백엔드 문서 5장 기준. 백엔드 API가 나오기 전에는 이 응답 형태로 목업한다 (`RepoContextResponse`는 백엔드 기획 4.7).

| API | 백엔드 | 프론트 사용처 |
|---|---|---|
| `GET /api/projects` | S1 | `ProjectList` |
| `POST /api/projects` `{ repoFullName, postUuid? }` | S1 | `RepoImportModal` |
| `GET /api/projects/:uuid` | S1 | `ProjectsTab` 상세 |
| `PATCH /api/projects/:uuid/card` `{ slot, value }` | S1 | `ProjectCardEditor` |
| `PATCH /api/projects/:uuid` (게시글 연결 · 순서) | S1 | `ProjectsTab` |
| `DELETE /api/projects/:uuid` | S1 | `ProjectList` |
| `GET /api/projects/:uuid/context` | S2 | AI 라우트 4개 (서버에서만) |
| `GET /api/projects/:uuid/contribution` | S2 | `ContributionSummary`, `InterviewPractice` |
| `PUT /api/projects/:uuid/ai/:type` | S2 | AI 라우트 4개 (저장 · 근거 검증) |
| `GET /api/projects/:uuid/ai/:type` | S2 | `ImplementationExplainer`, `TechRecommendations` |
| `GET /api/projects/:uuid/interview/next?count=5` | S3 | `InterviewPractice` |
| `POST /api/projects/:uuid/interview/practice` | S3 | `InterviewPractice` |
| `PUT /api/projects/:uuid/tech-reco/:code/done` | S3 | `TechRecommendations` |
| `GET /api/ai/usage`, `POST /api/ai/usage/consume` | 기존 + `AiFeature` 4개 | AI 라우트, 남은 횟수 표시 |

타인 프로젝트 접근은 404 (존재 여부를 숨김).

---

## 8. 재사용할 기존 코드

| 코드 | 쓰는 곳 |
|---|---|
| `lib/aiCoachServer.ts` — `consumeAiUsage`, `backendErrorResponse`, `aiErrorResponse`, `asString`, `asStringList`, `AI_MODEL` | AI 라우트 4개 |
| `lib/aiInput.ts`, `lib/rateLimit.ts`, `requireVerifiedUser` | AI 라우트 입력 검증 · 제한 · 인증 |
| `lib/coachContent.ts` — 🤖 ✏️ ✅ 출처 표기 | 정리 카드 출처 배지 |
| `GitHubTab.tsx` 폴링 · `components/Skeleton.tsx` | 컨텍스트 수집 중 상태 |
| `components/MarkdownPreview.tsx` | 구현 설명 · 답변 미리보기 |
| `components/Modal.tsx` | `RepoImportModal` |
| 기존 `GET /api/github/repos` | 레포 가져오기 목록 |
| `tests/portfolio-coach.test.ts` 패턴 | `tests/project-asset.test.ts` |

---

## 9. 검증

**매 스프린트:** `yarn test`, `npx tsc --noEmit`, `npx eslint`, `next build --webpack`

**`tests/project-asset.test.ts`** (S2에 만들고 S3 · S4에 보강)
- 한도 초과 시 OpenAI 미호출 429
- 컨텍스트 없음(수집 전) → 차감 없이 409
- system / user 분리 (user 메시지에 지시 문구가 없는지), 기존 3개 라우트가 `system` 없이 그대로 동작
- tech-reco: 목록에 없는 `code`가 섞이면 버림
- 백엔드 근거 검증으로 항목이 버려진 경우 · 0개(422)인 경우 응답 형태
- `defaultHomePath` · `parseProfileTab` 기본값 (S1, `auth-flow.test.ts`)

**실제 브라우저:** 1차에서 1월로 미뤘던 확인을 스프린트 끝마다 당긴다. 로컬 백엔드 + 프론트로 각 장 "완료 기준" 시나리오를 한 번씩 돌린다.

---

## 10. 결정이 필요한 것

- [x] S0 모집 관리 작업 → 분리하지 않고 1차와 함께 병합 (11/3)
- [ ] 정리 카드 7칸 구성 확정
- [ ] 프로젝트와 게시글 관계 (제안: 선택 연결)
- [ ] AI 기능별 월 한도 (제안: features 10, explain 5, interview-questions 3, tech-reco 5)
- [ ] 면접 답변 피드백 포함 여부 (제안: S4에서 검토)
- [ ] 피드에서 다른 학생 정리 카드 공개 범위 (제안: 1 · 3 · 6칸만, 본인이 켤 때)
- [ ] 질문 은행 구성 비율 (제안: 내 코드 7 · 프레임워크 5 · 트러블슈팅 3 · 기술 선택 2 · 협업 2 · 확장 1)
- [ ] 기여 분석 공개 범위 (제안: 내 기여만, 다른 기여자는 수만)
- [ ] 헤더 "탐방"이 기존 `/board` 피드를 그대로 쓸지, 정리된 프로젝트만 보여줄지

---

## 11. 기획과 다르게 정한 것

구현하면서 채운다.

| 항목 | 기획 | 구현 | 이유 |
|---|---|---|---|
| S1 시작일 | 11/2 | 11/6 | S0(1차 병합)이 늦어짐 |
| 헤더 "더보기" | 별도 더보기 메뉴 (팀원 모집 · 이력서 · 북마크) | 로고 옆에 **내 프로젝트 · 탐방** 링크, 더보기는 기존 프로필 메뉴에 북마크를 추가해 대신함 | 프로필 메뉴가 이미 모집 관리 · 이력서를 담고 있어 메뉴를 하나 더 만들 필요가 없음 |
| 레포 가져오기 | 내 레포 목록에서 선택 | 목록 선택 + `owner/repo` 직접 입력 | 내 레포 목록 API는 내가 소유한 레포만 준다. 팀원 · 조직 소유 팀 프로젝트를 가져오려면 직접 입력이 필요 |
| 상세 탭 | 4탭 | 정리 카드만 활성, 나머지 3개는 "준비 중"으로 비활성 | S2 · S3에서 연다 |
| 출처 배지 | `lib/coachContent.ts` 표기 재사용 | `components/SourceBadge.tsx`로 분리해 이력서 · 정리 카드가 함께 씀 | 이력서 편집기 안에 있던 컴포넌트를 공용으로 |
| 테스트 파일 | S2에 `tests/project-asset.test.ts` 생성 | S1에 만들고 정리 카드 순수 함수(`lib/projectCard.ts`) 테스트부터 | — |
| AI 초안 범위 · 시점 | S2에 1 · 3칸만, 백엔드 `/context` 이후 | **S1에 7칸 초안** (`POST /api/ai/project-card`, 백엔드 임시 `GET /api/github/repo-context` + `PUT /api/projects/:uuid/card/ai-draft`). 근거 없는 칸은 비우고 "직접 작성" 안내, 기술 선택 이유가 레포에 없으면 비교 기술 · 질문만 제시. 빈 칸에만 들어가고 출처 🤖 | 직접 7칸을 쓰기엔 진입 장벽이 큼 (11/4 결정). 커밋은 최근 100개 메시지만 — S2 `/context`가 나오면 교체 |
| 프로필 데이터 조회 | 게시물은 항상 조회 | 탭에 필요한 것만 조회 (게시물은 `?tab=posts`일 때만), 게시물 페이지 링크에 `tab=posts` 유지 | 기본 탭이 프로젝트로 바뀜 |
