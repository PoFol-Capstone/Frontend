# [구현] 프로젝트 AI 심층 — 정리 카드 v2 · 구현 설명 · 면접 연습 · 기술 추천

- 작성일: 2026.11.12
- 상태: **구현 완료** (브라우저 통합 QA 전)
- 기획: [`2026-11-10-project-ai-depth-plan.md`](2026-11-10-project-ai-depth-plan.md) (P1~P5) · [`2026-11-03-project-asset-impl.md`](2026-11-03-project-asset-impl.md) S2 · S3
- 백엔드 짝 변경: `api/` GitHubService · ProjectService (아래 2 · 3장)

프로젝트 상세의 4탭(정리 카드 · 구현 설명 · 면접 연습 · 기술 추천)을 모두 열었다.
핵심은 **AI가 레포의 실제 코드를 읽게 만든 것** — 규칙 기반으로 핵심 파일 10개를 고르고(AI 아님),
fix 커밋의 diff를 담아, 카드 · 설명 · 질문이 파일 · 커밋을 구체적으로 인용한다.

---

## 1. 구현 범위 (기획 P1~P5 대응)

| 기획 | 구현 | 비고 |
|---|---|---|
| P1 컨텍스트 확장 | ✅ `GET /api/github/repo-context`에 `pushedAt` · `keyFiles` · `myFiles` · `fixCandidates` · 커밋 `sha` 추가, Redis 캐시 | 새 엔드포인트 대신 기존 확장 |
| P1 비밀값 가림 | ✅ `SecretMasker` — 경로 제외 + 내용 치환, 캐시 전 적용 | 신뢰 경계 |
| P2 카드 v2 | ✅ 프롬프트 재작성(keyFiles · patch 인용), `myRoleLead`는 코드가 작성, results는 facts 자동 호출, hints 저장 | |
| P3 구현 설명 | ✅ `api/ai/project-explain` + `ImplementationExplainer` | |
| P4 면접 연습 | ✅ `api/ai/interview-questions` + `InterviewPractice` + 연습 기록(10개 → INTERVIEW_READY) | 채점 없음 |
| P5 기술 추천 | ✅ `lib/techReco.ts` + `TechRecommendations` — **AI 호출 없음**, simple-icons 아이콘 | AI 제거는 11/11 결정 |
| 추가 | ✅ 피드백 프롬프트 추출(복사) — 카드 · 설명 · 면접 답변을 GPT · Claude에 붙여넣는 용도 | 11/11 요청 |
| 추가 | ✅ 면접 주제 자동 수집 `scripts/collect-interview-themes.ts` (출처 기록) | 8장 |

## 2. 백엔드 — 컨텍스트 확장 (P1)

`GitHubService.getRepoContext` (`api/.../github/service/GitHubService.java`):

- **캐시**: Redis `repo-context:{userId}:{repo}:{pushedAt}`, TTL 7일. pushedAt이 같으면 GitHub 호출은 `/repos` 1회로 끝.
  사용자별 키인 이유 — `myLogin` · `myFiles`가 사용자마다 다르다.
- **keyFiles** (≤10 × 3,000자): `KeyFileSelector` 경로 점수 — 화면·라우트(5) > API·서비스(4) > 상태·훅(3) = 진입점(3) > components(2) > lib·src(1),
  내가 고친 폴더 +3. 테스트 · 설정 · 생성물 · 비밀값 경로 제외.
- **myFiles** (≤10 폴더): `/commits?author={login}&per_page=30` → 커밋별 상세 → 폴더(앞 2단계) 집계.
  머지 커밋 · 30파일 이상 커밋 · lock/빌드/이미지/docs 제외. 이메일 미연결이면 빈 목록 → 화면 안내.
- **fixCandidates** (≤3): fix류 메시지 후보 ≤10개 상세 → 변경 10~400줄만 → patch 앞 2,000자.
- **SecretMasker**: `.env*`·`*.pem`·`*.key`·`secrets` 경로는 keyFiles 후보 제외.
  내용의 `sk-…`·`AKIA…`·`gh*_…`·PEM 블록·JWT·`password=…` → `[가림]`. keyFiles · patch 모두.
- 호출 상한이 레포 크기와 무관하게 고정 (최초 ~55회) — 대상이 학생 · 주니어 레포라 동기 수집 유지.

## 3. 백엔드 — assets 저장

새 테이블 없이 `project.assets_json` jsonb 컬럼 하나 (ddl-auto=update로 자동 생성):

```json
{ "hints":    { "skipped": {}, "techCompare": [], "retroQuestions": [], "problemCommit": "sha" },
  "explain":  { "pushedAt": "", "data": { "structure": [], "flows": [], "keyFiles": [], "designChoices": [] } },
  "interview":{ "pushedAt": "", "questions": [{ "id", "type", "question", "evidence", "theme", "goodAnswerPoints", "answer", "practicedAt" }], "themeSources": [] },
  "techReco": { "generatedAt": "", "role", "source", "items": [{ "id", "name", "icon", "reason", "firstStep", "done" }] } }
```

