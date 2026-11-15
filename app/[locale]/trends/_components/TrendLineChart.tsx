"use client";

import { CategoryScale, Chart, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import type { TrendSeries } from "@/lib/trends";
import { languageColor } from "./colors";

Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Legend, Tooltip);

/** 월별 비중 선 그래프 (Chart.js). 범례를 누르면 언어를 켜고 끈다. 상위 5개만 처음에 켜 둔다 */
export default function TrendLineChart({ series }: { series: TrendSeries }) {
  return (
    <div className="relative h-80">
      <Line
        aria-hidden
        data={{
          labels: series.periods,
          datasets: series.languages.map((l, i) => ({
            label: l.language,
            data: l.shares.map((s) => s * 100),
            borderColor: languageColor(l.language),
            backgroundColor: languageColor(l.language),
            tension: 0.3,
            hidden: i >= 5,
          })),
        }}
        options={{
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          scales: { y: { ticks: { callback: (v) => `${v}%` }, grid: { color: "#f3f4f6" } }, x: { grid: { display: false } } },
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10 } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} ${Number(ctx.parsed.y).toFixed(1)}%` } },
          },
        }}
      />
    </div>
  );
}
