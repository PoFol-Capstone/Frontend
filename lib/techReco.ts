import { TECH, findTech, type Tech } from "@/lib/jobTech";
import { ROLE_LABEL, type JobTrendSnapshot, type Role } from "@/lib/jobTrends";
import type { RepoContext } from "@/lib/projectCard";
import type { ProjectAssets, TechRecoItem } from "@/types/project";

/**
 * 레포에서 쓰는 기술 감지 — 사전(lib/jobTech.ts)의 npm 의존성 + 설정 파일 · 언어 별칭 매칭. AI 없음.
 * shortcut: 루트 package.json만 본다 (모노레포의 하위 package.json은 못 봄), 오탐 신고가 나오면 하위까지 읽기
 */
export function detectedTech(repo: Pick<RepoContext["repo"], "files" | "languages">): Tech[] {
  const ids = new Set<string>();

  try {
    const pkg = JSON.parse(repo.files["package.json"] ?? "null") as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } | null;
    const deps = new Set(Object.keys({ ...pkg?.dependencies, ...pkg?.devDependencies }));
    for (const t of TECH) {
      if (t.npm?.some((n) => deps.has(n))) ids.add(t.id);
    }
  } catch {
    // package.json이 없거나 100k에서 잘려 JSON이 아닌 경우 — 별칭 매칭만 쓴다
  }

  const text = [
    Object.keys(repo.languages).join(" "),
    repo.files["build.gradle"],
    repo.files["pom.xml"],
    repo.files["requirements.txt"],
    repo.files["pyproject.toml"],
    repo.files["pubspec.yaml"],
  ]
    .filter(Boolean)
    .join("\n");
  for (const id of findTech(text)) ids.add(id);

  return TECH.filter((t) => ids.has(t.id));
}

// ── 기술 추천 (AI 호출 없음 — 규칙 + 큐레이션 텍스트) ────────────────

/** 프로필에 적은 희망 직군 라벨("백엔드 개발자" 등) → 공고 집계 직군 */
export function resolveRole(targetRoleLabel: string | null): Role | null {
  if (!targetRoleLabel) return null;
  const label = targetRoleLabel.toLowerCase();
  if (/프론트|front|웹/.test(label)) return "frontend";
  if (/모바일|mobile|ios|android|안드로이드|flutter/.test(label)) return "mobile";
  if (/데브옵스|devops|인프라|infra|클라우드|cloud|보안|security|sre/.test(label)) return "infra";
  if (/데이터|data|\bai\b|\bml\b|머신|딥러닝|인공지능/.test(label)) return "data";
  if (/백엔드|back|서버|server|풀스택|full/.test(label)) return "backend";
  return null;
}

/** 공고 스냅샷이 아직 없을 때의 직군별 우대 기술 (사전 큐레이션) — 수집되면 자동으로 집계값을 쓴다 */
export const FALLBACK_PREFERRED: Record<Role | "common", string[]> = {
  frontend: ["testing", "cicd", "typescript", "react-query", "ssr", "web-performance", "a11y", "docker"],
  backend: ["testing", "cicd", "docker", "redis", "mysql", "jpa", "msa", "linux"],
  mobile: ["testing", "cicd", "rest", "graphql", "docker", "git"],
  data: ["testing", "cicd", "docker", "airflow", "spark", "llm", "linux"],
  infra: ["docker", "kubernetes", "terraform", "cicd", "linux", "testing"],
  common: ["testing", "cicd", "docker", "typescript", "linux"],
};

