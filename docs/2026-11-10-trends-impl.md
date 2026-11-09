# [구현] 채용 트렌드 — 자동 수집 · 확인 후 반영 · 화면

> 기준: [종합 6.3 · 8.2장](2026-11-06-pivot-summary.md), 작업 순서 8번. 커밋 `db4b88a` (`feature/ui-foundation`, 푸시 전).
> 관리자 화면은 만들지 않았다. **PR이 곧 확인 절차**다 — 머지 = 승인, 닫기 = 거절.

## 1. 흐름

```
매달 2일 09:00 (KST) — GitHub Actions "Collect trends"
  → scripts/collect-trends.ts : 지난달 지표를 GitHub 검색 API로 수집
  → data/trends/github/YYYY-MM.json 작성
  → 브랜치 trends/YYYY-MM 에 커밋 · PR 생성 (본문 = 요약)
  → 디스코드로 요약 + PR 링크 알림 (실패하면 실패 알림)
사람이 PR 확인
  → 머지 → Vercel 배포 → /trends 반영
  → 이상하면 PR 닫기 (화면엔 아무것도 안 바뀜)
```

화면은 **머지된 JSON만** 읽는다. 사람이 확인하지 않은 수치는 화면에 나갈 수 없다.

## 2. 수집하는 지표

| 지표 | 검색어 (언어별) | 의미 |
|---|---|---|
| 전 세계 신규 레포 | `language:"X" created:지난달1일..말일` (저장소 검색) | 지난달 새로 만든 공개 레포 수. 포크는 검색 기본값으로 제외 |
| 국내 개발자 주 언어 | `language:"X" location:Korea` (사용자 검색) | 프로필 위치에 "Korea"가 있는 사용자 중 주 언어가 X인 사람 수 (누적) |

- 언어 12개: JavaScript, TypeScript, Python, Java, Kotlin, Go, Rust, C++, C#, Swift, Dart, PHP (`lib/trends.ts` `TREND_LANGUAGES`).
- 화면 · 요약의 **비중은 이 12개 합계 대비**다. 전체 GitHub 대비가 아니다.
- 요청 24회, 2.5초 간격 (검색 API 인증 한도 분당 30회). 403 · 429면 `retry-after`만큼 기다려 한 번 재시도, 그래도 실패하면 워크플로 실패.
- GitHub가 `incomplete_results: true`를 준 검색어는 `incomplete`에 남기고 요약 · 화면에 경고를 띄운다.

**한계**
- 국내 값은 대략치다. 위치를 "Seoul", "대한민국", "서울"로만 적었거나 비워 둔 사용자는 빠진다.
- 국내는 누적 수라 달마다 변화가 작다. 전 세계는 그 달 신규라 변동이 크다.
- Stack Overflow · Octoverse · JetBrains 같은 연간 조사는 형식이 매번 달라 자동 수집하지 않는다 (종합 8.2 — 사람이 원문 확인).

## 3. 데이터 형식

`data/trends/github/2026-10.json` — 한 달에 파일 하나. 같은 달을 다시 수집하면 덮어쓴다.

```json
{
  "period": "2026-10",
  "collectedAt": "2026-11-02T00:01:23.000Z",
  "source": "GitHub Search API",
  "sourceUrl": "https://docs.github.com/en/rest/search/search",
  "globalNewRepos": [{ "language": "TypeScript", "count": 852722 }],
  "koreaUsers": [{ "language": "Java", "count": 12251 }],
  "incomplete": []
}
```

출처(`source`, `sourceUrl`)와 수집 시각이 파일마다 들어 있다.

## 4. 화면 `/trends`

- 헤더 메뉴 "채용 트렌드" (로그인 상태에서 보이는 메뉴). 페이지 자체는 로그인 없이 열린다.
- 가장 최근 파일 기준으로 두 섹션: 전 세계 신규 레포, 국내 주 언어. 각각 순위 · 막대 · 개수(넓은 화면) · 비중.
- 파일이 2개 이상이면 직전 달 대비 비중 변화 ▲▼ (%p). 0.05%p 미만은 `–`.
- 파일이 없으면 "아직 수집된 데이터가 없어요. 매달 2일에 갱신됩니다."
- Vercel 서버리스 번들에 JSON이 들어가도록 `next.config.ts`에 `outputFileTracingIncludes` 설정.

