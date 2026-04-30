import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const res = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "GitHub repo 목록을 가져오지 못했습니다." },
      { status: res.status },
    );
  }

  const data = await res.json();

  const repos = (data as { name: string; full_name: string }[]).map((r) => ({
    name: r.name,
    fullName: r.full_name,
  }));

  return NextResponse.json(repos);
}
