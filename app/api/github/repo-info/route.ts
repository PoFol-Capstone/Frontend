import { NextRequest, NextResponse } from "next/server";
import {
  parseReadme,
  detectFromPackageJson,
  detectFromPomXml,
  detectFromGradle,
  detectFromPython,
  detectFromGemfile,
  detectFromGoMod,
  detectFromCargoToml,
} from "@/lib/github";

const EXTRA_FILES = [
  "pom.xml",
  "build.gradle",
  "requirements.txt",
  "pyproject.toml",
  "Gemfile",
  "go.mod",
  "Cargo.toml",
] as const;

type ExtraFile = (typeof EXTRA_FILES)[number];

export async function GET(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const fullName = searchParams.get("repo");
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

  const [repoRes, langRes, readmeRes, pkgRes, ...extraRes] = await Promise.all([
    fetch(base, { headers }),
    fetch(`${base}/languages`, { headers }),
    fetch(`${base}/readme`, { headers }),
    fetch(`${base}/contents/package.json`, { headers }),
    ...EXTRA_FILES.map((f) => fetch(`${base}/contents/${f}`, { headers })),
  ]);

  if (!repoRes.ok) {
    return NextResponse.json(
      { error: "레포지토리 정보를 가져오지 못했습니다." },
      { status: repoRes.status },
    );
  }

  const repoData = await repoRes.json();
  const langData = langRes.ok ? await langRes.json() : {};

  // 각 파일 내용을 병렬로 디코딩
  const fileContents = await Promise.all(
    EXTRA_FILES.map(async (file, i) => {
      const res = extraRes[i];
      if (!res.ok) return [file, null] as const;
      const json = await res.json();
      const text = Buffer.from(json.content as string, "base64").toString("utf-8");
      return [file, text] as const;
    }),
  );
  const fileMap = Object.fromEntries(fileContents) as Record<ExtraFile, string | null>;

  const frameworkSet = new Set<string>();

  if (pkgRes.ok) {
    const json = await pkgRes.json();
    const text = Buffer.from(json.content as string, "base64").toString("utf-8");
    detectFromPackageJson(text).forEach((f) => frameworkSet.add(f));
  }
  if (fileMap["pom.xml"]) detectFromPomXml(fileMap["pom.xml"]).forEach((f) => frameworkSet.add(f));
  if (fileMap["build.gradle"]) detectFromGradle(fileMap["build.gradle"]).forEach((f) => frameworkSet.add(f));
  if (fileMap["requirements.txt"]) detectFromPython(fileMap["requirements.txt"]).forEach((f) => frameworkSet.add(f));
  if (fileMap["pyproject.toml"]) detectFromPython(fileMap["pyproject.toml"]).forEach((f) => frameworkSet.add(f));
  if (fileMap["Gemfile"]) detectFromGemfile(fileMap["Gemfile"]).forEach((f) => frameworkSet.add(f));
  if (fileMap["go.mod"]) detectFromGoMod(fileMap["go.mod"]).forEach((f) => frameworkSet.add(f));
  if (fileMap["Cargo.toml"]) detectFromCargoToml(fileMap["Cargo.toml"]).forEach((f) => frameworkSet.add(f));

  const frameworks = [...frameworkSet];

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
