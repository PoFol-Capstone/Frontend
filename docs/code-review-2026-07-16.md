# 코드 리뷰 결과 (2026-07-16)

프로젝트 전체 구조를 4개 영역(보안/인증, Next.js 16 규칙 준수, 데이터 레이어, 주요 기능 컴포넌트)으로 나눠 진행한 리뷰 결과.

## 🔴 높음 — 우선 조치 권장

### 1. 인증 없는 업로드/AI API 라우트
- `app/api/upload/thumbnail/route.ts` — 인증 체크 전무, 파일 크기 제한 없음. 사용자가 보낸 `file.type`을 그대로 blob의 `contentType`으로 사용해 `text/html` 등으로 위장 시 콘텐츠 스푸핑/저장형 XSS 벡터가 될 수 있음.
- `app/api/ai/summarize/route.ts`, `app/api/ai/thumbnail/route.ts` — 인증·rate limit 없이 누구나 OpenAI API를 호출 가능 → 비용 남용 위험.
- `proxy.ts`가 `/api`를 matcher에서 제외해 보호를 각 route.ts에 위임하는 설계인데, 이 세 라우트가 그 책임을 이행하지 않고 있음.

### 2. SSR 크래시 위험 — window 가드 없는 storage 접근
- `app/[locale]/board/[id]/_components/PostDetail/AuthorBar.tsx:29-38`, `app/[locale]/board/[id]/_components/ApplicationSection.tsx:32-39` — `useState` 초기화 함수에서 `typeof window` 체크 없이 `localStorage`/`sessionStorage` 접근. `'use client'`여도 최초 렌더는 서버에서 실행되므로 `ReferenceError` 가능. `BoardClient.tsx`는 가드를 정확히 쓰고 있어 일관성이 깨짐. board 라우트엔 `error.tsx`도 없어 전체 페이지가 크래시할 수 있음.

### 3. http 레이어 죽은 코드 + 설정 불일치
- `lib/http.ts`, `lib/http.client.ts`는 어디서도 import되지 않는 죽은 코드인데 `lib/http.server.ts`(실사용)와 토큰 리프레시 로직을 거의 그대로 중복 보유 — 향후 수정 시 divergence 위험.
- `lib/session.ts`(쿠키 maxAge 7일) vs `lib/http.server.ts`의 refresh 로직(1시간)이 같은 `access_token` 쿠키에 서로 다른 만료시간을 하드코딩 — 의도인지 버그인지 불분명.

## 🟡 중간

- **Server Function 내부 인증 미검증**: AGENTS.md는 "모든 Server Function 내부에서 인증을 검증하라"고 명시하지만, `deletePostAction`, `acceptAction`/`rejectAction`, `deleteComment`, `acceptApplicant`/`rejectApplicant`, `unfollowUser` 등이 클라이언트가 준 uuid를 그대로 백엔드에 전달할 뿐 소유권 확인이 없음 — 백엔드 인가가 완전하지 않으면 IDOR로 이어질 수 있음.
- `app/api/github/repo-info/route.ts` — `repo` 쿼리파라미터 검증 없이 GitHub API 경로에 직접 삽입(경로 인젝션 가능성), `json.content` 존재 확인 없이 `Buffer.from` 호출해 TypeError 가능, `JSON.parse`도 try/catch 없음.
- **캐싱 공백**: `next.config.ts`에 `cacheComponents` 미설정, `"use cache"` 사용처 0건 — 정적 성격의 `lib/skill.ts` 같은 데이터도 매번 재조회.
- **에러 처리 비일관**: `lib/apply.ts`는 모든 예외를 무조건 삼키는 반면 `lib/notification.ts`는 401/403만 선별 처리. 여러 파일에서 axios 제네릭 없이 `res.data`를 암묵적 `any`로 캐스팅.
- **폼 검증/피드백 부재**: `ApplyModal`, `EditApplyModal`, `EditPostClient`, `ProfileEditModal`, `CommentSection`의 여러 핸들러가 실패 시 조용히 넘어가거나 빈 catch 블록.
- **팔로우 기능 사실상 no-op**: `profile/[id]/page.tsx`가 `ProfileSidebar`에 `onToggleFollow`를 전달하지 않아 팔로우 토글이 항상 아무 동작 안 함. (`FollowButton.tsx`도 초기 상태 버그가 있지만 이건 어차피 미사용 죽은 코드.)

## 🟢 낮음

- `unstable_instant`, `loading.tsx`/`Suspense` 전혀 미사용 — board/profile 상세 페이지처럼 `Promise.all`로 여러 API를 병렬 호출하는 무거운 서버 컴포넌트에 도입하면 체감 네비게이션 개선 여지 큼.
- 모달 공통 이슈: `role="dialog"`, ESC 닫기, 포커스 트랩 없음 (`Modal.tsx`, `DeleteModal.tsx`, `FollowerModal.tsx` 등).
- `app/_data/*.ts` mock 데이터 5개 파일이 실제 코드에서 전혀 import되지 않는 잔재 — 정리 대상.
- `PostContent.tsx`, `PostHero.tsx`, `ApplicantSection.tsx` 등은 `'use client'`가 없지만 클라이언트 컴포넌트가 직접 import해 결과적으로 클라이언트 번들에 편입됨 — Server Component 이점을 완전히 못 살림.

## ✅ 문제 없음으로 확인된 부분

params/searchParams Promise 규칙, `proxy.ts`/Tailwind 4 설정, `next dev --webpack`, `.env.local` 시크릿 관리, GitHub 토큰 처리, `dangerouslySetInnerHTML` 미사용(XSS 없음), 리스트 key prop 처리는 모두 규칙에 맞게 잘 되어 있음.

## 조치 우선순위

1. 업로드/AI 라우트 인증 추가
2. storage 접근부 window 가드 추가
3. http.ts/http.client.ts 죽은 코드 정리
4. Server Function 인가 로직 보강
