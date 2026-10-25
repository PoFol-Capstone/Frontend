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
import { ApiError, http } from "@/lib/http.server";

const KNOWN_LANGUAGES = new Set([
  "JavaScript", "TypeScript", "Python", "Java", "Kotlin",
  "Swift", "Dart", "Go", "C", "C++", "C#",
]);

type RepoFiles = {
  name: string;
  description: string | null;
  homepage: string | null;
  languages: Record<string, number>;
  /** 경로 → 본문 (없으면 null). README는 키 "README" */
  files: Record<string, string | null>;
  /** 존재 여부만 보는 경로 (Dockerfile, .github/workflows, Jenkinsfile) */
  present: Record<string, boolean>;
};

// GitHub의 "owner/repo" 형식만 허용 (백엔드도 같은 검증을 한다)
const REPO_FULL_NAME = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

/**
 * 게시글 작성 자동 채우기. 예전엔 /api/github/token으로 GitHub 토큰 원문을 받아 여기서 GitHub을 직접 불렀다.
 * 이제 백엔드(/api/github/repo-files)가 토큰을 쥔 채 정해진 파일만 읽어 주고, 여기서는 기술 스택만 감지한다.
 */
export async function GET(req: NextRequest) {
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

  let data: RepoFiles;
  try {
    const res = await http.get<RepoFiles>("/api/github/repo-files", {
      params: { repo: fullName },
      requireAuth: true,
    });
    data = res.data;
  } catch (err) {
    const status = err instanceof ApiError && err.status ? err.status : 502;
    const message = err instanceof ApiError ? err.message : "레포지토리 정보를 가져오지 못했습니다.";
    return NextResponse.json({ error: message }, { status });
  }

  const file = (path: string) => data.files[path] ?? null;
  const frameworkSet = new Set<string>();

  const pkgText = file("package.json");
  if (pkgText) detectFromPackageJson(pkgText).forEach((f) => frameworkSet.add(f));
  const pom = file("pom.xml");
  if (pom) detectFromPomXml(pom).forEach((f) => frameworkSet.add(f));
  const gradle = file("build.gradle");
  if (gradle) detectFromGradle(gradle).forEach((f) => frameworkSet.add(f));
  const requirements = file("requirements.txt");
  if (requirements) detectFromPython(requirements).forEach((f) => frameworkSet.add(f));
  const pyproject = file("pyproject.toml");
  if (pyproject) detectFromPython(pyproject).forEach((f) => frameworkSet.add(f));
  const pubspec = file("pubspec.yaml");
  if (pubspec) detectFromPubspec(pubspec).forEach((f) => frameworkSet.add(f));
  if (data.present["Dockerfile"]) detectFromDockerfile().forEach((f) => frameworkSet.add(f));
  if (data.present[".github/workflows"]) detectFromGithubActions().forEach((f) => frameworkSet.add(f));
  if (data.present["Jenkinsfile"]) detectFromJenkinsfile().forEach((f) => frameworkSet.add(f));

  // 언어 fallback: DB에 있는 언어만 허용
  const langFallback = Object.keys(data.languages).filter((l) => KNOWN_LANGUAGES.has(l));

  const frameworks = [...frameworkSet];

  let description = data.description ?? "";
  let mainFeatures = "";
  let readmeText = "";

  const readmeContent = file("README");
  if (readmeContent) {
    readmeText = readmeContent;
    const parsed = parseReadme(readmeText);
    if (parsed.description) description = parsed.description;
    mainFeatures = parsed.mainFeatures;
  }

  return NextResponse.json({
    projectName: data.name,
    projectDescription: description,
    mainFeatures,
    techStack: frameworks.length > 0 ? frameworks : langFallback,
    deployUrl: data.homepage ?? "",
    readmeText,
  });
}
