import { NextRequest, NextResponse } from "next/server";
import { http } from "@/lib/http";
import axios from "axios";

// 프론트에서 Authorization 헤더 전달 시 우선 사용, 없으면 쿠키(http.ts) 기반 fallback
export async function GET(req: NextRequest) {
  const incomingAuth = req.headers.get("authorization");

  try {
    const res = await (incomingAuth
      ? axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github/connect`, {
          headers: { Authorization: incomingAuth },
          maxRedirects: 0,
          validateStatus: () => true,
        })
      : http.get("/api/auth/github/connect", {
          maxRedirects: 0,
          validateStatus: () => true,
        }));

    const location = res.headers.location as string | undefined;

    if ((res.status === 302 || res.status === 301) && location) {
      return NextResponse.json({ redirectUrl: location });
    }

    const redirectUrl = res.data?.redirectUrl ?? res.data?.url;
    if (redirectUrl) {
      return NextResponse.json({ redirectUrl });
    }

    if (res.status === 401 || res.status === 400) {
      return NextResponse.json({ error: "인증이 만료되었습니다. 다시 로그인해주세요." }, { status: 401 });
    }

    if (res.status === 403) {
      return NextResponse.json({ error: "접근 권한이 없습니다. 백엔드 Security 설정을 확인해주세요." }, { status: 403 });
    }

    console.error("[github/connect] 백엔드 응답:", res.status, res.data);
    return NextResponse.json({ error: "GitHub 연결 요청에 실패했습니다." }, { status: res.status ?? 502 });
  } catch (err) {
    console.error("[github/connect] 요청 오류:", err);
    return NextResponse.json({ error: "GitHub 연결 요청에 실패했습니다." }, { status: 500 });
  }
}
