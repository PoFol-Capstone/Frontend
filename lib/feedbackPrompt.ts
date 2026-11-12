import { CARD_SLOTS, PROBLEM_FIELDS, type Project } from "@/types/project";

/**
 * 탭 내용을 ChatGPT · Claude에 붙여넣어 피드백 받을 프롬프트로 조립한다 (순수 함수, AI 호출 없음).
 * 클라이언트가 이미 가진 데이터만 쓴다 — 레포 코드는 포함하지 않는다.
 */

const SLOT_TITLES: Record<(typeof CARD_SLOTS)[number], string> = {
  oneLiner: "한 줄 소개",
  myRole: "내 역할 · 기여",
  features: "핵심 기능",
  techReasons: "기술 선택 이유",
  problemSolving: "문제 해결",
  results: "결과 · 지표",
  retrospective: "회고",
};

const PROBLEM_TITLES: Record<(typeof PROBLEM_FIELDS)[number], string> = {
  problem: "문제",
  cause: "원인",
  solution: "해결",
  result: "결과",
};

const header = (project: Project, ask: string) =>
  `너는 신입 개발자 채용 면접관이자 시니어 개발자야. 아래는 내 프로젝트 "${project.repoFullName}" 정리 내용이야.\n${ask}\n\n---\n`;

export function cardFeedbackPrompt(project: Project): string {
  const parts: string[] = [];
  for (const slot of CARD_SLOTS) {
    const { value } = project.card[slot];
    let text = "";
    if (typeof value === "string") {
      text = value.trim();
    } else if (Array.isArray(value)) {
      text = value
        .map((f) => `- ${f.name}: ${f.description}${f.evidence.length ? ` (${f.evidence.join(", ")})` : ""}`)
        .join("\n");
    } else if (value) {
      text = PROBLEM_FIELDS.filter((f) => value[f]?.trim())
        .map((f) => `- ${PROBLEM_TITLES[f]}: ${value[f].trim()}`)
        .join("\n");
    }
    if (text) parts.push(`## ${SLOT_TITLES[slot]}\n${text}`);
  }
  return (
    header(project, "면접관 관점에서 칸마다 ① 더 구체적으로 만들 질문 ② 약해 보이는 부분 ③ 고칠 표현을 피드백해 줘.") +
    parts.join("\n\n")
  );
}

export function explainFeedbackPrompt(project: Project): string {
  const data = project.assets?.explain?.data;
  if (!data) return "";
  const parts: string[] = [];
  if (data.structure.length) {
    parts.push("## 폴더 구조\n" + data.structure.map((s) => `- ${s.dir}: ${s.role}`).join("\n"));
  }
  for (const flow of data.flows) {
    parts.push(`## 요청 흐름 — ${flow.name}\n` + flow.steps.map((s, i) => `${i + 1}. ${s.label} (${s.path})`).join("\n"));
  }
  if (data.keyFiles.length) {
    parts.push("## 주요 파일\n" + data.keyFiles.map((k) => `- ${k.path}: ${k.role}`).join("\n"));
  }
  if (data.designChoices.length) {
    parts.push(
      "## 설계 선택\n" +
        data.designChoices.map((d) => `- ${d.topic}${d.isGuess ? " (추정)" : ""}: ${d.claim}`).join("\n"),
    );
  }
  return (
    header(project, "이 구현 설명을 보고 ① 면접에서 파고들 만한 설계 질문 ② 설명이 빈 부분 ③ 개선할 구조를 피드백해 줘.") +
    parts.join("\n\n")
  );
}

export function interviewFeedbackPrompt(project: Project): string {
  const questions = project.assets?.interview?.questions ?? [];
  const practiced = questions.filter((q) => q.answer?.trim());
  if (practiced.length === 0) return "";
  const parts = practiced.map(
    (q) => `## Q. ${q.question}\n내 답변: ${q.answer!.trim()}\n(좋은 답의 요소: ${q.goodAnswerPoints.join(" / ")})`,
  );
  return (
    header(project, "면접 질문에 대한 내 답변이야. 답변마다 ① 빠진 핵심 ② 더 좋은 표현 ③ 꼬리 질문을 피드백해 줘.") +
    parts.join("\n\n")
  );
}
