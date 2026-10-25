import { getTranslations } from "next-intl/server";
import { groupLanguages, OTHER_LANGUAGE, parseDirection } from "@/lib/coachContent";
import type { PublicGitHub } from "@/types/githubAnalysis";

/** 타인 프로필의 GitHub 요약 — 본인이 공개로 켠 항목과 대표 프로젝트만 (기본 비공개) */
export default async function PublicGitHubSection({ data }: { data: PublicGitHub }) {
  const t = await getTranslations("profile.github");
  const direction = parseDirection(data.direction);
  const hasAnything =
    data.featuredRepos.length > 0 || data.summary || data.languages || data.topRepos || direction;
  if (!hasAnything) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold">{t("publicHeading")}</h2>

      {data.featuredRepos.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-3">
          {data.featuredRepos.map((repo) => (
            <li key={repo.fullName} className="rounded-2xl border border-gray-200 p-5">
              <a href={`https://github.com/${repo.fullName}`} target="_blank" rel="noopener noreferrer"
                className="font-semibold hover:underline">
                {repo.name}
              </a>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{repo.description ?? ""}</p>
              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                {repo.language && <span>{repo.language}</span>}
                <span>★ {repo.stars}</span>
                {repo.homepage && (
                  <a href={repo.homepage} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                    {t("demo")}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.summary && (
        <p className="text-sm text-gray-600">
          {t("publicSummary", {
            owned: data.summary.repoCount.owned,
            stars: data.summary.totalStars,
            active: data.summary.activeRepos90d,
          })}
        </p>
      )}

      {data.languages && data.languages.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-xs">
          {groupLanguages(data.languages).map((l) => (
            <li key={l.name} className="rounded-full bg-gray-100 px-3 py-1">
              {l.name === OTHER_LANGUAGE ? t("otherLanguage") : l.name} {Math.round(l.ratio * 100)}%
            </li>
          ))}
        </ul>
      )}

      {direction && <p className="text-sm leading-6">{direction.summary}</p>}

      {data.topRepos && data.topRepos.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-xs text-gray-600">
          {data.topRepos.map((r) => (
            <li key={r.fullName} className="rounded-full border border-gray-300 px-3 py-1">{r.fullName}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
