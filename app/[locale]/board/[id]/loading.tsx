import { Skeleton } from "@/components/Skeleton";

export default function PostDetailLoading() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <section className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-9 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
        </section>

        <aside className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </aside>
      </div>
    </main>
  );
}
