import path from "node:path";
import { readSnapshots } from "@/lib/trends.server";

/**
 * 자주 나오는 면접 질문 주제 — scripts/collect-interview-themes.ts가 공개 면접 질문 모음 레포에서
 * 매달 모아 data/trends/interview/YYYY-MM.json으로 저장한다 (항목마다 출처 레포를 보존).
 * 면접 질문 생성 라우트가 "이 레포 코드로 답할 수 있는 주제를 우선 출제"하는 데 쓴다.
 */

export type ThemeSource = { repo: string; url: string; license: string | null; themes: number; fetchedAt: string };
export type InterviewTheme = { theme: string; count: number; source: string };
export type InterviewThemeSnapshot = {
  period: string;
  collectedAt: string;
  sources: ThemeSource[];
  /** 기술 id(lib/jobTech.ts) → 그 기술에서 자주 나오는 주제 */
  themes: Record<string, InterviewTheme[]>;
};

export const INTERVIEW_THEMES_DIR = path.join(process.cwd(), "data", "trends", "interview");

/** 스냅샷이 아직 없을 때의 최소 기본 주제 — 수집이 실패해도 기능은 코드 근거만으로 동작한다 */
const DEFAULT_THEMES: Record<string, string[]> = {
  react: ["리렌더링 최적화", "상태 관리 선택 이유"],
  nextjs: ["SSR과 CSR의 차이", "라우팅 · 데이터 페칭 방식"],
  typescript: ["타입을 좁히는 방법", "any를 피하는 이유"],
  spring: ["DI와 IoC", "트랜잭션 경계"],
  jpa: ["N+1 문제", "영속성 컨텍스트"],
  redis: ["캐시 무효화 전략", "Redis를 쓴 이유"],
};

export function latestThemeSnapshot(): InterviewThemeSnapshot | null {
  return readSnapshots<InterviewThemeSnapshot>(INTERVIEW_THEMES_DIR).at(-1) ?? null;
}

/**
 * 감지된 기술의 주제 목록 (프롬프트 입력 · 검증 화이트리스트).
 * 공고 자격요건 키워드(lib/jobTrends.ts 집계)를 주제 가중치로 쓰는 확장 지점 — 필요해지면 여기서 count에 반영
 */
export function themesFor(
  techIds: string[],
  snapshot: InterviewThemeSnapshot | null,
  maxTotal = 20,
): string[] {
  const out: string[] = [];
  for (const id of techIds) {
    const themes = snapshot
      ? (snapshot.themes[id] ?? []).map((t) => t.theme)
      : (DEFAULT_THEMES[id] ?? []);
    for (const theme of themes) {
      if (out.length >= maxTotal) return out;
      if (!out.includes(theme)) out.push(theme);
    }
  }
  return out;
}

/** 화면 하단 출처 표기용 */
export function themeSources(snapshot: InterviewThemeSnapshot | null): { repo: string; url: string }[] {
  return (snapshot?.sources ?? []).filter((s) => s.themes > 0).map((s) => ({ repo: s.repo, url: s.url }));
}
