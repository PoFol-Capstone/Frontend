import { Skeleton, SkeletonCardGrid } from "@/components/Skeleton";

export default function BoardLoading() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
      <div className="mb-6 space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <SkeletonCardGrid />
    </main>
  );
}
