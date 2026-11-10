/**
 * 채용공고 기술 트렌드 — 매달 기업 공개 채용 API(Greenhouse)로 모은 공고를 직군별로 집계한다.
 * 수집은 scripts/collect-jobs.ts, 반영은 사람이 PR을 확인하고 머지한다 (GitHub 트렌드와 같은 흐름).
 * 공고 본문은 저장하지 않는다 — 회사 · 제목 · 링크 · 추출한 기술만 (docs/2026-11-10-job-trends-plan.md 2장).
 */
import { TECH, type JobTech } from "@/lib/jobTech";

export const JOB_SOURCES = [
  { slug: "daangn", company: "당근" },
  { slug: "coupang", company: "쿠팡" },
  { slug: "krafton", company: "크래프톤" },
  { slug: "moloco", company: "몰로코" },
] as const;

export const ROLES = ["backend", "frontend", "mobile", "infra", "data"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  backend: "백엔드 · SW",
  frontend: "프론트엔드",
  mobile: "모바일",
  infra: "인프라 · 보안",
  data: "데이터 · AI",
};

// 제목만 본다 — 부서명("Data Governance", "Security")은 비개발 공고에도 붙어 있다
const DEV = /engineer|developer|개발자|엔지니어|scientist|software|프로그래머|devops|\bsre\b/i;
// 개발 단어가 있어도 개발 공고가 아닌 제목 (사업개발, 설비 엔지니어 등)
const NOT_DEV =
  /사업\s*개발|business|영업|sales|marketing|마케팅|maintenance|facilit|mechanical|electrical|설비|기계|hvac|냉난방|공조|hardware|하드웨어|robotics|로봇|product manager|프로덕트 매니저/i;
// 위에서부터 먼저 맞는 직군 — 보안은 "Mobile Security" · "Security Data"여도 보안, "Backend - 피드 인프라"는 백엔드
const ROLE_RULES: [Role, RegExp][] = [
  ["infra", /security|보안|vulnerability/i],
  ["mobile", /\bios\b|android|mobile|모바일|flutter|안드로이드/i],
  ["frontend", /front[\s-]?end|프론트|웹\s*개발|web (developer|engineer)/i], // "AI Frontier" 제외
  ["backend", /back[\s-]?end|백엔드|server|서버/i],
  ["infra", /devops|\bsre\b|site reliability|network|네트워크|\bdba\b/i],
  ["data", /data|데이터|machine learning|머신\s*러닝|딥\s*러닝|\bml\b|\bai\b|\bllm\b|research/i], // \b — "Fulfillment" 속 llm 제외
  ["infra", /infra|인프라|cloud|클라우드|platform/i],
  ["backend", DEV],
];

/** 공고 제목 → 직군. 개발 공고가 아니면 null */
export function classifyRole(title: string): Role | null {
  if (!DEV.test(title) || NOT_DEV.test(title)) return null;
  return ROLE_RULES.find(([, re]) => re.test(title))?.[0] ?? null;
}

const KOREA = /korea|seoul|서울|판교|성남|한국|busan|부산/i;
export const isKoreaLocation = (location: string) => KOREA.test(location);

export type JobPosting = { company: string; title: string; url: string; role: Role } & JobTech;
export type TechCount = { id: string; count: number };
export type RoleStat = { postings: number; required: TechCount[]; preferred: TechCount[] };

export type JobTrendSnapshot = {
  /** 수집한 달 "2026-11" — 그 시점에 열려 있던 공고 */
  period: string;
  collectedAt: string;
  source: "Greenhouse Job Board API";
  sources: { company: string; url: string; postings: number; error?: string }[];
  roles: Record<Role, RoleStat>;
  all: RoleStat;
  /** 구역 제목을 못 찾아 필수 · 우대 집계에서 뺀 공고 수 */
  unsectioned: number;
  postings: JobPosting[];
};

const count = (lists: string[][]): TechCount[] => {
  const m = new Map<string, number>();
  for (const ids of lists) for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  return [...m].map(([id, n]) => ({ id, count: n })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
};

const stat = (ps: JobPosting[]): RoleStat => ({
  postings: ps.length,
  required: count(ps.map((p) => p.required)),
  preferred: count(ps.map((p) => p.preferred)),
});

export function aggregateJobs(postings: JobPosting[]): Pick<JobTrendSnapshot, "roles" | "all" | "unsectioned"> {
  const roles = Object.fromEntries(ROLES.map((r) => [r, stat(postings.filter((p) => p.role === r))])) as Record<Role, RoleStat>;
  return { roles, all: stat(postings), unsectioned: postings.filter((p) => p.mentioned.length > 0).length };
}

const techName = (id: string) => TECH.find((t) => t.id === id)?.name ?? id;
const share = (c: TechCount | undefined, total: number) => (c && total > 0 ? c.count / total : 0);

/** "Kafka 19% (+2%p)" — 지난 수집이 있으면 비중 변화를 붙인다 */
function top(list: TechCount[], total: number, prev: RoleStat | null, kind: "required" | "preferred", n: number) {
  return list
    .slice(0, n)
    .map((c) => {
      const now = share(c, total);
      let change = "";
      if (prev && prev.postings > 0) {
        const d = now - share(prev[kind].find((x) => x.id === c.id), prev.postings);
        change = ` (${d >= 0 ? "+" : ""}${Math.round(d * 100)}%p)`;
      }
      return `${techName(c.id)} ${Math.round(now * 100)}%${change}`;
    })
    .join(" · ");
}

/** PR 본문 · 디스코드 알림용 요약 (디스코드 2000자 제한 안쪽) */
export function summarizeJobs(current: JobTrendSnapshot, previous: JobTrendSnapshot | null): string {
  const lines = [
    `## 채용공고 기술 트렌드 ${current.period}`,
    `국내 개발 공고 ${current.all.postings}건 — ${current.sources
      .map((s) => (s.error ? `${s.company} ⚠️수집 실패` : `${s.company} ${s.postings}`))
      .join(" · ")} (Greenhouse 공개 채용 API)`,
    previous ? `비교: ${previous.period} 대비 비중 변화` : "비교할 지난 데이터 없음 (첫 수집)",
    "",
    `**전체 우대 기술 Top 5:** ${top(current.all.preferred, current.all.postings, previous?.all ?? null, "preferred", 5)}`,
    `**전체 필수 기술 Top 5:** ${top(current.all.required, current.all.postings, previous?.all ?? null, "required", 5)}`,
    "",
    "**직군별** (공고 수 · 필수 / 우대)",
  ];
  for (const role of ROLES) {
    const s = current.roles[role];
    if (s.postings === 0) continue;
    const prev = previous?.roles[role] ?? null;
    lines.push(
      `- ${ROLE_LABEL[role]} ${s.postings}건${s.postings < 20 ? " (표본 적음)" : ""}`,
      `  필수 ${top(s.required, s.postings, prev, "required", 3) || "-"}`,
      `  우대 ${top(s.preferred, s.postings, prev, "preferred", 3) || "-"}`,
    );
  }
  if (current.unsectioned > 0) {
    lines.push("", `구역(자격 요건 · 우대 사항)을 못 찾은 공고 ${current.unsectioned}건은 필수 · 우대 집계에서 뺐습니다.`);
  }
  lines.push("", "확인 후 PR을 머지하면 반영됩니다. 이상하면 PR을 닫으세요.");
  return lines.join("\n");
}
