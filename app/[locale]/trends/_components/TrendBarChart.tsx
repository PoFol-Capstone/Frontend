"use client";

import { BarElement, CategoryScale, Chart, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { RankRow } from "@/lib/trends";

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

const changeText = (change: number | null) => {
  if (change == null) return "";
  const p = change * 100;
  if (Math.abs(p) < 0.05) return " –";
  return ` ${p > 0 ? "▲" : "▼"}${Math.abs(p).toFixed(1)}%p`;
};

/** 언어 순위 가로 막대 (Chart.js). 지난달 대비 변화는 축 라벨에 붙인다 */
export default function TrendBarChart({ rows, unit, locale }: { rows: RankRow[]; unit: string; locale: string }) {
  return (
    <div className="relative" style={{ height: rows.length * 28 + 24 }}>
      <Bar
        aria-hidden
        data={{
          labels: rows.map((r) => `${r.language}${changeText(r.change)}`),
          datasets: [{ data: rows.map((r) => r.share * 100), backgroundColor: "#1f2937", borderRadius: 4, barThickness: 10 }],
        }}
        options={{
          indexAxis: "y",
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { callback: (v) => `${v}%` }, grid: { color: "#f3f4f6" } },
            y: { grid: { display: false }, ticks: { color: "#374151" } },
          },
          plugins: {
            legend: { display: false }, // Legend는 선 그래프가 전역 등록하므로 여기선 꺼야 한다
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const r = rows[ctx.dataIndex];
                  return `${(r.share * 100).toFixed(1)}% · ${r.count.toLocaleString(locale)}${unit}`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
