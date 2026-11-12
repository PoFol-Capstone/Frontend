"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Compass, RefreshCw } from "lucide-react";
import { generateTechReco, setTechRecoDone } from "@/lib/projects";
import type { Project, TechRecoItem } from "@/types/project";

type Props = {
  project: Project;
  onSaved: (project: Project) => void;
};

/** 기술 추천 탭 — (희망 직군 공고의 우대 기술 − 내 레포 기술) + 첫 단계. AI 호출 없음 */
export default function TechRecommendations({ project, onSaved }: Props) {
  const t = useTranslations("profile.projects.techReco");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reco = project.assets?.techReco;

  const generate = async () => {
    setBusy(true);
    setError(null);
    const res = await generateTechReco(project.uuid);
    setBusy(false);
    if (res.ok) onSaved(res.data);
    else setError(res.error || t("failed"));
  };

  if (!reco) {
    return (
      <div className="card animate-fade-in-up p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <Compass className="h-7 w-7 text-gray-500" />
        </div>
        <p className="font-semibold">{t("emptyTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{t("emptyDesc")}</p>
        <button type="button" onClick={generate} disabled={busy} className="btn btn-primary mt-6">
          <Compass className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} /> {busy ? t("running") : t("generate")}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex animate-fade-in-up flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
        <p className="mr-auto text-[13px] text-gray-600">
          {t("hint")}
          <span className="block text-xs text-gray-400">
            {reco.source === "fallback" ? t("sourceFallback") : t("sourceJobs", { period: reco.source.replace("jobs-", "") })}
          </span>
        </p>
        <button type="button" onClick={generate} disabled={busy} className="btn btn-secondary btn-sm">
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> {t("regenerate")}
        </button>
        {error && <p role="alert" className="w-full text-sm text-red-500">{error}</p>}
      </div>

      {reco.items.length === 0 ? (
        <p className="card p-10 text-center text-sm text-gray-500">{t("allCovered")}</p>
      ) : (
        reco.items.map((item, i) => (
          <RecoCard key={item.id} index={i} item={item} project={project} onSaved={onSaved} />
        ))
      )}
    </div>
  );
}

function RecoCard({ index, item, project, onSaved }: {
  index: number;
  item: TechRecoItem;
  project: Project;
  onSaved: (project: Project) => void;
}) {
  const t = useTranslations("profile.projects.techReco");
  const [busy, setBusy] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const res = await setTechRecoDone(project.uuid, item.id, !item.done);
    setBusy(false);
    if (res.ok) onSaved(res.data);
  };

  return (
    <section className={`card animate-fade-in-up transition-opacity ${item.done ? "opacity-60" : ""}`}
      style={{ animationDelay: `${60 + index * 60}ms` }}>
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-gray-100">
          {item.icon && !iconFailed ? (
            <Image unoptimized src={`https://cdn.simpleicons.org/${item.icon}`} alt="" width={24} height={24}
              onError={() => setIconFailed(true)} />
          ) : (
            <span className="text-sm font-bold text-gray-500">{item.name.slice(0, 2)}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-bold text-gray-900">{item.name}</h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600">{item.reason}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            <span className="font-medium text-gray-700">{t("firstStep")}</span> {item.firstStep}
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-gray-500">
          <input type="checkbox" checked={item.done} onChange={toggle} disabled={busy}
            className="h-4 w-4 accent-black" />
          {t("done")}
        </label>
      </div>
    </section>
  );
}
