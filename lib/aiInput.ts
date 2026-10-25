import type { ProjectInfo } from "@/app/api/ai/thumbnail/_lib";

/**
 * AI 라우트 요청 본문 검증.
 *
 * 클라이언트 body는 신뢰할 수 없다. provider까지 내려가서 TypeError로 500이 나거나
 * (`projectName` 누락, `techStack: [null]` 등) 과도한 입력이 유료 호출에 실리지 않도록,
 * provider를 부르기 전에 필수 문자열·배열 항목·개수·길이를 확인하고 400으로 거절한다.
 */

export const AI_INPUT_LIMITS = {
  projectName: 200,
  techStackItems: 50,
  techName: 50,
  projectDescription: 2_000,
  mainFeatures: 3_000,
  readmeText: 3_000,
} as const;

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProjectName(value: unknown): Parsed<string> {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: "projectName이 필요합니다." };
  }
  if (value.length > AI_INPUT_LIMITS.projectName) {
    return {
      ok: false,
      error: `projectName은 ${AI_INPUT_LIMITS.projectName}자 이하여야 합니다.`,
    };
  }
  return { ok: true, value: value.trim() };
}

/** 없으면 빈 배열. 있으면 비어 있지 않은 짧은 문자열들의 배열이어야 한다. */
export function parseTechStack(value: unknown): Parsed<string[]> {
  if (value === undefined || value === null) return { ok: true, value: [] };
  if (!Array.isArray(value)) {
    return { ok: false, error: "techStack은 문자열 배열이어야 합니다." };
  }
  if (value.length > AI_INPUT_LIMITS.techStackItems) {
    return {
      ok: false,
      error: `techStack은 ${AI_INPUT_LIMITS.techStackItems}개 이하여야 합니다.`,
    };
  }
  const names: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) {
      return { ok: false, error: "techStack 항목은 비어 있지 않은 문자열이어야 합니다." };
    }
    if (item.length > AI_INPUT_LIMITS.techName) {
      return {
        ok: false,
        error: `techStack 항목은 ${AI_INPUT_LIMITS.techName}자 이하여야 합니다.`,
      };
    }
    names.push(item.trim());
  }
  return { ok: true, value: names };
}

function parseOptionalText(
  value: unknown,
  field: string,
  max: number,
): Parsed<string | undefined> {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== "string") {
    return { ok: false, error: `${field}은(는) 문자열이어야 합니다.` };
  }
  if (value.length > max) {
    return { ok: false, error: `${field}은(는) ${max}자 이하여야 합니다.` };
  }
  return { ok: true, value };
}

export function parseThumbnailInput(body: unknown): Parsed<ProjectInfo> {
  if (!isRecord(body)) return { ok: false, error: "잘못된 요청 형식입니다." };

  const projectName = parseProjectName(body.projectName);
  if (!projectName.ok) return projectName;
  const techStack = parseTechStack(body.techStack);
  if (!techStack.ok) return techStack;
  const projectDescription = parseOptionalText(
    body.projectDescription,
    "projectDescription",
    AI_INPUT_LIMITS.projectDescription,
  );
  if (!projectDescription.ok) return projectDescription;
  const mainFeatures = parseOptionalText(
    body.mainFeatures,
    "mainFeatures",
    AI_INPUT_LIMITS.mainFeatures,
  );
  if (!mainFeatures.ok) return mainFeatures;

  return {
    ok: true,
    value: {
      projectName: projectName.value,
      techStack: techStack.value,
      projectDescription: projectDescription.value,
      mainFeatures: mainFeatures.value,
    },
  };
}

export function parseSummarizeInput(
  body: unknown,
): Parsed<{ projectName: string; readmeText: string; techStack: string[] }> {
  if (!isRecord(body)) return { ok: false, error: "잘못된 요청 형식입니다." };

  const projectName = parseProjectName(body.projectName);
  if (!projectName.ok) return projectName;
  const techStack = parseTechStack(body.techStack);
  if (!techStack.ok) return techStack;

  // README는 레포에서 읽어온 원문이라 길이가 제각각이다 — 거절하지 않고 앞부분만 쓴다
  const readmeText =
    typeof body.readmeText === "string"
      ? body.readmeText.slice(0, AI_INPUT_LIMITS.readmeText)
      : "";

  return {
    ok: true,
    value: { projectName: projectName.value, readmeText, techStack: techStack.value },
  };
}

// ---------- 포트폴리오 코치 ----------

export const COACH_INPUT_LIMITS = {
  targetRole: 50,
  surveyText: 200,
  strengths: 3,
  strengthItem: 30,
  solvedacId: 40,
  blogRss: 300,
} as const;

