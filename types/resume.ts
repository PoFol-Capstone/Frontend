// 백엔드 ResumeResponse와 대응. survey·content 구조는 프론트가 정하고 백엔드는 JSON으로 저장만 한다.

/** 문장 출처 — VERIFIED: GitHub 데이터로 뒷받침 / SELF: 본인 작성·수정 / AI: AI 작성 */
export type SentenceSource = "VERIFIED" | "SELF" | "AI";

export type Sentence = { text: string; source: SentenceSource };

export type ResumeSurvey = {
  targetRole: string;
  interests: string;
  teamRole: string;
  strengths: string[];
  goal: string;
};

export type ResumeProject = {
  name: string;
  repoFullName: string | null;
  role: Sentence;
  /** GitHub 수집값으로 만든 사실 (커밋 수·기간·협업 인원) */
  facts: Sentence[];
  highlights: Sentence[];
};

export type ResumeContent = {
  headline: Sentence;
  summary: Sentence[];
  projects: ResumeProject[];
  skills: string[];
};

export type ResumeSummary = { uuid: string; title: string; updatedAt: string };

export type Resume = {
  uuid: string;
  title: string;
  survey: ResumeSurvey;
  content: ResumeContent;
  showPhoto: boolean;
  createdAt: string;
  updatedAt: string;
};
