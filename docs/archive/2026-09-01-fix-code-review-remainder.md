# 2026-09-01 수정 내역 — 코드 리뷰 잔여 항목

`docs/code-review-2026-07-16.md`에서 지적된 항목 중 `docs/fix-2026-07-22-board-detail-ssr-crash.md`에서
다루지 않고 남아 있던 것들을 처리한 기록. 그 과정에서 리뷰가 잡아내지 못한 버그도 몇 건 발견해서 함께 고쳤다.

## 이미 해결되어 있던 항목

- **🔴 1 업로드/AI 라우트 인증** — `getSessionUuid()` 체크, `ALLOWED_TYPES` 화이트리스트,
  5MB 크기 제한이 커밋 `5aa451e`("이미지 오남용 방지 로직 추가")에 이미 들어가 있었다.
  `contentType`도 화이트리스트를 통과한 값만 쓰이므로 콘텐츠 스푸핑 벡터는 닫혀 있다.
  다만 **rate limit은 없었으므로 이번에 추가**했다.
- **🔴 2 SSR 크래시**, **🔴 3 http 죽은 코드/쿠키 만료 불일치** — 07-22 작업에서 완료.

---

## 1. 🔴 rate limit 부재 (업로드/AI 라우트)

인증은 있었지만 로그인한 사용자 한 명이 OpenAI 호출·Blob 업로드를 무한히 반복할 수 있었다.

- `lib/rateLimit.ts` 신규 — 인메모리 슬라이딩 윈도우. 윈도우가 지난 버킷은 접근 시 정리하고,
  유령 키 대비로 전체 키 수에 상한(10,000)을 둔다. 초과 시 `Retry-After` 헤더와 함께 429.
- 적용: `/api/ai/summarize`(분당 5회), `/api/ai/thumbnail`(분당 10회), `/api/upload/thumbnail`(분당 10회) — 모두 사용자 uuid 단위.
- **한계(의도적)**: 서버 인스턴스별 메모리라 다중 인스턴스 배포에서는 인스턴스 수만큼 한도가 늘어난다.
  엄격한 쿼터가 필요해지면 Redis 등 공유 스토어로 교체해야 한다. 코드에 주석으로 남겨둠.

## 2. 🟡 Server Function 인가 — 리뷰 지적은 false positive, 다만 가드는 추가

리뷰는 "클라이언트가 준 uuid를 그대로 백엔드에 전달할 뿐 소유권 확인이 없어 IDOR 위험"이라고 했지만,
**백엔드를 확인한 결과 인가는 완전하다.** 문제로 지목된 모든 엔드포인트가 JWT에서 뽑은
`@AuthenticationPrincipal Long userId`로 소유권을 검증한다:

| 지적된 함수 | 백엔드 검증 위치 |
| --- | --- |
| `deletePostAction` | `PostService.deletePost` — `post.getAuthor().getId().equals(userId)` |
| `deleteComment` | `CommentService.deleteComment` — 동일 패턴 |
| `acceptApplicant`/`rejectApplicant` | `ApplyService.accept`/`reject` — 게시글 작성자 확인 |
| `unfollowUser` | `FollowService.unfollow` — `followerId`는 서버가 결정 |

클라이언트가 보내는 uuid는 *대상 리소스 식별자*일 뿐이고 *행위자*는 항상 토큰에서 나오므로
uuid를 바꿔도 남의 리소스를 조작할 수 없다.

그래도 AGENTS.md의 "모든 Server Function 내부에서 인증을 검증하라"는 규칙은 지켜야 하므로
(`proxy.ts` matcher는 Server Function 호출을 보호하지 않는다) `lib/authGuard.ts`를 추가했다:

- `requireSessionUuid()` — 세션 쿠키가 없으면 401 `ApiError`를 던진다. `lib/post.ts`, `lib/comment.ts`,
  `lib/apply.ts`, `lib/user.ts`의 모든 변경 계열 함수에 적용.
- `getOptionalSessionUuid()` — 로그인 여부에 따라 동작이 갈리는 조회용.
- 효과는 **방어 심층화 + 빠른 실패**: 자격증명 없는 요청을 백엔드까지 보내지 않고,
  실패를 401 `ApiError`로 통일해 호출부가 만료 세션을 일관되게 처리할 수 있다.

## 3. 🟡 `github/repo-info` 검증

- `repo` 쿼리파라미터를 `/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/`로 검증. 검증 없이 URL에 이어붙이면
  `a/b/../../user` 같은 값으로 의도하지 않은 GitHub API 엔드포인트를 호출할 수 있었다.
