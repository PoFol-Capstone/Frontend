import { NextRequest, NextResponse } from "next/server";

// 스킬 목록은 백엔드 SkillDataInitializer가 시딩하는 정적 참조 데이터로, 거의 변하지 않는다.
// 예전엔 `cache: "no-store"`라서 SkillPicker에서 글자를 칠 때마다 백엔드까지 왕복했다.
//
// 참고: `"use cache"` 디렉티브는 `cacheComponents: true`가 필요한데 현재 켤 수 없어
// (이유는 next.config.ts 주석 참고) fetch 단위 revalidate로 캐싱한다.
const REVALIDATE_SECONDS = 60 * 60; // 1시간

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = new URL(`${backendUrl}/api/skills`);
  if (q) url.searchParams.set("q", q);

  try {
    const res = await fetch(url.toString(), {
      // q별로 개별 캐시 엔트리가 생긴다 (fetch 캐시 키에 URL이 포함됨)
      next: { revalidate: REVALIDATE_SECONDS, tags: ["skills"] },
    });
    if (!res.ok) {
      console.error("[skills] 백엔드 응답 실패:", res.status);
      return NextResponse.json([]);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    // 예전엔 조용히 빈 배열만 반환해서 백엔드 장애가 "스킬이 없음"으로 보였다
    console.error("[skills] 조회 실패:", err);
    return NextResponse.json([]);
  }
}
