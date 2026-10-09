import SessionExpired from "@/components/SessionExpired";
import { isSessionRejected } from "@/lib/http.server";
import { parsePageParam } from "@/lib/pagination";
import { getBookmarkedPosts, getPosts } from "@/lib/post";
import { getSchoolCookie } from "@/lib/school";
import { PostType } from "@/types/post";
import BoardClient from "./_components/BoardClient";
import { boardHref, toCategory, type Category } from "./_components/categories";

// 3열 x 3행
const PAGE_SIZE = 9;

type Props = {
  searchParams: Promise<{ category?: string; page?: string }>;
};

export default function BoardPage({ searchParams }: Props) {
  // 로딩 화면은 같은 세그먼트(또는 상위)의 loading.tsx가 Suspense 경계로 보여준다.
  // 여기에 Suspense를 한 겹 더 두면, 서버 오류 뒤 error.tsx의 "다시 시도"(unstable_retry)가
  // 데이터를 다시 받아 와도 오류 화면이 남거나 React #310으로 깨졌다(Next 16.2.0 프로덕션 빌드에서 재현).
  return <BoardContent searchParams={searchParams} />;
}

/**
 * 카테고리별로 백엔드 필터·전용 API를 쓰고, 서버 페이지네이션을 그대로 따른다.
 * 예전엔 첫 1,000개만 받아 로컬에서 나누고 북마크는 그 일부에서 걸러서, 범위 밖의 글과
 * 오래된 북마크에 닿을 수 없었다.
 */
function fetchBoardPage(category: Category, page: number) {
  const paging = { page, size: PAGE_SIZE };
  switch (category) {
    case "Recruiting":
      return getPosts({ ...paging, type: PostType.RECRUIT });
    case "School":
      return getPosts({ ...paging, mySchoolOnly: true });
    case "Bookmarks":
      return getBookmarkedPosts(paging);
    case "All":
      return getPosts(paging);
  }
}

async function BoardContent({ searchParams }: Props) {
  const params = await searchParams;
  const category = toCategory(params.category ?? null);
  const page = parsePageParam(params.page);
  const school = await getSchoolCookie();

  // 학교 인증 전이면 학교 탭은 조회할 게 없다 — 안내만 보여준다
  if (category === "School" && !school) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
        <BoardClient category={category} hasSchool={false} result={null} />
      </main>
    );
  }

  // 실패를 빈 목록으로 바꾸지 않는다 — 서버 장애는 board/error.tsx(재시도)로,
  // 거절된 세션은 재로그인으로 보낸다
  let result;
  try {
    result = await fetchBoardPage(category, page);
  } catch (error) {
    if (isSessionRejected(error)) {
      return <SessionExpired returnTo={boardHref(category, page)} />;
    }
    throw error;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
      <BoardClient category={category} hasSchool={!!school} result={result} />
    </main>
  );
}