- `readContentsFile(res)` 헬퍼로 base64 디코딩을 일원화 — 200이어도 디렉터리 응답(배열)이거나
  파일이 너무 커서 `content`가 없는 경우가 있어 `typeof json?.content !== "string"`을 먼저 확인하고,
  `res.json()` 실패도 try/catch로 흡수한다. `package.json`/README/추가 파일 5종 전부 이 헬퍼를 쓴다.
- `lib/github.ts`의 `detectFromPackageJson`이 `JSON.parse`를 맨몸으로 호출하고 있어,
  남의 레포에 깨진 `package.json`이 있으면 라우트 전체가 500이 됐다. 파싱 실패를 "감지 결과 없음"으로 처리.
- 덤으로 `/api/ai/summarize`도 같은 부류의 문제가 있었다: `(techStack as string[]).join()`,
  `(readmeText as string).slice()`가 클라이언트 body를 검증 없이 캐스팅해서 타입이 다르면 TypeError → 500.
  타입 확인 후 정규화(문자열 길이 제한, 배열 필터링)하고 `projectName` 누락은 400으로 응답.

## 4. 🟡 에러 처리 비일관 — 백엔드 메시지가 전부 유실되던 버그 포함

**발견한 버그**: `lib/http.server.ts`의 `toApiError`가 `data.message`만 읽었는데,
백엔드 `GlobalExceptionHandler`는 `{ "error": "..." }` 형태로 응답한다.
그래서 "이미 팔로우한 유저입니다", "해당 포지션의 모집이 완료되었습니다" 같은
**서버의 검증 메시지가 사용자에게 단 한 번도 도달하지 않았다.** 두 필드를 모두 읽도록 수정.

그 외:

- `lib/apply.ts` — 모든 예외를 무조건 삼키던 것을 정리. `getApply`는 비로그인이면 백엔드 호출 없이
  바로 null(헛된 401 방지), 그 외 실패는 계속 null로 흡수하되 **로그를 남긴다**.
  (백엔드가 "지원 내역이 없습니다"를 `RuntimeException`으로 던져 500으로 내려오기 때문에
  status만으로는 "미지원"과 "실제 장애"를 구분할 수 없다 — 로그가 유일한 단서다.)
  `getApplicants`도 동일하게 로그 추가.
- `lib/post.ts`, `lib/comment.ts`, `lib/user.ts` — `res.data`를 암묵적 `any`로 캐스팅하던 곳에
  axios 제네릭(`http.get<T>`) 전부 명시.
- `/api/skills` — 백엔드 실패를 조용히 빈 배열로 바꿔서 장애가 "스킬이 없음"으로 보였다. 로그 추가.

## 5. 🟡 폼 검증/피드백 부재

프로덕션 빌드에서는 Server Function이 던진 에러 메시지가 지워진 채 클라이언트에 도달하므로
(`"An error occurred in the Server Components render"`), **사용자에게 보여줄 실패 사유는
예외가 아니라 반환값으로 전달**해야 한다. `types/action.ts`의 `ActionResult`를 도입했다.

- **`ApplyModal`** — 검증이 전혀 없어서 포지션 미선택 시 백엔드 400이 조용히 삼켜졌다.
  포지션·자기소개 필수 검증, `isSubmitting` 상태, 실패 메시지(`role="alert"`) 추가.
- **`EditApplyModal`** — `console.error`만 찍고 모달이 그대로 열려 있어 저장 여부를 알 수 없었다.
- **`ViewApplyModal`** — `cancelApply` 실패 시 예외가 그대로 튀어나가 모달이 멈춘 것처럼 보였다.
- **`ProfileEditModal`** — 이름 필수 검증 + 저장 실패 표시.
- **`EditPostClient`** — 빈 `catch {}` 두 곳(썸네일 업로드/게시글 저장). 업로드 실패는 라우트가
  보내주는 사유(형식/크기/rate limit)를 그대로 노출.
- **`CommentSection`** — 댓글 등록/수정/삭제/좋아요/답글 5개 핸들러가 `await`만 하고 에러를 잡지
  않아, 실패하면 unhandled rejection이 나고 화면엔 아무 변화도 없었다(사용자는 클릭이 먹힌 줄 알게 됨).
  전부 try/catch + `isPending` 비활성화 + 에러 표시.
- **`recruitment/actions.ts`** — `startTransition(() => acceptAction(...))`로만 호출해서 실패가
  transition 안에서 사라졌다. 액션이 `ActionResult`를 반환하도록 바꿔 `RecruitmentClient`가 사유를 띄운다.
  이제 4번의 `toApiError` 수정과 맞물려 "해당 포지션의 모집이 완료되었습니다" 같은 실제 사유가 보인다.
