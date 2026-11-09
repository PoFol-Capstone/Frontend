import { Skeleton } from "@/components/Skeleton";

export default function RecruitmentLoading() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-8 sm:py-10">
      <section className="mx-auto max-w-280">
        <div className="mb-6 space-y-3 sm:mb-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-60 sm:h-10 sm:w-72" />
          <Skeleton className="h-5 w-full max-w-96" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
            <Skeleton className="h-7 w-32" />
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
