export function parseReadme(markdown: string): {
  description: string;
  mainFeatures: string;
} {
  const lines = markdown.split("\n");

  let description = "";
  let passedTitle = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!passedTitle) {
      if (trimmed.startsWith("#")) passedTitle = true;
      continue;
    }
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("!")) {
      description = trimmed;
      break;
    }
  }

  const featureHeadings = /^#{1,3}\s.*(기능|feature|function|주요|핵심).*/i;
  let inFeatureSection = false;
  const featureLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      if (featureHeadings.test(trimmed)) {
        inFeatureSection = true;
      } else if (inFeatureSection) {
        break;
      }
      continue;
    }
    if (
      inFeatureSection &&
      (trimmed.startsWith("-") ||
        trimmed.startsWith("*") ||
        /^\d+\./.test(trimmed))
    ) {
      featureLines.push(trimmed.replace(/^[-*]\s*|\d+\.\s*/, "").trim());
    }
  }

  return { description, mainFeatures: featureLines.join("\n") };
}

export const FRAMEWORK_MAP: Record<string, string> = {
  next: "Next.js",
  react: "React",
  vue: "Vue",
  nuxt: "Nuxt",
  "@angular/core": "Angular",
  svelte: "Svelte",
  astro: "Astro",
  remix: "Remix",
  gatsby: "Gatsby",
  express: "Express",
  fastify: "Fastify",
  "@nestjs/core": "NestJS",
  koa: "Koa",
  prisma: "Prisma",
  drizzle: "Drizzle",
  mongoose: "Mongoose",
  tailwindcss: "Tailwind CSS",
  "@mui/material": "MUI",
  "framer-motion": "Framer Motion",
};
