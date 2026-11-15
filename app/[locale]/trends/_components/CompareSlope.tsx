import { scaleLinear } from "d3-scale";
import type { RankRow } from "@/lib/trends";
import { languageColor } from "./colors";

const W = 520;
const H = 360;
const PAD = { top: 28, bottom: 16, side: 120 };
const LABEL_GAP = 13;

/** 라벨이 겹치지 않게 y를 위에서부터 최소 간격만큼 밀어낸다 */
function spread(ys: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  let prev = -Infinity;
  for (const [k, y] of [...ys].sort((a, b) => a[1] - b[1])) {
    prev = Math.max(y, prev + LABEL_GAP);
    out.set(k, prev);
  }
  return out;
}

/**
 * 전 세계 vs 국내 비중 비교 (D3 scale + React SVG, 서버에서 그림).
 * 같은 언어를 선으로 이어, 기울기로 "국내에서 유독 많이/적게 쓰는 언어"가 보이게 한다.
 */
export default function CompareSlope({
  global,
  korea,
  leftLabel,
  rightLabel,
}: {
  global: RankRow[];
  korea: RankRow[];
  leftLabel: string;
  rightLabel: string;
}) {
  const shareOf = (rows: RankRow[], lang: string) => rows.find((r) => r.language === lang)?.share ?? 0;
  const langs = global.map((r) => r.language);
  const max = Math.max(...global.map((r) => r.share), ...korea.map((r) => r.share), 0.0001);
  const y = scaleLinear().domain([0, max]).range([H - PAD.bottom, PAD.top]);
  const xL = PAD.side;
  const xR = W - PAD.side;
  const labelL = spread(new Map(langs.map((l) => [l, y(shareOf(global, l))])));
  const labelR = spread(new Map(langs.map((l) => [l, y(shareOf(korea, l))])));
  const height = Math.max(H, ...labelL.values(), ...labelR.values()) + 8;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" aria-hidden>
      <text x={xL} y={14} textAnchor="middle" className="fill-gray-500 text-[11px]">{leftLabel}</text>
      <text x={xR} y={14} textAnchor="middle" className="fill-gray-500 text-[11px]">{rightLabel}</text>
      <line x1={xL} x2={xL} y1={PAD.top} y2={H - PAD.bottom} className="stroke-gray-200" />
      <line x1={xR} x2={xR} y1={PAD.top} y2={H - PAD.bottom} className="stroke-gray-200" />
      {langs.map((lang) => {
        const g = shareOf(global, lang);
        const k = shareOf(korea, lang);
        const color = languageColor(lang);
        return (
          <g key={lang}>
            <line x1={xL} y1={y(g)} x2={xR} y2={y(k)} stroke={color} strokeWidth={2} strokeOpacity={0.8} />
            <circle cx={xL} cy={y(g)} r={3.5} fill={color} />
            <circle cx={xR} cy={y(k)} r={3.5} fill={color} />
            <text x={xL - 8} y={labelL.get(lang)} dy="0.32em" textAnchor="end" className="fill-gray-700 text-[11px]">
              {lang} {(g * 100).toFixed(1)}%
            </text>
            <text x={xR + 8} y={labelR.get(lang)} dy="0.32em" className="fill-gray-700 text-[11px]">
              {(k * 100).toFixed(1)}% {lang}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
