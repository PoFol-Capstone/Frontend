import { NextRequest, NextResponse } from "next/server";

function parseReadme(markdown: string): {
  description: string;
  mainFeatures: string;
} {
  const lines = markdown.split("\n");

  // 첫 번째 단락: h1 제목 다음에 오는 첫 번째 비어있지 않은 일반 텍스트
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

  // 주요 기능 섹션: 기능/Features/주요 기능 헤딩 아래 목록 추출
  const featureHeadings = /^#{1,3}\s.*(기능|feature|function|주요|핵심).*/i;
  let inFeatureSection = false;
  const featureLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      if (featureHeadings.test(trimmed)) {
        inFeatureSection = true;
      } else if (inFeatureSection) {
        break; // 다음 섹션 시작 → 종료
      }
      continue;
    }
    if (inFeatureSection && (trimmed.startsWith("-") || trimmed.startsWith("*") || /^\d+\./.test(trimmed))) {
      featureLines.push(trimmed.replace(/^[-*]\s*|\d+\.\s*/, "").trim());
    }
  }

  const mainFeatures = featureLines.join("\n");

  return { description, mainFeatures };
}

export async function GET(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const fullName = searchParams.get("repo"); // "owner/repo" 형식
  if (!fullName) {
    return NextResponse.json(
      { error: "repo 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
  const base = `https://api.github.com/repos/${fullName}`;

  const [repoRes, langRes, readmeRes, pkgRes] = await Promise.all([
    fetch(base, { headers }),
    fetch(`${base}/languages`, { headers }),
    fetch(`${base}/readme`, { headers }),
    fetch(`${base}/contents/package.json`, { headers }),
  ]);

  if (!repoRes.ok) {
    return NextResponse.json(
      { error: "레포지토리 정보를 가져오지 못했습니다." },
      { status: repoRes.status },
    );
  }

  const repoData = await repoRes.json();
  const langData = langRes.ok ? await langRes.json() : {};

  // package.json에서 프레임워크 감지
  const FRAMEWORK_MAP: Record<string, string> = {
    next: "Next.js", react: "React", vue: "Vue", nuxt: "Nuxt",
    "@angular/core": "Angular", svelte: "Svelte", astro: "Astro",
    remix: "Remix", gatsby: "Gatsby", express: "Express",
    fastify: "Fastify", nestjs: "@nestjs/core", koa: "Koa",
    "spring-boot": "Spring Boot", django: "Django", flask: "Flask",
    prisma: "Prisma", drizzle: "Drizzle", mongoose: "Mongoose",
    tailwindcss: "Tailwind CSS", "@mui/material": "MUI",
    "framer-motion": "Framer Motion",
  };
  const frameworks: string[] = [];
  if (pkgRes.ok) {
    const pkgJson = await pkgRes.json();
    const pkgText = Buffer.from(pkgJson.content, "base64").toString("utf-8");
    const pkg = JSON.parse(pkgText);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [pkg_name, label] of Object.entries(FRAMEWORK_MAP)) {
      if (pkg_name in allDeps) frameworks.push(label);
    }
  }

  let description = (repoData.description as string) ?? "";
  let mainFeatures = "";
  let readmeText = "";

  if (readmeRes.ok) {
    const readmeJson = await readmeRes.json();
    readmeText = Buffer.from(readmeJson.content, "base64").toString("utf-8");
    const parsed = parseReadme(readmeText);
    if (parsed.description) description = parsed.description;
    mainFeatures = parsed.mainFeatures;
  }

  return NextResponse.json({
    projectName: repoData.name as string,
    projectDescription: description,
    mainFeatures,
    techStack: frameworks.length > 0 ? frameworks : Object.keys(langData),
    deployUrl: (repoData.homepage as string) ?? "",
    readmeText,
  });
}
