/**
 * 로딩 스켈레톤 블록. `loading.tsx`와 `<Suspense fallback>`에서 공용으로 쓴다.
 * 서버에서 그대로 렌더되는 순수 마크업이라 'use client'가 필요 없다.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  );
}

/** 카드 그리드용 스켈레톤 (게시글 목록 등) */
export function SkeletonCardGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
