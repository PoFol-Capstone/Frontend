# [구현] 헤더 정리 — 삭제 항목과 근거

- 작성일: 2026.11.06
- 관련 계획: `../pofol-plan-v3.md` 3-1 (헤더), 4 (개선 사항으로 내린 것)
- 배경: 서비스 중심을 커뮤니티에서 **"내 프로젝트(GitHub 기반 AI 정리) + 채용 트렌드"** 로 옮긴다. 커뮤니티는 지우지 않고 서브 기능으로 내린다. 헤더는 이 새 중심을 드러내야 한다

> **주의:** 근거로 삼은 `../pofol-plan-v3.md`(09:39)는 같은 날 오후의 [`2026-11-06-pivot-summary.md`](2026-11-06-pivot-summary.md)로 일부 뒤집혔다 — 팀원 모집은 프로필 탭 이동이 아니라 **삭제**, 채용공고 크롤링 대신 **수동 JSON · 공공 API**. 3장 "일부러 남긴 것"은 이 기준으로 다시 본다.

---

## 1. 요약

| 삭제 항목 | 근거 한 줄 | 되살릴 때 |
|---|---|---|
| 로고 옆 학교 이름 링크 | 커뮤니티(학교 게시판)로 가는 입구라서 서브로 내린 기능을 헤더 맨 앞에 두는 꼴 | `Header.tsx`에 `school` prop · 링크 블록 복구 |
| 드롭다운 "프로필" | `/profile`로 가는 링크가 헤더에 3개였다 (중복) | `ProfileMenu.tsx` 항목 1줄 |
| 드롭다운 "이력서" | 다른 서비스가 이미 잘 하고 있어 핵심이 아니다 → 개선 사항으로 내림. 페이지는 유지 | `ProfileMenu.tsx` 항목 1줄 |
| 번역 키 `profileMenu.profile`, `profileMenu.resume` | 위 두 항목을 지우면서 쓰는 곳이 없어졌다 | `messages/ko.json`, `en.json` |
| `lib/schoolName.ts` | 유일한 사용처가 학교 이름 링크였다 | 파일 복구 |

---

## 2. 항목별 근거

### 2-1. 로고 옆 학교 이름 링크

**삭제 전 코드** (`components/Header.tsx`)
```tsx
{school && (
  <Link href="/board?category=School" ...>
    | &nbsp;{shortSchoolName(school, locale)}
  </Link>
)}
```

**근거**
1. **가는 곳이 커뮤니티다.** 링크 대상이 `/board?category=School`(학교 게시판)이다. v3 계획에서 커뮤니티는 서브 기능이므로, 헤더에서 가장 눈에 띄는 로고 바로 옆 자리를 차지할 이유가 없다.
2. **새 핵심 기능과 관련이 없다.** GitHub AI 정리와 채용 트렌드는 학교와 무관하다. 학교 이름이 로고 옆에 붙어 있으면 "학교 커뮤니티 서비스"로 읽힌다.
3. **다른 길로도 갈 수 있다.** 학교 게시판은 "탐방"(`/board`) 안의 카테고리 필터로 그대로 들어갈 수 있다. 헤더 링크를 지워도 막히는 기능이 없다.
4. **부수 효과: 헤더를 그릴 때마다 학교 쿠키를 읽던 일이 사라졌다.** `HeaderSlot.tsx`가 `getSession()`과 `getSchoolCookie()`를 함께 읽었는데, 이제 세션만 읽는다.

**손대지 않은 것**: 게시판의 학교 카테고리, `getSchoolCookie`(게시판 `app/[locale]/board/page.tsx`가 계속 사용), 학교 인증(설정 페이지).

### 2-2. 드롭다운 "프로필"

**근거**: 로그인한 사용자에게 `/profile`로 가는 링크가 헤더에 **3개** 있었다.

| 위치 | 대상 |
|---|---|
| 로고 | `isLoggedIn ? "/profile" : "/"` |
| 상단 메뉴 "내 프로젝트" | `/profile` |
| 드롭다운 "프로필" | `/profile` |

같은 곳으로 가는 링크가 여러 개면 사용자는 "서로 다른 곳인가?"라고 헷갈린다. 메뉴 항목이 늘어나 정작 필요한 항목(설정 · 로그아웃)을 찾기도 어려워진다. 로고와 "내 프로젝트" 두 개면 충분하다.

### 2-3. 드롭다운 "이력서"

**근거**
1. **경쟁 서비스가 이미 잘 한다.** 이력서 작성은 채용 · 이력서 전문 서비스들이 이미 제공한다. Pofol만의 강점이 아니다.
2. **핵심 기능에 집중한다.** v3의 차별점은 "GitHub를 AI로 정리 + 시장 수요와 비교"다. 메뉴에 이력서가 있으면 서비스 정체성이 흐려진다.
3. **지운 것이 아니라 숨긴 것이다.** `/resume` 페이지와 AI 이력서 API(`app/api/ai/resume`)는 그대로다. 나중에 "프로젝트 정리 결과를 이력서로 내보내기" 방향으로 개선할 때 다시 연결한다 (v3 계획 4장).

### 2-4. 번역 키 · `lib/schoolName.ts`

- `profileMenu.profile`, `profileMenu.resume`: 2-2, 2-3을 지운 뒤 코드 어디에서도 쓰지 않는다. 남겨두면 "어디서 쓰지?" 하고 찾게 만드는 잡음이 된다.
- `lib/schoolName.ts`(`shortSchoolName`): 전체 코드에서 import하던 곳은 `Header.tsx` 하나뿐이었다 (`grep` 확인). 테스트에서도 쓰지 않는다.

---

## 3. 일부러 남긴 것

| 항목 | 이유 |
|---|---|
| 드롭다운 "모집 관리" · "북마크" | 프로필 탭으로 옮길 예정(v3 3-2). 옮기기 전에 지우면 들어갈 길이 없어진다 |
| 상단 메뉴 "탐방" | 커뮤니티는 삭제가 아니라 서브로 유지 |
| `＋` 버튼(글쓰기) | "프로젝트 추가"로 바꾸는 작업은 v3 진행 순서 5번에서 따로 한다 |

---

## 4. 변경 파일

- `components/Header.tsx` — 학교 링크 블록, `school` prop, `useLocale` · `shortSchoolName` · `SchoolNames` import 삭제
- `components/HeaderSlot.tsx` — `getSchoolCookie` 호출 삭제
- `components/ProfileMenu.tsx` — "프로필" · "이력서" 항목 삭제
- `messages/ko.json`, `messages/en.json` — `profileMenu.profile`, `profileMenu.resume` 삭제
- `lib/schoolName.ts` — 파일 삭제

## 5. 검증

- 타입 검사(`tsc --noEmit`) 통과
- 린트(변경 파일) 통과
- 테스트 171개 통과
- 번역 JSON 두 파일 파싱 확인
- **실제 브라우저 확인은 안 함** (로그인 화면을 보려면 백엔드가 같이 떠 있어야 함)
