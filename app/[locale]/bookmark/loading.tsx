import { Skeleton } from "@/components/Skeleton";

export default function BookmarkLoading() {
  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="grid gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
