# [인계] AI · LLM 활용 방안과 프롬프트 설계

- 작성일: 2026.11.06
- 기준 문서: `docs/2026-11-06-pivot-plan.md` (특히 8장 원칙, 9장 필수 기능)
- 이 문서의 역할: 다음 세션이 처음부터 다시 조사하지 않도록, **정할 것 · 이미 정해진 것 · 볼 파일**을 정리한다.
- **전체 판단 요약:** `docs/2026-11-06-pivot-summary.md` (먼저 읽기)
- **함께 볼 검토 문서:** `docs/2026-11-06-pivot-review-ai-data.md` — 분석 데이터 활용, 재점검 지표, 지표 갱신, 프롬프트 추천안, Organization 레포 원인. 다음 세션은 이 문서 6장 "결정할 것"부터 확정하면 된다.

---

## 1. 다음 세션에서 정할 것

### 1.1 AI · LLM 활용 방안

| 질문 | 메모 |
| --- | --- |
| 규칙과 LLM의 경계를 어디에 둘까 | 원칙: 판정 가능한 건 규칙(✅), LLM은 정리 · 문장화 · 제안(🤖)만. 필수 기능 3개 각각에 대해 표로 확정 |
| ① 레포 분석에 LLM을 쓰나 | 기본은 안 씀. 예외 후보: 프레임워크 감지가 애매할 때, README 내용 요약 |
| ② 피드백에서 LLM이 하는 일 | 규칙 결과 + 레포 메타데이터 → 레포별 "보완 제안" 문장. 범위(몇 개, 어떤 종류)와 금지 사항 |
| ③ 트렌드 분석에서 LLM이 하는 일 | 수치는 코드가 넣고, LLM은 "내 스택 vs 지표" 비교 요약 문장만. 수치를 만들거나 바꾸지 못하게 |
| 입력 데이터 범위 | 지금은 메타데이터 + README 앞 300자 (`compactAnalysis`). 피드백 품질을 위해 파일 트리 · 핵심 파일 일부까지 넓힐지, 비용과 함께 판단 |
| 모델 | 지금 `gpt-4o-mini` 고정 (`lib/aiCoachServer.ts`의 `AI_MODEL`). 기능별로 다른 모델을 쓸지, 상위 모델 비교 테스트를 할지 |
| 호출 횟수 · 비용 | 월 한도는 백엔드 `/api/ai/usage/consume`가 집계. 기능별 한도 값 미정 (10/25 기획서 7장) |
| 캐시 | 같은 분석 결과로 다시 호출하지 않기 — 무엇을 키로 할지 (분석 시각? 입력 해시?) |

### 1.2 프롬프트 설계

| 항목 | 정할 내용 |
| --- | --- |
| 역할 · 톤 | **방향 정함: "분석 AI"** — 관찰 → 근거 → 제안 구조의 리포트 톤, 감정 · 점수 · 단정 금지. 상세는 `docs/2026-11-06-pivot-review-ai-data.md` 4.1 |
| 근거 인용 | **추천안: 사실 ID 방식** — 코드가 만든 사실 목록(F1…)에 AI가 ID만 달고, 화면은 코드가 만든 원문을 보여줌. 같은 문서 4.2 |
| 할루시네이션 방지 | **추천안: 4겹** (입력 제한, 구조 강제, 생성 후 코드 검증, 고정 평가 세트). 같은 문서 4.3 |
| 출력 스키마 | **추천안: Structured Outputs (`json_schema`, strict)** + 피드백 스키마 초안. 같은 문서 4.4. 지금 라우트들은 `json_object` + 손 정리 |
| 프롬프트 인젝션 | 지시는 `system`, 레포 데이터는 `user`에만 (`completeJson`의 3번째 인자). **현재 `project-card`만 이렇게 되어 있고 `github-direction` · `profile-readme` · `resume`은 지시와 데이터가 한 user 메시지에 섞여 있다** → 통일 대상 |
| 언어 | 한국어 기본, en 로케일일 때 영어 — 지금 라우트별 처리 방식 확인 필요 |
| 평가 방법 | 프롬프트를 바꿨을 때 좋아졌는지 어떻게 볼지. 실제 레포 5~10개 고정 세트 + 체크 기준(근거 없는 주장 수, 입력에 없는 기술명 수, 제안의 구체성) |

### 1.3 결정 후 산출물

- [ ] `docs/plan-2026-11-xx-llm-prompt.md` — 기능별 규칙/LLM 경계표, 입력 · 출력 스키마, 프롬프트 원문, 평가 세트
- [ ] 필요하면 백엔드 짝 문서 (입력 데이터 범위가 바뀌는 경우)

---

## 2. 이미 정해진 것 (다시 논의하지 않음)

