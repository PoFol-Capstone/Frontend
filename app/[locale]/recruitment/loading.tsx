import { Skeleton } from "@/components/Skeleton";

export default function RecruitmentLoading() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-8 py-10">
      <section className="mx-auto max-w-280">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6">
            <Skeleton className="h-7 w-40" />
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