const README_DECORATIONS = ["badges", "stats", "streak", "header", "solvedac", "blog"] as const;
type ReadmeDecorationInput = (typeof README_DECORATIONS)[number];

function optionalShortText(
  value: unknown,
  field: string,
  max: number,
): Parsed<string | null> {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: `${field}은(는) 문자열이어야 합니다.` };
  if (value.length > max) return { ok: false, error: `${field}은(는) ${max}자 이하여야 합니다.` };
  const trimmed = value.trim();
  return { ok: true, value: trimmed || null };
}

export function parseDirectionInput(body: unknown): Parsed<{ targetRole: string | null }> {
  if (!isRecord(body)) return { ok: false, error: "잘못된 요청 형식입니다." };
  const targetRole = optionalShortText(body.targetRole, "targetRole", COACH_INPUT_LIMITS.targetRole);
  if (!targetRole.ok) return targetRole;
  return { ok: true, value: { targetRole: targetRole.value } };
}

export function parseProfileReadmeInput(body: unknown): Parsed<{
  targetRole: string | null;
  decorations: ReadmeDecorationInput[];
  solvedacId: string | null;
  blogRss: string | null;
}> {
  if (!isRecord(body)) return { ok: false, error: "잘못된 요청 형식입니다." };
  const targetRole = optionalShortText(body.targetRole, "targetRole", COACH_INPUT_LIMITS.targetRole);
  if (!targetRole.ok) return targetRole;

  const raw = body.decorations ?? [];
  if (!Array.isArray(raw) || raw.some((d) => !README_DECORATIONS.includes(d as ReadmeDecorationInput))) {
    return { ok: false, error: "decorations 값이 올바르지 않습니다." };
  }
  const decorations = [...new Set(raw as ReadmeDecorationInput[])];

  const solvedacId = optionalShortText(body.solvedacId, "solvedacId", COACH_INPUT_LIMITS.solvedacId);
  if (!solvedacId.ok) return solvedacId;
  if (solvedacId.value && !/^[A-Za-z0-9_]+$/.test(solvedacId.value)) {
    return { ok: false, error: "백준 아이디 형식이 올바르지 않습니다." };
  }
  const blogRss = optionalShortText(body.blogRss, "blogRss", COACH_INPUT_LIMITS.blogRss);
  if (!blogRss.ok) return blogRss;
  if (blogRss.value && !/^https:\/\//.test(blogRss.value)) {
    return { ok: false, error: "블로그 RSS 주소는 https로 시작해야 합니다." };
  }

  return {
    ok: true,
    value: { targetRole: targetRole.value, decorations, solvedacId: solvedacId.value, blogRss: blogRss.value },
  };
}

export function parseResumeInput(body: unknown): Parsed<{
  targetRole: string;
  interests: string;
  teamRole: string;
  strengths: string[];
  goal: string;
}> {
  if (!isRecord(body) || !isRecord(body.survey)) return { ok: false, error: "설문 응답이 필요합니다." };
  const survey = body.survey;
  const text = (field: string) =>
    optionalShortText(survey[field], field, COACH_INPUT_LIMITS.surveyText);

  const targetRole = text("targetRole");
  if (!targetRole.ok) return targetRole;
  if (!targetRole.value) return { ok: false, error: "희망 직무를 입력해주세요." };
  const interests = text("interests");
  if (!interests.ok) return interests;
  const teamRole = text("teamRole");
  if (!teamRole.ok) return teamRole;
  const goal = text("goal");
  if (!goal.ok) return goal;

  const rawStrengths = survey.strengths ?? [];
  if (!Array.isArray(rawStrengths) || rawStrengths.length > COACH_INPUT_LIMITS.strengths) {
    return { ok: false, error: `강점 키워드는 ${COACH_INPUT_LIMITS.strengths}개까지 입력할 수 있습니다.` };
  }
  const strengths: string[] = [];
  for (const item of rawStrengths) {
    if (typeof item !== "string" || item.length > COACH_INPUT_LIMITS.strengthItem) {
      return { ok: false, error: `강점 키워드는 ${COACH_INPUT_LIMITS.strengthItem}자 이하 문자열이어야 합니다.` };
    }
    if (item.trim()) strengths.push(item.trim());
  }

  return {
    ok: true,
    value: {
      targetRole: targetRole.value,
      interests: interests.value ?? "",
      teamRole: teamRole.value ?? "",
      strengths,
      goal: goal.value ?? "",
    },
  };
}
