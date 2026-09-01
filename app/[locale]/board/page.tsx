import { Suspense } from "react";
import { getPosts } from "@/lib/post";
import BoardClient from "./_components/BoardClient";
import BoardLoading from "./loading";

export default function BoardPage() {
  return (
    <Suspense fallback={<BoardLoading />}>
      <BoardContent />
    </Suspense>
  );
}

async function BoardContent() {
  const result = await getPosts({ page: 0, size: 1000 }).catch(() => ({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 1000,
  }));

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
      <BoardClient posts={result.content} />
    </main>
  );
}
