# 2026-07-22 수정 내역 종합

`code-review-2026-07-16.md`에서 지적된 항목들을 실제로 고친 기록 + 그 과정에서 파생된 리팩터링 모음.

## 1. 게시글 상세 페이지 SSR 크래시 (🔴 2번 항목)

### 문제
- `AuthorBar.tsx`, `ApplicationSection.tsx` 모두 `'use client'`이지만, App Router에서 클라이언트 컴포넌트도 최초 요청 시 서버(Node.js)에서 한 번 SSR됨.
- 두 컴포넌트 모두 `useState(() => localStorage.getItem(...))` / `useState(() => sessionStorage.getItem(...))` 형태로 lazy initializer 안에서 storage를 직접 읽고 있었는데, Node.js 런타임엔 `localStorage`/`sessionStorage` 전역이 없어 `ReferenceError` 발생.
- `PostDetail/index.tsx`가 두 컴포넌트를 무조건 렌더링하므로 `/board/[id]` 새로고침·직접 URL 접근·공유 링크 클릭 등 **서버 렌더링을 실제로 거치는 모든 진입 경로**에서 재현됨. (클라이언트 사이드 `<Link>` 전환에서는 서버 렌더를 안 타므로 크래시가 발생하지 않아 겉보기엔 "잘 동작하는 것"처럼 보일 수 있음.)
- board 라우트 트리에는 `error.tsx`가 없어(`profile`에만 존재) 커스텀 에러 화면 없이 Next.js 기본 500 처리로 떨어짐.

### 좋아요/북마크 상태를 localStorage로만 추적하던 설계 문제
- 백엔드 `ResponsePosts`(`PostResponse`)에 애초에 `isLiked`/`isBookmarked` 필드가 없었고, `toggleLike`/`toggleBookmark`는 `Promise<void>`로 선언되어 서버가 실제로 반환하던 `{ liked }`/`{ bookmarked }` 응답 바디를 프론트에서 버리고 있었음.
- 그 결과 하트/북마크 아이콘의 채움 여부를 **브라우저 `localStorage`에 저장된 postUuid 배열**로만 판단 → 실제 서버 상태와 무관하게 동작:
  - 다른 기기/브라우저로 접속하면 실제로 좋아요한 글도 항상 `false`로 보임
  - 로그아웃 시 `likes`/`bookmarks`를 지우는 로직이 전혀 없어, 같은 브라우저에서 계정을 바꿔 로그인하면 이전 계정이 좋아요한 글이 새 계정에서도 채워진 채로 보이는 **계정 간 상태 누출** 발생

### 수정 (백엔드 `api`)
- `PostResponse.java`: 레코드에 `isLiked`, `isBookmarked` 필드 추가. 기존 3-인자 `from(post, currentCounts, totalApplicantCount)`은 하위 호환을 위해 `false/false` 기본값으로 위임, 요청자 정보가 있는 경우를 위한 5-인자 오버로드 추가.
- `PostService.java`: `getPost(uuid, viewerId, ip)`에서 이미 갖고 있던 `viewerId`로 `existsByPostIdAndUserId(postId, viewerId)`를 호출해 실제 값을 계산하는 `toResponse(post, viewerId)` 오버로드 추가. 비로그인(`viewerId == null`)이면 DB 조회 없이 바로 `false`.
- `PostController.getPosts`/`PostService.getPosts`에도 동일하게 `viewerId` 파라미터를 추가해 목록 조회에서도 `isLiked`/`isBookmarked`가 정확히 채워지도록 확장(최초엔 상세 조회에만 적용했다가, `BoardClient`의 북마크 필터를 고치면서 목록 API까지 마저 확장).

### 수정 (프론트엔드 `pofol`)
- `types/post.ts`: `ResponsePosts`에 `isLiked`, `isBookmarked` 추가.
- `lib/post.ts`: `toggleLike`/`toggleBookmark`가 서버 응답(`{ liked }`/`{ bookmarked }`)을 그대로 반환하도록 수정.
- `PostDetail/index.tsx`: `AuthorBar`에 `initialIsLiked`/`initialIsBookmarked` 전달.
- `AuthorBar.tsx`: `localStorage` 읽기/쓰기 전부 제거, `useState(initialIsLiked)`로 시작, 토글 API 응답값을 그대로 상태에 반영.
- `ApplicationSection.tsx`: toast를 `useState("")`로 안전하게 초기화하고 마운트 시 `useEffect`에서 `sessionStorage`를 읽고 제거하도록 변경 (`signup/verify/page.tsx`의 기존 패턴과 통일).
- `BoardClient.tsx`: `localStorage` 기반 `bookmarkedIds` state 제거, `"Bookmarks"` 필터를 `posts.filter((p) => p.isBookmarked)`로 교체.

