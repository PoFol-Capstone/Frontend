import { getPosts } from "@/lib/post";
import BoardClient from "./_components/BoardClient";
import { posts } from "@/app/_data/posts"; //DB 있으면 삭제

interface Props {
  searchParams: Promise<{ page?: string; size?: string }>;
}

export default async function BoardPage({ searchParams }: Props) {
  const { page, size } = await searchParams;

  const currentPage = Math.max(0, Number(page ?? 0));
  const pageSize = Number(size ?? 10);

  const result = await getPosts({ page: currentPage, size: pageSize }).catch(
    () => ({ content: [], totalElements: 0, totalPages: 0, number: 0, size: pageSize }),
  );

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
      <BoardClient
        posts={result.content}
        currentPage={result.number}
        totalPages={result.totalPages}
      />
    </main>
  );
}