## 5. 운영 가이드

### 처음 한 번

1. **디스코드 웹후크**: 알림 받을 채널 → 채널 편집(⚙️) → 연동 → 웹후크 → 새 웹후크 → **웹후크 URL 복사** (서버의 "웹후크 관리" 권한 필요).
2. **GitHub Secret**: `PoFol-Capstone/Frontend` → Settings → Secrets and variables → Actions → `DISCORD_WEBHOOK_URL`에 붙여넣기. 없으면 알림만 건너뛰고 PR은 만들어진다.
3. **PR 생성 허용**: Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests". Organization 저장소라면 Organization 설정에서도 켜야 할 수 있다.
4. **기본 브랜치**: 정기 실행(schedule)은 워크플로 파일이 `main`에 있어야 돈다.

웹후크 URL은 비밀번호처럼 다룬다 — URL만 있으면 누구나 그 채널에 글을 쓸 수 있다. 새면 디스코드에서 웹후크를 지우고 새로 만든 뒤 Secret만 바꾼다.

### 매달

1. 디스코드 알림의 요약을 본다.
2. 확인할 것: 순위가 갑자기 뒤집혔는지, 수치가 0이거나 전달과 자릿수가 다른지, ⚠️ 미완료 경고가 있는지.
3. 이상 없으면 PR 머지. 이상하면 PR을 닫고 Actions에서 **Run workflow**로 다시 수집.

### 수동 실행

- GitHub: Actions → Collect trends → Run workflow. 열린 PR이 이미 있으면 같은 브랜치에 덮어쓰고 그 PR 링크를 다시 알린다.
- 로컬: `GITHUB_TOKEN=$(gh auth token) yarn trends:collect` — 파일을 쓰고 요약을 출력한다. 토큰이 없어도 되지만 요청 간격이 7초로 느려진다.

### 실패했을 때

| 증상 | 원인 · 조치 |
|---|---|
| 디스코드에 "⚠️ 트렌드 수집 실패" | 링크된 Actions 로그 확인. `GitHub 검색 실패 403`이면 한도 — 잠시 뒤 다시 실행 |
| PR 단계에서 `GitHub Actions is not permitted to create or approve pull requests` | 처음 한 번 3번 설정 |
| 알림이 안 옴 | `DISCORD_WEBHOOK_URL` Secret 이름 · 값 확인 |
| 머지했는데 화면 그대로 | Vercel 배포 완료 여부 확인 |

## 6. 파일

| 파일 | 역할 |
|---|---|
| `.github/workflows/collect-trends.yml` | 매달 실행, PR 생성, 디스코드 알림 |
| `scripts/collect-trends.ts` | 수집 · 파일 작성 · 요약 (`yarn trends:collect`) |
| `lib/trends.ts` | 언어 목록, 타입, `previousMonth` · `rankRows` · `summarize` (순수 함수) |
| `lib/trends.server.ts` | `readSnapshots` — 저장된 월 파일 읽기 |
| `app/[locale]/trends/page.tsx` | 화면 |
| `tests/trends.test.ts` | 1월 → 작년 12월 · 윤년 말일, 비중 · 변화 · 경고 요약, 파일 읽기 |

## 7. 다음에 할 수 있는 것

- **내 스택과 비교**: 로그인 사용자의 분석 언어 비중을 시장 비중 옆에 표시 (종합 6.3 핵심 기능, 아직 없음).
- 연간 조사 지표: 사람이 원문 확인 후 JSON 추가 — 출처 · 발표일 · 확인일이 없으면 테스트 실패하게 (종합 6.3).
- 차트로 월별 추이 (데이터가 몇 달 쌓인 뒤).