| API | 동작 |
|---|---|
| `PUT /api/projects/{uuid}/assets/{type}` | type ∈ hints·explain·interview·techReco, 객체 · ≤100KB만. 내용 검증은 프론트 AI 라우트가 끝냄 |
| `PATCH /{uuid}/assets/interview/practice` `{questionId, answer}` | 답 저장(≤3,000자) + practicedAt. 연습 10개 → `INTERVIEW_READY` |
| `PATCH /{uuid}/assets/tech-reco/done` `{id, done}` | [해봤어요] 체크 |
| `GET /api/projects/{uuid}` | 응답에 `assets` 포함 — 탭별 GET 불필요 |
| `PUT /{uuid}/card/ai-draft` | `hints` 선택 필드 추가 (skipped · techCompare가 새로고침에도 남음 — 기존 버그 해결) |

`AiFeature` 추가 (프론트 `types/githubAnalysis.ts` + 백엔드 양쪽): `project-explain` 5/월 · `interview-questions` 3/월.
tech-reco는 AI를 안 쓰므로 **추가하지 않음**.

## 4. AI 라우트와 검증 (근거 화이트리스트)

| 출력 | 검증 (모두 Next 라우트의 순수 함수, 테스트 있음) |
|---|---|
| 카드 features evidence | 경로 ∈ tree (기존 유지) |
| 카드 problemSolving.commit | sha ∈ fixCandidates — 아니면 링크만 버림 (`toAiDraft`) |
| explain 흐름 · 파일 · 근거 경로 | ∈ tree, 흐름은 2단계 미만이면 삭제, 근거 없는 설계 선택은 "추정" 강등 (`toExplainData`) |
| interview evidence | paths ⊂ tree, commit ∈ 내 커밋 ∪ fix 후보 — 위반 질문 삭제, 5개 미만이면 422 (`toInterviewBank`) |
| techReco | AI가 없으므로 검증 대상 없음 — 후보 자체를 코드가 만든다 |
| 수치 (내 역할 · 결과) | AI 금지 — `myRoleLead`(코드)가 첫 문장, results는 facts가 채움 |

**재생성 게이트 (AI 호출 절감)**: explain · interview 라우트는 저장된 `pushedAt` == 현재 레포 `pushedAt`이면
OpenAI를 부르지 않고 사용량도 차감하지 않고 `{ project, unchanged: true }`를 돌려준다.

## 5. 기술 추천 (P5) — AI 없음

- `추천 = 직군 우대 기술 − 레포 감지 기술`, 최대 5개 (`lib/techReco.ts buildTechReco`).
- 직군: GitHub 분석의 `direction.targetRole` 라벨 → `resolveRole` 정규식 → `Role`. 없으면 전체 기준.
- 우대 기술: `data/trends/jobs/*.json` 최신 스냅샷. **아직 없으므로 `FALLBACK_PREFERRED`(직군별 사전)** —
  스냅샷이 수집되면 자동 전환 (`source: "jobs-2026-12"` vs `"fallback"`).
- 감지: `detectedTech` — package.json 의존성(사전 `npm`) + 설정 파일 · 언어 별칭. CI · Docker는 presence로 보충.
- "첫 단계" 문장: `TECH_FIRST_STEP` 큐레이션 텍스트 (AI가 쓰던 역할 대체). [해봤어요]는 재계산에도 유지.
- **아이콘**: `TECH`에 simple-icons slug 57개 추가, `https://cdn.simpleicons.org/{slug}` + `<Image unoptimized>`,
  onError · slug 없음 → 이니셜 뱃지 폴백. next.config 변경 없음.

## 6. 면접 연습 (P4)

- 15문제 1회 생성(레포 변경 시에만 재생성), 유형 비율 myCode 6 · framework 4 · troubleshooting 2 · techChoice 2 · expansion 1.
- 질문마다 근거 칩(파일 → GitHub blob 링크, 커밋 → commit 링크) + 주제 태그.
- 답 입력 → 연습 기록 저장 → "좋은 답의 요소" 펼쳐 비교. **채점하지 않음.**
- 5문제씩, 안 한 질문 우선(`practiceOrder`). 연습 10개면 단계 배지가 "면접 준비 완료".

## 7. 피드백 프롬프트 추출

`lib/feedbackPrompt.ts` — 카드 / 구현 설명 / 면접 답변을 "면접관 관점에서 피드백해 줘" 마크다운으로 조립,
각 탭 상단의 복사 버튼(`FeedbackPromptButton`)으로 클립보드 복사. 서버 · AI 호출 없음, 레포 코드는 포함하지 않음.

## 8. 면접 주제 자동 수집 — 출처 표기