- **`deletePostAction`** — 성공 시 리다이렉트하므로 실패했을 때만 `ActionResult`를 반환한다
  (`Promise<ActionResult | undefined>`). `redirect()`는 내부적으로 예외를 던지므로 **try 블록 밖에서**
  호출해야 한다는 점에 주의. `DeleteModal`에 `error` prop을 추가해 표시.

## 6. 🟡 팔로우 기능 — no-op 2곳 + 타입/경로 불일치

리뷰는 "`profile/[id]/page.tsx`가 `onToggleFollow`를 전달하지 않아 토글이 no-op"이라고 했는데,
파보니 **팔로우 기능 전체가 4중으로 깨져 있었다.**

### 발견한 버그

1. **`getFollowers`가 존재하지 않는 엔드포인트를 호출** — `/api/users/{uuid}/followers`(복수)로
   요청했지만 백엔드 `FollowController`는 `/api/user`(단수)에 매핑돼 있다. 항상 404 →
   호출부의 `.catch(() => [])`에 걸려 **팔로워 목록이 늘 비어 보였다.**
2. **`FollowerUser` 타입이 서버 응답과 불일치** — 프론트는 `{ id: number, isFollowing: boolean }`으로
   선언했지만 서버는 `{ uuid, name, avatarUrl }`을 보냈다. 그래서 `key={user.id}`가 전부 `undefined`,
   `isFollowing`도 항상 `undefined`(= 늘 "팔로우"로 표시), `onToggleFollow(user.id)`도 `undefined` 전달.
3. **`ProfileSidebar`에 팔로우 버튼이 아예 없었다** — `isOwner`일 때만 "프로필 수정" 버튼이 있고
   남의 프로필에는 어떤 버튼도 렌더되지 않았다. `FollowButton.tsx`는 아무도 import하지 않는 죽은 코드.
4. **`AuthorBar`(게시글 상세)의 팔로우 버튼도 no-op** — `onClick={() => setIsFollowing(prev => !prev)}`로
   로컬 state만 뒤집고 API를 호출하지 않았다. 리뷰가 놓친 두 번째 no-op.

### 수정 (백엔드 `api`)

- `FollowUserResponse`에 `isFollowing` 추가. 요청자에 따라 달라지는 값이라 JPQL 생성자 표현식에서는
  `false`로 두고, `FollowService.fillIsFollowing()`이 `findFolloweeUuidsByFollowerId(viewerId)` **한 번의
  쿼리**로 얻은 집합과 대조해 채운다(목록 길이에 비례하는 추가 쿼리 없음).
- `FollowController.getFollowers`/`getFollowings`에 `@AuthenticationPrincipal Long viewerId` 추가.
- `UserProfileResponse.isFollowing` 추가 — `UserService.getProfile(uuid, viewerId)`가 계산.
  비로그인이거나 본인 프로필이면 DB 조회 없이 false.
- `PostResponse.isAuthorFollowed` 추가 — 07-22의 `isLiked`/`isBookmarked`와 같은 패턴.
  **단, 목록 조회에는 넣지 않았다**: `toResponse`는 `getPosts`가 게시물 1건마다 호출하고
  보드 페이지는 `size: 1000`으로 요청하므로 게시물당 쿼리 하나가 그대로 N+1이 된다.
  팔로우 버튼은 상세 화면에만 있으므로 `toResponse(post, viewerId, withAuthorFollow)` 3-인자
  오버로드를 만들어 `getPost`에서만 `true`로 넘긴다.

### 수정 (프론트엔드 `pofol`)

- `types/user.ts` — `FollowerUser`를 `{ uuid, name, avatarUrl, isFollowing }`으로 교정, `Profile.isFollowing` 추가.
- `types/post.ts` — `ResponsePosts.isAuthorFollowed` 추가.
- `lib/user.ts` — `getFollowers` 경로를 `/api/user/...`로 수정.
- `components/FollowButton.tsx` — 죽어 있던 `profile/_components/FollowButton.tsx`를 공용으로 승격.
  `initialIsFollowing`을 서버 값으로 받고, `className`으로 호출부 레이아웃에 맞춘다.
  실패 시 롤백 없이 에러 표시, 성공 시 `router.refresh()`로 팔로워 수 재계산.
  **`ProfileSidebar`와 `AuthorBar`가 이 컴포넌트를 공유**해 no-op 2곳이 동시에 해결됐다.
