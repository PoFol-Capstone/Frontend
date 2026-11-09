import { getTranslations, setRequestLocale } from "next-intl/server";
import { rankRows, type RankRow } from "@/lib/trends";
import { readSnapshots } from "@/lib/trends.server";

/**
 * 채용 트렌드 — 매달 GitHub Actions가 모아 PR로 올리고, 머지된 data/trends/github/*.json만 보여준다.
 * 수치는 파일 그대로 (지어낸 값 없음). 데이터가 없으면 안내만.
 */
export default async function TrendsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("trends");

  const snapshots = readSnapshots();
  const current = snapshots.at(-1);
  const previous = snapshots.at(-2) ?? null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-gray-500">{t("description")}</p>

      {!current ? (
        <p className="mt-10 rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          {t("empty")}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-gray-400">
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

          <Section
            title={t("global.title")}
            hint={t("global.hint")}
            rows={rankRows(current.globalNewRepos, previous?.globalNewRepos ?? null)}
            unit={t("global.unit")}
            locale={locale}
            changeLabel={t("changeLabel")}
          />
          <Section
            title={t("korea.title")}
            hint={t("korea.hint")}
            rows={rankRows(current.koreaUsers, previous?.koreaUsers ?? null)}
            unit={t("korea.unit")}
            locale={locale}
            changeLabel={t("changeLabel")}
          />

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
      <ol className="mt-4 space-y-2">
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
