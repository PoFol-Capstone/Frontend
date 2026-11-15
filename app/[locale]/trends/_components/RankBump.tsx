import { scaleLinear, scalePoint } from "d3-scale";
import { curveBumpX, line } from "d3-shape";
import type { TrendSeries } from "@/lib/trends";
import { languageColor } from "./colors";

const W = 640;
const ROW = 26;
const PAD = { top: 24, bottom: 12, left: 90, right: 90 };

/** 월별 순위 변동 (D3 bump chart, 서버에서 그림). 위가 1위 */
export default function RankBump({ series }: { series: TrendSeries }) {
  const n = series.languages.length;
  const H = PAD.top + PAD.bottom + ROW * (n - 1);
  const x = scalePoint<string>().domain(series.periods).range([PAD.left, W - PAD.right]);
  const y = scaleLinear().domain([1, Math.max(n, 2)]).range([PAD.top, H - PAD.bottom]);
  const path = line<[string, number]>()
    .x(([p]) => x(p) ?? 0)
    .y(([, r]) => y(r))
    .curve(curveBumpX);
  const first = series.periods[0];
  const last = series.periods.at(-1)!;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {series.periods.map((p) => (
        <text key={p} x={x(p)} y={12} textAnchor="middle" className="fill-gray-400 text-[10px]">{p}</text>
      ))}
      {series.languages.map((l) => {
        const color = languageColor(l.language);
        const pts = series.periods.map((p, i) => [p, l.ranks[i]] as [string, number]);
        return (
          <g key={l.language}>
            <path d={path(pts) ?? ""} fill="none" stroke={color} strokeWidth={2.5} strokeOpacity={0.85} />
            {pts.map(([p, r]) => <circle key={p} cx={x(p)} cy={y(r)} r={3.5} fill={color} />)}
            <text x={(x(first) ?? 0) - 8} y={y(l.ranks[0])} dy="0.32em" textAnchor="end" className="fill-gray-600 text-[11px]">
              {l.language}
            </text>
            <text x={(x(last) ?? 0) + 8} y={y(l.ranks.at(-1)!)} dy="0.32em" className="fill-gray-800 text-[11px] font-medium">
              {l.ranks.at(-1)}. {l.language}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