- `scripts/collect-interview-themes.ts`: 공개 면접 질문 모음 레포의 **마크다운 문서 제목만** 발췌(질문 전문 아님) →
  `findTech`로 기술별 분류 → `data/trends/interview/YYYY-MM.json`. `collect-trends.yml` 월간 워크플로에 포함 (실패해도 다른 수집은 진행).
- **출처 (2026-11 첫 수집, 데이터에도 레포 · 라이선스 · 수집일 기록):**

| 레포 | 라이선스 | 수집 |
|---|---|---|
| [gyoogle/tech-interview-for-developer](https://github.com/gyoogle/tech-interview-for-developer) | MIT | 주제 52건 |
| [WeareSoft/tech-interview](https://github.com/WeareSoft/tech-interview) | (명시 없음) | 0건 — 주제가 README 섹션이라 파일 제목 방식으로 안 잡힘 |
| [JaeYeopHan/Interview_Question_for_Beginner](https://github.com/JaeYeopHan/Interview_Question_for_Beginner) | MIT | 0건 — 같은 이유 |

- 발췌 범위: 문서 **제목(주제)** 수준만. 면접 탭 하단에 출처 레포 링크 표시 (`themeSources`).
- 스냅샷이 없으면 `DEFAULT_THEMES` 소량 폴백 — 주제 없이도 질문 생성은 코드 근거만으로 동작.
- 채용 사이트 면접 후기 크롤링은 약관 · 안정성 문제로 제외. 공고 자격요건 키워드 가중치 연결 지점은
  `lib/interviewThemes.server.ts themesFor` 주석에 남김.

## 9. 기획과 다르게 정한 것

| 항목 | 기획 | 구현 | 이유 |
|---|---|---|---|
| 저장 구조 | `ProjectAiResult` 등 테이블 3개 | `assets_json` 컬럼 1개 | 1인 구현, 행 단위 조회 불필요. 연습 통계가 필요해지면 분리 |
| 근거 검증 위치 | 백엔드 `EvidenceValidator` + dropped_count | Next 라우트 순수 함수 | `toAiDraft` 선례. 본인 화면만 오염 가능한 위협 모델 |
| 수집 방식 | 비동기 COLLECTING 폴링 | pushedAt Redis 캐시 뒤 동기 (최초 15~30초) | 단순. 타임아웃 나오면 비동기 전환 |
| tech-reco AI | 후보별 첫 단계 1~2문장 AI | 큐레이션 텍스트 (`TECH_FIRST_STEP`) | AI 호출 절감 (11/11 결정) — AiFeature도 안 만듦 |
| 재생성 게이트 | 버튼 노출 조건 | **서버가 pushedAt 비교** 후 미호출 · 미차감 | 클라이언트가 현재 pushedAt을 모름 — 서버 게이트가 더 확실 |
| 면접 주제 | (기획에 없음 → 11/11 추가 요청) | 공개 레포 자동 수집 + 출처 기록 + 폴백 | 후기 크롤링은 약관 리스크로 제외 |
| `contribution_json` | myFiles 저장 | 비워 둠 (Redis 캐시로 충분) | 모든 소비자가 생성 시점에만 읽음 |
| myRole 칸 | AI가 불릿만 | 코드가 `myRoleLead` 첫 문장 + AI 불릿 이어붙임 | 수치는 AI 금지 원칙 |

이번 범위 밖: 골든셋 기준선(기획 7장 0번), `public_repo` → 읽기 전용 scope 축소, `ContributionSummary` 컴포넌트, "다른 커밋으로 다시 쓰기" 칩.

## 10. 검증

- 백엔드: `./gradlew test` — `SecretMaskerTest` · `KeyFileSelectorTest` · `ProjectApiTest`(심층 수집 + 캐시) · `ProjectAssetsTest`(저장 · 연습 · 단계 전이 · 타인 404) 통과
- 프론트: `yarn test`(`project-asset` · `project-ai-tabs` 추가) · `npx tsc --noEmit` · `npx eslint` · `next build --webpack`
- 브라우저 통합 QA (로컬 백엔드 + 프론트, 남음):
  1. 레포 가져오기 → AI 초안 → 2 · 3 · 5칸이 파일 · 커밋 인용, 새로고침 후 hints 유지, 문제 해결 칸 커밋 링크
  2. 구현 설명 생성 → 경로 전부 실재, 같은 pushedAt 재생성 시 "기존 설명 유지" 안내
  3. 면접 5문제 · 근거 링크 · 주제 태그 · 답 저장 → 10개 연습 후 배지 INTERVIEW_READY
  4. 기술 추천 — 아이콘 표시 · [해봤어요] · 출처 문구 "공고 데이터 수집 전"
  5. 피드백 프롬프트 복사 → GPT에 붙여넣기
  6. 월 한도 초과 429 안내, 비공개 키 가림(테스트용 레포에 가짜 키 커밋)