- `ProfileSidebar` — 페이지가 넘겨주지 않던 `onToggleFollow` prop과 쓰이지 않던 래퍼 제거.
  `isOwner`가 아니면 `FollowButton`을 렌더.
- `FollowerModal` — `uuid` 기준으로 실제 API 호출. 낙관적 갱신 후 실패하면 되돌리고,
  `Avatar`로 프로필 이미지도 표시.
- `profile/page.tsx` — 본인 프로필도 팔로워 목록을 가져온다(팔로워 모달을 열 수 있는데 안 넘겨줘서 늘 비어 있었다).

## 7. 🟢 모달 접근성

`hooks/useModalA11y.ts` 신규 — ESC 닫기, Tab/Shift+Tab 포커스 트랩, 열릴 때 내부 첫 요소로 포커스 이동 및
닫을 때 원래 요소로 복귀, 배경 스크롤 잠금을 한 곳에 모았다. 반환한 ref를 패널에 연결해 사용.

`Modal`, `DeleteModal`, `FollowerModal`, `ProfileEditModal`에 적용 + `role="dialog"`,
`aria-modal`, `aria-labelledby`(+ `DeleteModal`은 `aria-describedby`), 닫기 버튼 `aria-label` 추가.

> `onClose`를 ref에 담아 effect 재실행을 막는데, 렌더 중 ref 접근은
> `react-hooks/refs` 룰에 걸리므로 동기화도 별도 effect에서 한다.

## 8. 🟢 loading.tsx / error.tsx

- `loading.tsx` 신규: `board`, `board/[id]`, `profile`, `recruitment`.
  `components/Skeleton.tsx`(`Skeleton`, `SkeletonCardGrid`)를 공용 프리미티브로 두고 각 페이지 레이아웃에 맞춰 조립.
- `board/error.tsx` 신규 — board 트리에 에러 경계가 없어서(`profile`에만 있었다) 상세 페이지 렌더가
  실패하면 Next.js 기본 500으로 떨어졌다.
- 각 서버 페이지를 **"정적 셸 + `<Suspense>`(비동기 콘텐츠)"** 구조로 분리하고, fallback으로 해당
  `loading.tsx`를 그대로 재사용한다. 대상: `board`, `board/[id]`, `board/[id]/edit`, `profile`,
  `profile/[id]`, `recruitment`, `/[locale]`(홈).
- `layout.tsx` — 세션 쿠키 읽기를 `components/HeaderSlot.tsx`로 떼어내 `<Suspense fallback={<HeaderFallback />}>`로
  감쌌다. 레이아웃이 직접 쿠키를 읽으면 모든 페이지가 헤더 데이터를 기다리게 된다.

## 9. 🟡 캐싱 — `cacheComponents`는 지금 켤 수 없음 (근거 확인)

**시도했고 되돌렸다.** `cacheComponents: true`를 켜고 위 8번의 Suspense 구조까지 갖춘 뒤에도
빌드가 다음 에러로 실패한다:

```
Error: Route "/[locale]/board/[id]": Uncached data was accessed outside of <Suspense>.
    at RootLayout (...)
```

`--debug-prerender`로 원인을 특정했다:

```
Route "/[locale]/recruitment" accessed header "x-next-intl-locale" ...
    at async (i18n/request.ts:6:21)   // const requested = await requestLocale;
```

`i18n/request.ts`의 `getRequestConfig`가 매 요청 `x-next-intl-locale` 헤더로 로케일을 해석하기 때문에
**루트 레이아웃 자체가 런타임 의존**이 되고, 그 결과 어떤 라우트도 static shell을 만들 수 없다.
`use cache`와 `unstable_instant`은 이 플래그가 있어야 동작하므로 둘 다 보류.
`unstable_instant`는 추가로 라우트가 읽는 모든 쿠키/헤더를 `samples`에 선언하라고 요구하는데,
거기에 next-intl 내부 헤더 이름을 박아넣는 것은 구현 세부사항에 결합되는 일이라 하지 않았다.

**선결 조건**: next-intl의 정적 렌더링 셋업 — 모든 layout과 **page**에서 `setRequestLocale(locale)` 호출
(현재는 루트 레이아웃에만 있다). 이 정리가 끝나면 다시 시도할 수 있다. 판단 근거를 `next.config.ts`
주석에 남겨두었다.

**대신 실제로 얻을 수 있는 캐싱은 적용했다.** 리뷰가 지목한 `lib/skill.ts`는 확인해보니
**어디서도 import되지 않는 죽은 코드**였고(실제 소비자인 `SkillPicker`·`useProjectForm`은
`/api/skills` 라우트 핸들러를 `fetch`한다), 그 라우트 핸들러가 `cache: "no-store"`로
**글자를 칠 때마다 백엔드까지 왕복**하고 있었다. 스킬 목록은 백엔드 `SkillDataInitializer`가
시딩하는 정적 참조 데이터이므로:

