import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`${backendUrl}/api/skills`);
  if (q) url.searchParams.set("q", q);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
