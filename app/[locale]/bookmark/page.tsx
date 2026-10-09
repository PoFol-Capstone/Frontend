import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Pagination } from "@/components/Pagination";
import SessionExpired from "@/components/SessionExpired";
import { isSessionRejected } from "@/lib/http.server";
import { buildPageHref, parsePageParam } from "@/lib/pagination";
import { getBookmarkedPosts } from "@/lib/post";

const PAGE_SIZE = 10;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default function BookmarkPage({ searchParams }: Props) {
  // 로딩 화면은 같은 세그먼트(또는 상위)의 loading.tsx가 Suspense 경계로 보여준다.
  // 여기에 Suspense를 한 겹 더 두면, 서버 오류 뒤 error.tsx의 "다시 시도"(unstable_retry)가
  // 데이터를 다시 받아 와도 오류 화면이 남거나 React #310으로 깨졌다(Next 16.2.0 프로덕션 빌드에서 재현).
  return <BookmarkContent searchParams={searchParams} />;
}

/**
 * 내 북마크. 예전엔 더 이상 기록하지 않는 localStorage "bookmarks"를 첫 페이지 글과 대조해서
 * 서버에 북마크가 있어도 항상 비어 보였다. 이제 서버 북마크 API와 페이지네이션을 그대로 쓴다.
 * 실패는 빈 목록으로 바꾸지 않고 오류 경계(재시도)로 보낸다.
 */
async function BookmarkContent({ searchParams }: Props) {
  const page = parsePageParam((await searchParams).page);
  const t = await getTranslations("bookmark");

  let result;
  try {
    result = await getBookmarkedPosts({ page, size: PAGE_SIZE });
  } catch (error) {
    if (isSessionRejected(error)) {
      return <SessionExpired returnTo={buildPageHref("/bookmark", {}, page)} />;
    }
    throw error;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      {result.content.length === 0 ? (
        <p className="text-gray-400">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4">
          {result.content.map((post) => (
            <li key={post.uuid}>
              <Link
                href={`/board/${post.uuid}`}
                className="block rounded-xl border border-gray-200 p-5 transition hover:border-black"
              >
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                  {post.content}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={result.number}
        totalPages={result.totalPages}
        pathname="/bookmark"
      />
    </main>
  );
}