- `app/api/skills/route.ts` — `next: { revalidate: 3600, tags: ["skills"] }`로 1시간 캐싱
  (`q`별로 개별 캐시 엔트리가 생긴다). `use cache`를 쓸 수 없는 이유는 주석으로 남김.
- `lib/skill.ts` 삭제.

## 10. 🟢 죽은 코드 / `'use client'` 누락

- 삭제: `app/_data/*.ts` 5개, `app/[locale]/board/write/_data/mockData.ts`, `lib/skill.ts`,
  `app/[locale]/profile/_components/FollowButton.tsx`(공용으로 승격) — 전부 import 0건 확인 후 제거.
- `app/[locale]/search/page.tsx`의 미사용 `PostCard` import 제거(eslint 경고).
- `'use client'` 추가: `PostContent`, `PostHero`, `ApplicantSection`, `PositionSelector`, `Modal`, `DeleteModal`.
  모두 `useTranslations`(클라이언트 훅)를 쓰는데 디렉티브가 없어 상위 클라이언트 컴포넌트에
  암묵적으로 얹혀 있었다. **경계를 명시한 것이고, 이것으로 Server Component 이점이 회복되는 것은 아니다**
  — 부모가 클라이언트 컴포넌트인 한 번들에 포함된다. 진짜로 서버로 되돌리려면 `PostDetail`의
  상태 관리를 더 작은 클라이언트 컴포넌트로 쪼개는 별도 리팩터링이 필요하다.

---

## 검증

- 프론트: `yarn tsc --noEmit` ✅, `yarn eslint` ✅(경고 0), `yarn build` ✅
- 백엔드: `./gradlew compileJava` ✅ (테스트 소스는 존재하지 않음)
- 로컬 dev 서버(`next dev --webpack`)로 직접 확인:
  - `/`, `/board`, `/en/board`, `/login`, `/settings`, `/profile`, `/icons/icon.png`, `/api/skills` 전부 200
  - 보호 라우트 리다이렉트 정상: `GET /board` → `307 → /login?callbackUrl=%2Fboard`
  - locale 라우팅 정상: `/en/board` → `/en/login?callbackUrl=%2Fen%2Fboard`
- **백엔드를 띄우지 않은 상태**의 검증이므로, 팔로우/`isAuthorFollowed`/`isFollowing`의
  런타임 동작은 실제 서버·DB를 붙여 한 번 더 확인이 필요하다.

## 남은 작업 (스코프 밖)

- **next-intl 정적 렌더링 정리 → `cacheComponents` 재시도** (9번 참고). 이게 풀리면
  `use cache`·`unstable_instant`·즉시 네비게이션이 모두 열린다.
- **목록 조회의 N+1**: `toResponse(post, viewerId)`가 게시물 1건마다 `isLiked`/`isBookmarked`
  두 쿼리를 날린다(07-22에 추가된 구조). 보드 페이지가 `size: 1000`으로 요청하므로 최대 2,000 쿼리.
  이번에 `isAuthorFollowed`는 상세에만 넣어 악화를 피했지만, 기존 두 개도 팔로우와 같은 방식
  (요청자가 좋아요/북마크한 post id 집합을 한 번에 조회 후 대조)으로 바꾸는 게 좋다.
- **보드 페이지의 `size: 1000`** 자체 — 서버 페이지네이션으로 전환.
- `authorAvatarUrl`(`PostResponse`), `avatarUrl`(댓글 `Author`)을 백엔드에 추가해
  `AuthorBar`·`CommentSection`의 `src={null}` 자리를 실제 이미지로 채우기 (07-22에서 이어짐).
- `Like`/`Bookmark` 테이블의 `(post_id, user_id)` 유니크 제약 (07-22에서 이어짐).
- rate limiter를 공유 스토어(Redis)로 이전 — 다중 인스턴스 배포 시.
- `AuthorBar`가 `t("likeFailed")`/`t("bookmarkFailed")`를 쓰는데, 이 값들은 세션 만료 시에도
  뜨므로 재로그인 유도 UX를 붙이면 더 좋다.

> 참고: 이번 작업과 무관하게 `api` 워킹트리에 `RedisConfig.java`, `GlobalExceptionHandler.java`,
> `application.properties`의 커밋되지 않은 Redis 관련 변경이 남아 있다. 건드리지 않았다.
