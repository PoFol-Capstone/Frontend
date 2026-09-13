import OpenAI from "openai";
import type { ProjectInfo, ThumbnailProvider } from "./types";

const WIDTH = 1200;
const HEIGHT = 630;

function buildPrompt(info: ProjectInfo): string {
  const stack = info.techStack.slice(0, 8).join(", ");
  return [
    `Create a clean modern thumbnail illustration for a software project named "${info.projectName}".`,
    stack && `Built with: ${stack}.`,
    info.projectDescription && `Project summary: ${info.projectDescription}`,
    `Style: flat vector illustration, soft pastel gradient background, minimal geometric shapes, no photorealism.`,
    `The project name may appear once as short, large, centered text.`,
    `Respond with ONLY a single self-contained SVG document (starting with "<svg" and ending with "</svg>"). No markdown code fences, no explanation, no <script>, no <foreignObject>, no external references (no <image>, no url() to external hosts).`,
    `The root <svg> must have width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}".`,
  ]
    .filter(Boolean)
    .join(" ");
}

function extractSvg(raw: string): string {
  const fenced = raw.match(/```(?:svg|xml)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const match = candidate.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) {
    throw new Error("이미지 생성 결과가 비어 있습니다.");
  }
  return match[0];
}

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
}

export const openaiProvider: ThumbnailProvider = {
  async generate(info) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildPrompt(info) }],
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const svg = sanitizeSvg(extractSvg(raw));

    return {
      buffer: Buffer.from(svg, "utf-8"),
      contentType: "image/svg+xml",
      extension: "svg",
    };
  },
};
