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

// GitHub의 "owner/repo" 형식만 허용. 검증 없이 URL에 이어붙이면
// "a/b/../../user" 같은 값으로 의도하지 않은 GitHub API 엔드포인트를 호출할 수 있다.
const REPO_FULL_NAME = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

/**
 * GitHub Contents API 응답에서 파일 본문을 꺼낸다.
 * 200이어도 디렉터리 응답(배열)이거나 파일이 너무 커서 content가 비어있는 경우가 있으므로
 * content 존재 여부를 반드시 확인해야 한다.
 */
async function readContentsFile(res: Response): Promise<string | null> {
  if (!res.ok) return null;
  try {
    const json = await res.json();
    if (typeof json?.content !== "string") return null;
    return Buffer.from(json.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

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
  if (!REPO_FULL_NAME.test(fullName)) {
    return NextResponse.json(
      { error: "repo 형식이 올바르지 않습니다. (owner/repo)" },
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
    EXTRA_FILES.map(
      async (file, i) => [file, await readContentsFile(extraRes[i])] as const,
    ),
  );
  const fileMap = Object.fromEntries(fileContents) as Record<ExtraFile, string | null>;

  const frameworkSet = new Set<string>();

  const pkgText = await readContentsFile(pkgRes);
  if (pkgText) detectFromPackageJson(pkgText).forEach((f) => frameworkSet.add(f));
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

  const readmeContent = await readContentsFile(readmeRes);
  if (readmeContent) {
    readmeText = readmeContent;
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