## 2. `react-hooks/set-state-in-effect` 대응 — `useSessionToast` 훅 추출

- `ApplicationSection.tsx`의 toast 동기화 코드가 `eslint-config-next` 16.2의 `react-hooks/set-state-in-effect` 룰에 걸림. 이 룰은 "effect 안에서 setState 직접 호출 금지, 렌더링 중 계산하거나 lazy initializer로 옮겨라"를 권장하지만, `sessionStorage`는 SSR에 없는 전역이라 lazy initializer로 되돌리면 위 SSR 크래시가 재발함 — false positive로 판단.
- 인라인 `eslint-disable-next-line`으로 억제하는 대신, `signup/verify/page.tsx`에도 동일한 패턴(로그인 후 세션 스토리지에 남긴 1회성 토스트 메시지를 읽고 지우는 로직)이 중복돼 있던 걸 발견하고 `hooks/useSessionToast.ts`로 추출.
- disable 주석이 재사용 가능한 primitive 훅 한 곳에만 존재하게 되어, "코드 아무데나 어거지로 억제"가 아니라 의도가 분명한 유틸리티가 됨.
- `ApplicationSection.tsx`, `signup/verify/page.tsx` 둘 다 `const toast = useSessionToast("toastMessage");` 한 줄로 교체.

## 3. `proxy.ts` 파비콘 404 버그

### 문제
- 배포 사이트에서 브라우저 탭 파비콘이 안 보임. `app/[locale]/layout.tsx`의 `metadata.icons` 설정 자체는 정상(`/icons/icon.png`, `/icons/apple-icon.png` 참조, 파일도 `public/icons/`에 실존)이었는데, `proxy.ts`의 matcher가 `favicon.ico`만 개별 예외 처리하고 있어서 `/icons/*.png` 요청이 `next-intl` i18n 미들웨어를 그대로 통과 → `/ko/icons/icon.png`로 rewrite되어 404.
- 로컬 dev 서버로 재현 확인: `curl -i http://localhost:3000/icons/icon.png` → `x-middleware-rewrite: /ko/icons/icon.png` 헤더와 함께 404.

### 수정
- matcher를 특정 파일명 나열 대신 확장자가 있는 모든 경로를 제외하는 패턴으로 교체:
  ```ts
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
  ```
- 수정 후 `/icons/icon.png`, `/icons/apple-icon.png` 모두 200 확인. 로그인 보호 라우트(`/board` → `/login` 리다이렉트)와 locale 라우팅(`/en/board`)도 정상 동작 재확인.

## 4. `http` 레이어 죽은 코드 + 쿠키 만료 시간 불일치 (🔴 3번 항목)

### 문제
- `lib/http.ts`, `lib/http.client.ts`는 어디서도 import되지 않는 죽은 코드 (전체 검색 결과 0건) — 실사용 중인 `lib/http.server.ts`와 토큰 리프레시 로직을 그대로 중복 보유해 향후 수정 시 divergence 위험만 있었음.
- `lib/session.ts`의 `COOKIE_OPTIONS.maxAge = 60*60*24*7`(7일)이 `session`/`uuid`/`access_token`/`refresh_token` 네 쿠키에 전부 동일 적용되고 있었는데, 백엔드 `application.properties`의 실제 토큰 수명은 `jwt.access-token-expiration=3600000`(1시간), `jwt.refresh-token-expiration=1209600000`(14일)으로 둘 다 달랐음. 의도한 값이 아니었음(확인됨).
  - `access_token` 쿠키: 로그인 직후엔 7일짜리, refresh 이후(`http.server.ts`가 `maxAge: 60*60`으로 재설정)엔 1시간짜리로 바뀌는 불일치.
  - `refresh_token` 쿠키: 서버에선 14일까지 유효한데 쿠키가 7일 만에 브라우저에서 사라져 아직 유효한 토큰인데도 강제 재로그인되는 실질적 버그.

