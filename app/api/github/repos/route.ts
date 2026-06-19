import { NextResponse } from "next/server";
import { http } from "@/lib/http.server";

export async function GET() {
  try {
    const res = await http.get<{ name: string; fullName: string }[]>("/api/github/repos");
    return NextResponse.json(res.data);
  } catch {
    return NextResponse.json(
      { error: "GitHub repo 목록을 가져오지 못했습니다." },
      { status: 500 },
    );
  }
}