/** 추천 기술의 "이 프로젝트에 붙이는 첫 단계" — AI가 쓰던 문장을 큐레이션 텍스트로 대체 */
const TECH_FIRST_STEP: Record<string, string> = {
  testing: "버그를 고친 커밋의 로직 하나를 골라 단위 테스트부터 붙여 보세요. 재발 방지가 그대로 면접 소재가 돼요.",
  cicd: "GitHub Actions로 push마다 테스트 · 빌드를 돌리는 워크플로 파일 하나부터 추가해 보세요.",
  docker: "Dockerfile 하나로 로컬 실행을 컨테이너로 옮겨 보세요. 배포 질문의 답이 생겨요.",
  typescript: "자주 고치는 파일 몇 개부터 .ts로 바꾸고 strict 옵션을 켜 보세요.",
  "react-query": "fetch 후 setState 하는 화면 하나를 useQuery로 바꿔 캐싱 · 로딩 상태를 맡겨 보세요.",
  ssr: "트래픽이 많은 첫 화면 하나만 서버 렌더링으로 옮기고 전후 로딩을 비교해 보세요.",
  "web-performance": "Lighthouse로 첫 화면을 측정하고 가장 큰 이미지 · 번들부터 줄여 보세요.",
  a11y: "키보드만으로 주요 화면을 써 보고, 포커스가 안 가는 버튼부터 고쳐 보세요.",
  redis: "가장 자주 읽히는 조회 하나에 캐시를 붙이고 TTL · 무효화 기준을 정해 보세요.",
  mysql: "지금 저장 방식에서 자주 조회되는 데이터 하나를 관계형 테이블로 옮겨 보세요.",
  jpa: "SQL 직접 작성 구간 하나를 엔티티 · 리포지토리로 바꾸고 생성 쿼리를 확인해 보세요.",
  msa: "가장 독립적인 기능 하나를 별도 모듈로 분리하는 것부터 — 서비스 분리는 그다음이에요.",
  kubernetes: "로컬 k3d · minikube에 지금 컨테이너를 올려 디플로이먼트 하나를 써 보세요.",
  terraform: "지금 수동으로 만든 인프라 하나(버킷 · DB)를 코드로 옮겨 보세요.",
  linux: "배포 서버에 직접 들어가 로그 확인 · 프로세스 관리를 명령어로 해 보세요.",
  airflow: "주기 실행 스크립트 하나를 DAG로 옮겨 실패 알림을 받아 보세요.",
  graphql: "화면 하나가 쓰는 REST 호출 2~3개를 쿼리 하나로 합쳐 보세요.",
  git: "브랜치 전략(main + feature)과 커밋 메시지 규칙부터 정해 보세요.",
};

const firstStepOf = (tech: Tech) =>
  TECH_FIRST_STEP[tech.id] ?? `${tech.name}을(를) 이 프로젝트의 작은 기능 하나에 먼저 적용해 보고, 전후 차이를 기록해 보세요.`;

export type TechRecoAsset = NonNullable<ProjectAssets["techReco"]>;

export const MAX_RECO = 5;

/**
 * 추천 = (직군 우대 기술) − (레포에서 감지된 기술). AI 없음.
 * 공고 스냅샷이 있으면 집계 상위를, 없으면 사전 폴백을 쓴다. 이전 [해봤어요] 체크는 유지한다.
 */
export function buildTechReco(
  context: Pick<RepoContext, "repo">,
  snapshot: JobTrendSnapshot | null,
  targetRoleLabel: string | null,
  previousItems?: TechRecoItem[],
): TechRecoAsset {
  const role = resolveRole(targetRoleLabel);
  const detected = new Set(detectedTech(context.repo).map((t) => t.id));
  // 레포 점검으로 확인되는 것은 감지에 더한다 (java 레포는 npm 감지가 없어서)
  if (context.repo.present[".github/workflows"]) detected.add("cicd");
  if (context.repo.present.Dockerfile) detected.add("docker");

  const stat = snapshot ? (role ? snapshot.roles[role] : snapshot.all) : null;
  const preferred: { id: string; count?: number }[] = stat
    ? stat.preferred.map((t) => ({ id: t.id, count: t.count }))
    : FALLBACK_PREFERRED[role ?? "common"].map((id) => ({ id }));

  const done = new Map((previousItems ?? []).map((i) => [i.id, i.done]));
  const items: TechRecoItem[] = [];
  for (const { id, count } of preferred) {
    if (items.length >= MAX_RECO) break;
    if (detected.has(id)) continue;
    const tech = TECH.find((t) => t.id === id);
    if (!tech) continue;
    items.push({
      id,
      name: tech.name,
      icon: tech.icon ?? null,
      reason: stat
        ? `${role ? ROLE_LABEL[role] : "전체"} 공고 ${stat.postings}건 중 우대 ${count}건`
        : fallbackReason(id, context.repo.present),
      firstStep: firstStepOf(tech),
      done: done.get(id) ?? false,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    role,
    source: snapshot ? `jobs-${snapshot.period}` : "fallback",
    items,
  };
}

function fallbackReason(id: string, present: Record<string, boolean>): string {
  if (id === "testing") return "레포에 테스트가 없거나 적어요 — 공고 우대 단골 항목";
  if (id === "cicd" && !present[".github/workflows"]) return "레포에 CI 설정이 없어요";
  if (id === "docker" && !present.Dockerfile) return "레포에 Docker 설정이 없어요";
  return "이 직군 공고에서 자주 우대돼요 (사전 기준 — 공고 수집 전)";
}