### 수정
- `lib/http.ts`, `lib/http.client.ts` 삭제.
- `lib/tokenConfig.ts` 신규 생성 — `ACCESS_TOKEN_MAX_AGE`(1시간), `REFRESH_TOKEN_MAX_AGE`(14일)를 백엔드 값과 정확히 맞춰 상수화. (`lib/session.ts`는 `"use server"` 파일이라 비-함수 값을 export할 수 없어 별도 모듈로 분리.)
- `lib/session.ts`: `COOKIE_OPTIONS`를 `SESSION_COOKIE_OPTIONS`(session/uuid/refresh_token, 14일)와 `ACCESS_TOKEN_COOKIE_OPTIONS`(access_token 전용, 1시간)로 분리해 `saveLogin`/`saveAccessToken`에 적용.
- `lib/http.server.ts`의 `refreshAccessToken()`에서 하드코딩돼 있던 `maxAge: 60*60`을 `tokenConfig.ts`의 `ACCESS_TOKEN_MAX_AGE`로 교체 — 이제 숫자가 한 곳에만 존재해 두 파일이 구조적으로 다시 어긋날 수 없음.

## 5. UI 컴포넌트 공용화 (중복 제거)

- **페이지네이션**: `profile/_components/PaginationControls.tsx` + `ChevronIcon.tsx`가 이미 존재했는데 `board/_components/BoardClient.tsx`가 같은 SVG path와 로직을 인라인으로 재구현하고 있던 걸 발견. `components/Pagination.tsx`, `components/ChevronIcon.tsx`로 승격해 두 곳 다 재사용하도록 통일 (크기는 board 쪽 기준으로 고정: 이전/다음 버튼 `h-9 w-9`, 페이지 숫자 버튼 `h-8 w-8`).
- **아바타**: `ProfileSidebar.tsx`, `AuthorBar.tsx`, `PostCard.tsx`, `CommentSection.tsx`(댓글 작성자 + 댓글 입력창) 등 5곳에서 "이미지 or 이니셜 원형 아바타"를 각각 다른 크기/색상으로 재구현하고 있던 걸 발견. `components/Avatar.tsx`(`src`/`name`/`size`/`className`)로 통일. 배경/텍스트 색은 `bg-gray-200`/`text-gray-600`로 고정.
  - `authorAvatarUrl`(post)·`avatarUrl`(comment author)이 백엔드/타입에 아직 없어서, `ProfileSidebar`·댓글 입력창(현재 로그인 유저)을 제외한 나머지는 `src={null}`(이니셜만 표시)로 마크업만 통일. 실제 이미지 지원은 후속 작업으로 보류.
  - 부수 효과: `CommentSection.tsx`의 `<img>` + `eslint-disable` 우회 코드가 사라지고 `next/image`로 통일됨.
- **아이콘**: `PostCard.tsx`의 view/like 인라인 SVG를 `AuthorBar.tsx`와 동일한 lucide-react `Eye`/`Heart`로 교체.

## 검증
- 프론트: `yarn tsc --noEmit`, `yarn eslint` 전부 통과
- 백엔드: `./gradlew compileJava` 통과
- 로컬 dev 서버로 `/icons/*.png` 200 응답, `/board`·`/en/board` 라우팅 정상 동작 직접 확인

## 남은 작업 (스코프 밖)
- `authorAvatarUrl`(`PostResponse`), `avatarUrl`(댓글 `Author`)을 백엔드에 추가해 `Avatar`의 `src={null}` 자리들을 실제 이미지로 채우기.
- `Like`/`Bookmark` 테이블에 `(post_id, userId)` 유니크 제약이 DB 레벨에 없어(app 레벨 check-then-insert만 존재), 동시 요청 시 중복 레코드가 생길 수 있는 레이스 컨디션 여지가 남아있음.
- `code-review-2026-07-16.md`의 나머지 항목(업로드/AI 라우트 인증, Server Function 인가 검증 등)은 이번 세션에서 다루지 않음.
