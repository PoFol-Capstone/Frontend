import OpenAI from "openai";
import type { ProjectInfo, ThumbnailProvider } from "./types";

function buildPrompt(info: ProjectInfo): string {
  const stack = info.techStack.slice(0, 8).join(", ");
  return [
    `A clean modern thumbnail illustration for a software project named "${info.projectName}".`,
    stack && `Built with: ${stack}.`,
    info.projectDescription && `Project summary: ${info.projectDescription}`,
    "Style: flat vector illustration, soft pastel gradient background, minimal shapes, no text, no logos, no watermarks, 16:9 composition.",
  ]
    .filter(Boolean)
    .join(" ");
}

export const openaiProvider: ThumbnailProvider = {
  async generate(info) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: buildPrompt(info),
      size: "1536x1024",
      n: 1,
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("이미지 생성 결과가 비어 있습니다.");
    }

    return {
      buffer: Buffer.from(b64, "base64"),
      contentType: "image/png",
      extension: "png",
    };
  },
};
