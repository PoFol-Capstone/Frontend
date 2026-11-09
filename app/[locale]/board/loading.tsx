import { Skeleton, SkeletonCardGrid } from "@/components/Skeleton";

export default function BoardLoading() {
  return (
    <main className="mx-auto min-h-[calc(100vh-64px)] max-w-5xl bg-white px-4 py-10 sm:px-6">
      <div className="mb-8 flex gap-6 border-b border-gray-200 pb-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-14" />
        ))}
      </div>
      <div className="border border-gray-900 p-5">
        <SkeletonCardGrid />
      </div>
    </main>
  );
}
