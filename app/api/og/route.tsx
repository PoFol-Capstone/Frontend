import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "프로젝트";
  const stack = searchParams.get("stack") ?? "";
  const tags = stack
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
          padding: "60px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* 상단 라벨 */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "999px",
            padding: "6px 18px",
            marginBottom: "28px",
          }}
        >
          <span style={{ color: "#aaa", fontSize: 18 }}>PoFol Project</span>
        </div>

        {/* 프로젝트 이름 */}
        <div
          style={{
            color: "#fff",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "36px",
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        {/* 기술 스택 태그 */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                padding: "8px 20px",
                color: "#fff",
                fontSize: 22,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
