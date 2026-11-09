# docs 목차

파일 이름은 `날짜-주제-종류.md`라서 이름순 = 시간순이다. 끝난 작업 기록은 `archive/`에 있다.
백엔드 짝 문서는 `api/docs/`에 같은 이름 규칙으로 있다 (목차: `api/docs/README.md`).

## 지금 기준 문서 (먼저 읽을 순서)

| 문서 | 내용 | 상태 |
|---|---|---|
| [2026-11-06-pivot-summary.md](2026-11-06-pivot-summary.md) | **[종합]** 서비스 전환 — 모든 판단 · 미결 사항 · 작업 순서 | 최신 기준 |
| [2026-11-06-pivot-plan.md](2026-11-06-pivot-plan.md) | [기획] 전환 기획서 본문 — 배경, 타겟, 경쟁 · 수요, 출처 | 기준 |
| [2026-11-06-pivot-review-ai-data.md](2026-11-06-pivot-review-ai-data.md) | [검토] 분석 데이터 활용 · 재점검 지표 · 프롬프트 · Organization 레포 | 결정 대기 |
| [2026-11-06-pivot-review-community.md](2026-11-06-pivot-review-community.md) | [검토] 팀원 모집 삭제 · 게시판 역할 · 기회 피드 | 결정 대기 |
| [2026-11-06-handoff-llm-prompt.md](2026-11-06-handoff-llm-prompt.md) | [인계] LLM 활용 · 프롬프트 설계 다음 세션용 | 다음 작업 |
| [2026-11-06-header-cleanup.md](2026-11-06-header-cleanup.md) | [구현] 헤더 정리 — 학교 링크 · 드롭다운 프로필/이력서 삭제 | 구현, 커밋 전 |
| [2026-11-03-project-asset-impl.md](2026-11-03-project-asset-impl.md) | [구현 계획] 프로젝트 자산화 S0~S4 | S1 완료, S2~ 우선순위 재조정 필요 |
| [2026-10-27-project-asset-plan.md](2026-10-27-project-asset-plan.md) | [기획] 프로젝트 자산화 — 프롬프트 원문 · 응답 스키마 기준 | 참고 |

> 같은 날 오전에 쓴 `../../pofol-plan-v3.md`(저장소 밖)는 오후의 종합 문서로 일부 뒤집혔다. 둘이 다르면 **종합 문서**가 맞다.

## archive — 끝난 작업

| 문서 | 내용 |
|---|---|
| [2026-07-16-code-review.md](archive/2026-07-16-code-review.md) | [리뷰] 전체 코드 리뷰 |
| [2026-07-22-fix-board-ssr-crash.md](archive/2026-07-22-fix-board-ssr-crash.md) | [수정] 게시글 상세 SSR 크래시 · 좋아요/북마크 |
| [2026-09-01-fix-code-review-remainder.md](archive/2026-09-01-fix-code-review-remainder.md) | [수정] 코드 리뷰 잔여 항목 |
| [2026-09-09-thumbnail-provider.md](archive/2026-09-09-thumbnail-provider.md) | [기능] 썸네일 Provider (SVG ↔ OpenAI) |
| [2026-10-25-portfolio-coach-plan.md](archive/2026-10-25-portfolio-coach-plan.md) | [기획] 포트폴리오 코치 (1차) — AI 한도 · 데이터 원칙은 아직 여기를 참조 |
| [2026-10-25-portfolio-coach-impl.md](archive/2026-10-25-portfolio-coach-impl.md) | [구현] 포트폴리오 코치 S1~S4 완료 |

`brand/` — 로고 원본과 아이콘 생성 기록.

---

## 남은 작업 (2026-11-09 코드 기준 확인)

### 0. 마무리 (먼저)

- [x] 작업 트리 커밋 — 헤더 정리 + 게시판 UI 변경 (11/09)
- [ ] `feature/portfolio-coach` → `main` PR · 배포 — **main은 아직 10/25 커밋(`9dd1bb2`)에 멈춰 있음**. 백엔드 먼저 배포 ([impl S0 2.2](2026-11-03-project-asset-impl.md))
- [ ] 1차 기능 통합 QA ([impl S0 2.3](2026-11-03-project-asset-impl.md)) + S1 프로젝트 탭 브라우저 확인

### 1. 서비스 전환 작업 순서 ([종합 11장](2026-11-06-pivot-summary.md))

| # | 작업 | 지금 상태 |
|---|---|---|
| 1 | 팀원 모집 숨김 + 게시판 메인 메뉴 제외 | **완료 (11/09, 1단계 숨김)** — 모집 관리 메뉴 · 모집중 카테고리 · 글쓰기 모집 유형 · 지원 영역 · 랜딩 소개 제거, `/recruitment`→`/board`, 헤더 "탐방" · `＋` 제거(글쓰기는 게시판 안). 2단계 코드 삭제는 남음 |
| 2 | Organization 레포 수정 (백엔드) | **완료 (11/09)** — 팀 레포는 내 커밋 있는 것만 최대 10개, 소유 구분 · 내 커밋 수 표시. 실제 Organization 계정 확인은 남음 |
| 3 | 분석 이력 테이블 (재점검 비율 측정용) | **완료 (11/09)** — `github_analysis_history`, 화면에 "지난 분석보다 N개 해결" |
| 4 | 새 점검 규칙(`.env` 커밋, README 실행 방법, CI) + AI 입력 개선 | **완료 (11/09)** — `ENV_FILE_COMMITTED` · `NO_CI` · `README_NO_RUN_GUIDE`, AI 입력에 점검 항목 · README 제목 목록 |
| 5 | 프롬프트 재설계 — 사실 ID, `json_schema` strict, 생성 후 검증 | 미착수 — `completeJson`은 `json_object`, `system` 분리는 `project-card`만 |
| 6 | 기회 피드 MVP (수동 JSON 20~50건 + 스택 매칭) | 미착수 |
| 7 | 공개 포트폴리오 링크 다듬기 (`/profile/[id]`) | 미착수 |
| 8 | 트렌드 JSON + 화면 (+ 헤더 "채용 트렌드" 메뉴) | 미착수 |
| — | 1월: 통합 QA, 사용자 테스트, 재점검 비율 첫 측정 | |

### 2. 프로젝트 자산화 S2~S4 (전환 전 계획 — 할지 다시 정하기)

- S2: AI 핵심 기능 · 구현 설명, 내 기여 표시 (`project-features`, `project-explain` 라우트 없음)
- S3: 면접 연습 · 기술 추천
- S4: 골든셋 평가 · 프롬프트 조정 — 전환 작업 5번(프롬프트 재설계)과 겹침

### 3. 결정할 것

- [종합 10장](2026-11-06-pivot-summary.md) 9개 — 모집 삭제 방식, 기존 모집 데이터, 규칙 우선순위, 이력 테이블, 팀 레포 개수, 기회 피드 범위, 공공 API 신청, AI 무료 횟수, 수요 검증
- [impl 10장](2026-11-03-project-asset-impl.md) — 정리 카드 7칸, AI 기능별 월 한도 등
- [인계 1장](2026-11-06-handoff-llm-prompt.md) — 규칙/LLM 경계, 입력 범위, 모델, 캐시 → 결과물 `plan-…-llm-prompt.md`
