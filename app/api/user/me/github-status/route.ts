import { NextResponse } from "next/server";
import { http } from "@/lib/http.server";

export async function GET() {
  try {
    const res = await http.get<{ connected: boolean }>("/api/auth/github/status");
    return NextResponse.json({ connected: res.data.connected ?? false });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
