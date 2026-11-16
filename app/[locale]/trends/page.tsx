import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { rankRows, trendSeries, type RankRow } from "@/lib/trends";
import { readSnapshots, readUiPosts } from "@/lib/trends.server";
import { latestPosts } from "@/lib/uiTrends";
import CompareSlope from "./_components/CompareSlope";
import RankBump from "./_components/RankBump";
import TrendBarChart from "./_components/TrendBarChart";
import TrendLineChart from "./_components/TrendLineChart";
import UiTrendCards from "./_components/UiTrendCards";

const TABS = ["languages", "compare", "ui"] as const;
type Tab = (typeof TABS)[number];

/**
 * 채용 트렌드 — 상단 탭으로 전체 언어 · 국내/해외 비교 · UI 트렌드를 나눠 본다 (?tab=, JS 없이 동작).
 * 언어 수치는 매달 GitHub Actions가 모아 PR로 올리고 머지된 data/trends/github/*.json 그대로 (지어낸 값 없음).
 * UI 트렌드는 매일 수집되는 data/trends/ui/posts.json. 데이터가 없으면 안내만.
 */
export default async function TrendsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.find((t) => t === rawTab) ?? "languages";
  setRequestLocale(locale);
  const t = await getTranslations("trends");

  const snapshots = readSnapshots();
  const current = snapshots.at(-1);
  const previous = snapshots.at(-2) ?? null;
  const globalRows = current ? rankRows(current.globalNewRepos, previous?.globalNewRepos ?? null) : [];
  const koreaRows = current ? rankRows(current.koreaUsers, previous?.koreaUsers ?? null) : [];
  const series = trendSeries(snapshots, "globalNewRepos");
  const uiPosts = tab === "ui" ? latestPosts(readUiPosts()) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      <nav aria-label={t("tabs.label")} className="mt-6 flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((key) => (
          <Link
            key={key}
            href={{ pathname: "/trends", query: { tab: key } }}
            scroll={false}
            aria-current={key === tab ? "page" : undefined}
            className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-center text-[13px] font-medium transition sm:text-sm ${
              key === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {t(`tabs.${key}`)}
          </Link>
        ))}
      </nav>

      {tab === "ui" ? (
        <section className="mt-6">
          <p className="text-sm text-gray-500">{t("ui.hint")}</p>
          {uiPosts.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              {t("ui.empty")}
            </p>
          ) : (
            <div className="mt-6">
              <UiTrendCards posts={uiPosts} locale={locale} originalLabel={t("ui.original")} />
            </div>
          )}
        </section>
      ) : !current ? (
        <p className="mt-10 rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          {t("empty")}
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-gray-500">{t("description")}</p>
          <p className="mt-2 text-xs text-gray-400">
            {t("meta", {
              period: current.period,
              date: current.collectedAt.slice(0, 10),
            })}{" "}
            ·{" "}
            <a href={current.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-gray-600">
              {current.source}
            </a>
            {previous && <> · {t("compare", { period: previous.period })}</>}
          </p>

          {tab === "languages" ? (
            <>
              <Section
                title={t("global.title")}
                hint={t("global.hint")}
                rows={globalRows}
                unit={t("global.unit")}
                locale={locale}
                changeLabel={t("changeLabel")}
              />

              {snapshots.length >= 2 ? (
                <ChartSection title={t("charts.line.title")} hint={t("charts.line.hint")}>
                  <TrendLineChart series={series} />
                </ChartSection>
              ) : (
                <p className="mt-10 rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
                  {t("charts.needMore")}
                </p>
              )}

              {snapshots.length >= 3 && (
                <ChartSection title={t("charts.bump.title")} hint={t("charts.bump.hint")}>
                  <RankBump series={series} />
                </ChartSection>
              )}
            </>
          ) : (
            <>
              <ChartSection title={t("charts.compare.title")} hint={t("charts.compare.hint")}>
                <CompareSlope
                  global={globalRows}
                  korea={koreaRows}
                  leftLabel={t("charts.compare.global")}
                  rightLabel={t("charts.compare.korea")}
                />
              </ChartSection>
              <Section
                title={t("korea.title")}
                hint={t("korea.hint")}
                rows={koreaRows}
                unit={t("korea.unit")}
                locale={locale}
                changeLabel={t("changeLabel")}
              />
            </>
          )}

          {current.incomplete.length > 0 && (
            <p className="mt-6 text-xs text-amber-600">{t("incomplete")}</p>
          )}
        </>
      )}
    </main>
  );
}

function Section({
  title,
  hint,
  rows,
  unit,
  locale,
  changeLabel,
}: {
  title: string;
  hint: string;
  rows: RankRow[];
  unit: string;
  locale: string;
  changeLabel: string;
}) {
  const max = Math.max(...rows.map((r) => r.share), 0.0001);
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
      <div className="mt-4">
        <TrendBarChart rows={rows} unit={unit} locale={locale} />
      </div>
      <ol className="sr-only">
        {rows.map((r, i) => (
          <li key={r.language} className="grid grid-cols-[1.5rem_6rem_1fr_auto] items-center gap-3 text-sm">
            <span className="text-gray-400">{i + 1}</span>
            <span className="truncate font-medium text-gray-800">{r.language}</span>
            <span className="h-2 rounded-full bg-gray-100" aria-hidden>
              <span className="block h-2 rounded-full bg-gray-800" style={{ width: `${(r.share / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums text-gray-600">
              <span className="mr-2 hidden text-xs text-gray-400 sm:inline">
                {r.count.toLocaleString(locale)}
                {unit}
              </span>
              {(r.share * 100).toFixed(1)}%
              {r.change != null && (
                <span className="ml-2 inline-block w-14 text-xs">
                  <Change value={r.change} label={changeLabel} />
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChartSection({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
      <div className="mt-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function Change({ value, label }: { value: number; label: string }) {
  const p = value * 100;
  if (Math.abs(p) < 0.05) return <span aria-label={label}>–</span>;
  return (
    <span aria-label={label} className={p > 0 ? "text-emerald-600" : "text-rose-500"}>
      {p > 0 ? "▲" : "▼"}
      {Math.abs(p).toFixed(1)}%p
    </span>
  );
}
