import type { UiPost } from "@/lib/uiTrends";

/** 이미지가 없는 글의 배경 — 출처별 색으로 어디 글인지 바로 보이게 */
const SOURCE_TINT: Record<string, string> = {
  "Nielsen Norman Group": "from-amber-100 to-orange-200 text-orange-900",
  "Smashing Magazine": "from-rose-100 to-red-200 text-red-900",
  "UX Collective": "from-slate-100 to-slate-300 text-slate-800",
  "Figma Blog": "from-violet-100 to-fuchsia-200 text-violet-900",
  "web.dev": "from-sky-100 to-blue-200 text-blue-900",
};

/**
 * UI/UX 디자인 트렌드 카드 — scripts/collect-ui-trends.ts가 매일 쌓는 글.
 * 첫 글은 크게, 나머지는 2열. 한국어 화면에서는 AI 번역 제목 · 요약을 쓰고 원제를 작게 함께 보여준다.
 */
export default function UiTrendCards({
  posts,
  locale,
  originalLabel,
}: {
  posts: UiPost[];
  locale: string;
  originalLabel: string;
}) {
  const dateFormat = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "Asia/Seoul" });
  const ko = locale === "ko";

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {posts.map((p, i) => {
        const featured = i === 0;
        const title = (ko && p.titleKo) || p.title;
        const summary = (ko && p.summaryKo) || p.summary;
        return (
          <li key={p.link} className={featured ? "sm:col-span-2" : undefined}>
            <a
              href={p.link}
              target="_blank"
              rel="noreferrer"
              className={`group flex h-full overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${
                featured ? "flex-col sm:flex-row" : "flex-col"
              }`}
            >
              <div
                className={`relative shrink-0 overflow-hidden bg-gray-100 ${
                  featured ? "aspect-[16/9] sm:aspect-auto sm:w-1/2" : "aspect-[16/9]"
                }`}
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 매체마다 이미지 도메인이 달라 next/image 허용 목록으로 관리하기 어렵다
                  <img
                    src={p.image}
                    alt=""
                    loading={featured ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br p-6 text-center text-lg font-bold ${
                      SOURCE_TINT[p.source] ?? "from-gray-100 to-gray-200 text-gray-700"
                    }`}
                    aria-hidden
                  >
                    {p.source}
                  </div>
                )}
              </div>

              <div className={`flex flex-1 flex-col ${featured ? "gap-2 p-5 sm:p-6" : "gap-1.5 p-4"}`}>
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{p.source}</span>
                  <time dateTime={p.date}>{dateFormat.format(new Date(p.date))}</time>
                </p>
                <h3
                  className={`font-semibold leading-snug text-gray-900 group-hover:underline ${
                    featured ? "text-lg sm:text-xl" : "line-clamp-2 text-base"
                  }`}
                >
                  {title}
                </h3>
                {summary && (
                  <p className={`text-sm leading-relaxed text-gray-600 ${featured ? "line-clamp-4" : "line-clamp-3"}`}>
                    {summary}
                  </p>
                )}
                {ko && p.titleKo && (
                  <p className="mt-auto line-clamp-1 pt-1 text-xs text-gray-400" lang="en">
                    {originalLabel} · {p.title}
                  </p>
                )}
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
