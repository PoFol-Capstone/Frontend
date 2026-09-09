import { Suspense } from "react";
import { getPosts } from "@/lib/post";
import { getSchoolCookie } from "@/lib/school";
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
  const [result, school] = await Promise.all([
    getPosts({ page: 0, size: 1000 }).catch(() => ({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 1000,
    })),
    getSchoolCookie(),
  ]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
      <BoardClient posts={result.content} hasSchool={!!school} />
    </main>
  );
}
