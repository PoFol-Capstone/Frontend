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

export function detectFromPackageJson(content: string): string[] {
  const pkg = JSON.parse(content);
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  return Object.entries(NPM_MAP)
    .filter(([key]) => key in allDeps)
    .map(([, label]) => label);
}

// Java (pom.xml / build.gradle)
export function detectFromPomXml(content: string): string[] {
  const found: string[] = [];
  if (/spring-boot/i.test(content)) found.push("Spring Boot");
  if (/quarkus/i.test(content)) found.push("Quarkus");
  if (/micronaut/i.test(content)) found.push("Micronaut");
  return found;
}

export function detectFromGradle(content: string): string[] {
  const found: string[] = [];
  if (/spring.?boot/i.test(content)) found.push("Spring Boot");
  if (/quarkus/i.test(content)) found.push("Quarkus");
  if (/micronaut/i.test(content)) found.push("Micronaut");
  return found;
}

// Python (requirements.txt / pyproject.toml)
export function detectFromPython(content: string): string[] {
  const lower = content.toLowerCase();
  const found: string[] = [];
  if (lower.includes("django")) found.push("Django");
  if (lower.includes("flask")) found.push("Flask");
  if (lower.includes("fastapi")) found.push("FastAPI");
  if (lower.includes("tornado")) found.push("Tornado");
  if (lower.includes("aiohttp")) found.push("aiohttp");
  return found;
}

// Ruby (Gemfile)
export function detectFromGemfile(content: string): string[] {
  const lower = content.toLowerCase();
  const found: string[] = [];
  if (lower.includes("rails")) found.push("Rails");
  if (lower.includes("sinatra")) found.push("Sinatra");
  if (lower.includes("hanami")) found.push("Hanami");
  return found;
}

// Go (go.mod)
export function detectFromGoMod(content: string): string[] {
  const found: string[] = [];
  if (content.includes("gin-gonic/gin")) found.push("Gin");
  if (content.includes("labstack/echo")) found.push("Echo");
  if (content.includes("gofiber/fiber")) found.push("Fiber");
  if (content.includes("go-chi/chi")) found.push("Chi");
  if (content.includes("beego/beego")) found.push("Beego");
  return found;
}

// Rust (Cargo.toml)
export function detectFromCargoToml(content: string): string[] {
  const found: string[] = [];
  if (content.includes("actix")) found.push("Actix");
  if (content.includes("axum")) found.push("Axum");
  if (content.includes("rocket")) found.push("Rocket");
  if (content.includes("warp")) found.push("Warp");
  return found;
}