- AI는 **보조**다. 점수를 노출하지 않는다. 사실(✅)과 AI 제안(🤖)을 화면에서 구분한다. (기준 문서 8장)
- 필수 기능은 ① 레포 분석 ② 피드백 ③ 트렌드 분석. (기준 문서 9장)
- 코드 원문 전체는 보내지 않는다. (10/25 기획서 4장)
- 분석 데이터는 클라이언트 값을 믿지 않고 라우트가 백엔드에서 직접 읽는다. 호출 전에 월 사용량을 차감한다. (`lib/aiCoachServer.ts`)
- README 장식 URL · 이력서 ✅ 문장은 AI가 아니라 코드가 만든다. (impl 10/25 3장) — 같은 원칙을 트렌드 수치에도 적용

---

## 3. 참고할 파일

### 3.1 프론트 (`pofol/`)

| 파일 | 볼 이유 |
| --- | --- |
| `lib/aiCoachServer.ts` | 모델 상수, `completeJson`(system/user 분리), 사용량 차감, 출력 정리 헬퍼 |
| `app/api/ai/project-card/route.ts` | **system 프롬프트를 제대로 분리한 유일한 예** (`SYSTEM` 상수, temperature 0.2). 새 프롬프트의 기준 형태 |
| `app/api/ai/github-direction/route.ts` | 방향성 분석 — ② 피드백 · ③ 트렌드 요약과 가장 가까운 기존 프롬프트 |
| `app/api/ai/profile-readme/route.ts` | README 초안 — 장식은 코드가 만드는 구조 |
| `app/api/ai/resume/route.ts` | 이력서 — ✅/🤖 검증 문장 분리 방식 |
| `app/api/ai/summarize/route.ts` | 최초 레포 요약 기능 (커뮤니티 시절 핵심 기능) |
| `lib/aiInput.ts` | AI 입력 검증 파서 |
| `lib/coachContent.ts`, `lib/projectCard.ts`, `lib/resume.ts` | AI 출력 후처리 · 조립 |
| `lib/github.ts` | 의존성 파일로 기술 스택 감지 — ③ 트렌드 분석의 프레임워크 입력 |
| `lib/githubAnalysis.ts`, `types/githubAnalysis.ts` | 분석 결과 타입 = LLM 입력 데이터의 모양 |
| `tests/portfolio-coach.test.ts`, `tests/project-asset.test.ts` | AI 라우트 테스트 방식 (OpenAI 모킹, 429/409 처리) |

### 3.2 백엔드 (`api/`)

| 파일 | 볼 이유 |
| --- | --- |
| `src/main/java/com/pofol/api/domain/github/model/RepoCheckRule.java` | **규칙 피드백(✅)의 현재 목록** — LLM 경계를 정할 때 출발점 |
| `.../github/model/GitHubAnalyzer.java`, `RepoScorer.java` | 분석 · 대표 프로젝트 점수 계산 |
| `.../github/model/AnalysisSnapshot.java`, `dto/response/GitHubAnalysisResponse.java` | 분석 결과 구조 |
| `.../github/service/GitHubService.java` (`CONTENT_FILES`) | 의존성 파일 수집 목록 |
| `.../github/dto/RepoContextResponse.java` | 프로젝트 정리 카드용 레포 컨텍스트 (입력 범위 확대 시 참고) |
| `docs/archive/2026-10-25-portfolio-coach-plan.md`, `docs/2026-10-27-project-asset-plan.md` | 데이터 모델 · API 명세 |

### 3.3 문서 (`pofol/docs/`)

| 문서 | 볼 부분 |
| --- | --- |
| `2026-11-06-pivot-plan.md` | 8장(원칙), 9장(필수 기능), 9.3(트렌드 지표와 출처) |
| `archive/2026-10-25-portfolio-coach-plan.md` | 4장(AI 호출 구조), 7장(결정 필요 항목) |
| `archive/2026-10-25-portfolio-coach-impl.md` | 3장(AI 라우트 공통 흐름) |
| `2026-10-27-project-asset-plan.md`, `2026-11-03-project-asset-impl.md` | 프로젝트 정리 카드 · 면접 질문 프롬프트 (가장 최근 AI 작업) |

### 3.4 외부 자료

| 자료 | 용도 |
| --- | --- |
| LLM-as-a-Judge for Software Engineering (https://arxiv.org/pdf/2510.24367) | LLM 판정이 어디까지 믿을 만한지 — 규칙/LLM 경계 근거 |
| ProjDevBench (https://arxiv.org/pdf/2602.01655) | 규칙 확인형 판정은 사람과 잘 맞음(κ 0.71) — "판정은 규칙, 문장은 LLM" 근거 |
| OpenAI Structured Outputs 문서 | `json_object` → `json_schema`(스키마 강제)로 바꿀지 검토 |
| Stack Overflow 2025 AI (https://survey.stackoverflow.co/2025/ai) | "거의 맞지만 틀린 답" 66% — 톤 · 근거 표시 설계의 근거 |

---

## 4. 다음 세션 시작할 때 이렇게 요청하면 된다

> `docs/2026-11-06-handoff-llm-prompt.md` 읽고, 1장 순서대로 AI 활용 방안부터 논의하자.
> 먼저 `RepoCheckRule.java`와 `app/api/ai/*` 프롬프트를 읽고 현재 상태를 표로 정리해줘.
