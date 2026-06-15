import { NextRequest, NextResponse } from "next/server";
import {
  parseReadme,
  detectFromPackageJson,
  detectFromPomXml,
  detectFromGradle,
  detectFromPython,
  detectFromDockerfile,
  detectFromGithubActions,
  detectFromJenkinsfile,
  detectFromPubspec,
} from "@/lib/github";
import { http } from "@/lib/http.server";

const KNOWN_LANGUAGES = new Set([
  "JavaScript", "TypeScript", "Python", "Java", "Kotlin",
  "Swift", "Dart", "Go", "C", "C++", "C#",
]);

const EXTRA_FILES = [
  "pom.xml",
  "build.gradle",
  "requirements.txt",
  "pyproject.toml",
  "pubspec.yaml",
] as const;

type ExtraFile = (typeof EXTRA_FILES)[number];

async function fetchGithubToken(): Promise<string | null> {
  try {
    const res = await http.get<{ accessToken: string }>("/api/github/token");
    return res.data.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = await fetchGithubToken();
  if (!token) {
    return NextResponse.json(
      { error: "GitHub 연동이 필요합니다." },
      { status: 401 },
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

  const [repoRes, langRes, readmeRes, pkgRes, dockerRes, ciRes, jenkinsRes, ...extraRes] =
    await Promise.all([
      fetch(base, { headers }),
      fetch(`${base}/languages`, { headers }),
      fetch(`${base}/readme`, { headers }),
      fetch(`${base}/contents/package.json`, { headers }),
      fetch(`${base}/contents/Dockerfile`, { headers }),
      fetch(`${base}/contents/.github/workflows`, { headers }),
      fetch(`${base}/contents/Jenkinsfile`, { headers }),
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
  if (fileMap["pubspec.yaml"]) detectFromPubspec(fileMap["pubspec.yaml"]).forEach((f) => frameworkSet.add(f));
  if (dockerRes.ok) detectFromDockerfile().forEach((f) => frameworkSet.add(f));
  if (ciRes.ok) detectFromGithubActions().forEach((f) => frameworkSet.add(f));
  if (jenkinsRes.ok) detectFromJenkinsfile().forEach((f) => frameworkSet.add(f));

  // 언어 fallback: DB에 있는 언어만 허용
  const langFallback = Object.keys(langData).filter((l) => KNOWN_LANGUAGES.has(l));

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
    techStack: frameworks.length > 0 ? frameworks : langFallback,
    deployUrl: (repoData.homepage as string) ?? "",
    readmeText,
  });
}
