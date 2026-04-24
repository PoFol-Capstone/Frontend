import { NextRequest, NextResponse } from "next/server";
import { parseReadme, FRAMEWORK_MAP } from "@/lib/github";

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

  const frameworks: string[] = [];
  if (pkgRes.ok) {
    const pkgJson = await pkgRes.json();
    const pkgText = Buffer.from(pkgJson.content, "base64").toString("utf-8");
    const pkg = JSON.parse(pkgText);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [key, label] of Object.entries(FRAMEWORK_MAP)) {
      if (key in allDeps) frameworks.push(label);
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
