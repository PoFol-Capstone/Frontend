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

// npm (package.json)
const NPM_MAP: Record<string, string> = {
  next: "Next.js",
  react: "React",
  "react-native": "React Native",
  vue: "Vue",
  nuxt: "Nuxt.js",
  "@angular/core": "Angular",
  svelte: "Svelte",
  express: "Express",
  "@nestjs/core": "NestJS",
  prisma: "Prisma",
  tailwindcss: "Tailwind CSS",
  mysql2: "MySQL",
  pg: "PostgreSQL",
  mongodb: "MongoDB",
  mongoose: "MongoDB",
  ioredis: "Redis",
  redis: "Redis",
};

export function detectFromPackageJson(content: string): string[] {
  // 남의 레포에서 받아온 파일이라 유효한 JSON이라는 보장이 없다 —
  // 파싱 실패는 "감지 결과 없음"으로 처리하고 요청 전체를 실패시키지 않는다.
  let pkg: { dependencies?: unknown; devDependencies?: unknown };
  try {
    pkg = JSON.parse(content);
  } catch {
    return [];
  }
  const allDeps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  return Object.entries(NPM_MAP)
    .filter(([key]) => key in allDeps)
    .map(([, label]) => label);
}

// Java (pom.xml / build.gradle)
export function detectFromPomXml(content: string): string[] {
  const found: string[] = [];
  if (/spring-boot/i.test(content)) found.push("Spring Boot");
  return found;
}

export function detectFromGradle(content: string): string[] {
  const found: string[] = [];
  if (/spring.?boot/i.test(content)) found.push("Spring Boot");
  return found;
}

// Python (requirements.txt / pyproject.toml)
export function detectFromPython(content: string): string[] {
  const lower = content.toLowerCase();
  const found: string[] = [];
  if (lower.includes("django")) found.push("Django");
  if (lower.includes("flask")) found.push("Flask");
  if (lower.includes("fastapi")) found.push("FastAPI");
  return found;
}


export function detectFromDockerfile(): string[] {
  return ["Docker"];
}

export function detectFromGithubActions(): string[] {
  return ["GitHub Actions"];
}

export function detectFromJenkinsfile(): string[] {
  return ["Jenkins"];
}

export function detectFromPubspec(content: string): string[] {
  if (/^name:/m.test(content) && content.includes("flutter")) return ["Flutter"];
  return [];
}
