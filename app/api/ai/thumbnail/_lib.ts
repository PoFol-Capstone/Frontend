export interface ProjectInfo {
  projectName: string;
  techStack: string[];
  projectDescription?: string;
  mainFeatures?: string;
}

const PASTEL_PAIRS: [string, string][] = [
  ["#FFE4E6", "#FDE8D8"],
  ["#E0F2FE", "#DBEAFE"],
  ["#D1FAE5", "#DCFCE7"],
  ["#FEF3C7", "#FDE68A"],
  ["#EDE9FE", "#DDD6FE"],
  ["#FCE7F3", "#FBCFE8"],
  ["#E0F7FA", "#B2EBF2"],
  ["#FFF3E0", "#FFE0B2"],
];

const ACCENTS = [
  "#FDA4AF", "#FDBA74", "#FCD34D",
  "#6EE7B7", "#7DD3FC", "#C4B5FD", "#F9A8D4",
];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function generatePastelSvgBuffer(info: ProjectInfo): Buffer {
  const h = hash(info.projectName);
  const [c1, c2] = PASTEL_PAIRS[h % PASTEL_PAIRS.length];
  const a1 = ACCENTS[h % ACCENTS.length];
  const a2 = ACCENTS[(h + 2) % ACCENTS.length];
  const a3 = ACCENTS[(h + 4) % ACCENTS.length];

  const name = esc(info.projectName.slice(0, 40));
  const stacks = info.techStack.slice(0, 8);

  const PW = 150, PH = 34, GAP = 12, MAX_PER_ROW = 4;
  const pills = stacks
    .map((tech, i) => {
      const row = Math.floor(i / MAX_PER_ROW);
      const col = i % MAX_PER_ROW;
      const rowLen = Math.min(stacks.length - row * MAX_PER_ROW, MAX_PER_ROW);
      const rowW = rowLen * (PW + GAP) - GAP;
      const x = (1200 - rowW) / 2 + col * (PW + GAP);
      const y = 370 + row * (PH + 10);
      const ac = ACCENTS[(h + i * 3) % ACCENTS.length];
      return `<rect x="${x}" y="${y}" width="${PW}" height="${PH}" rx="17" fill="${ac}" opacity="0.35"/>
  <text x="${x + PW / 2}" y="${y + 22}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="#374151">${esc(tech)}</text>`;
    })
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="d" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#94a3b8" opacity="0.18"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#d)"/>
  <circle cx="1080" cy="90" r="200" fill="${a1}" opacity="0.22"/>
  <circle cx="120" cy="540" r="160" fill="${a2}" opacity="0.22"/>
  <circle cx="180" cy="100" r="90" fill="${a3}" opacity="0.18"/>
  <circle cx="1060" cy="540" r="110" fill="${a2}" opacity="0.14"/>
  <text x="600" y="280" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',sans-serif" font-size="68" font-weight="800" fill="#1e293b" letter-spacing="-1.5">${name}</text>
  <rect x="570" y="300" width="60" height="5" rx="2.5" fill="${a1}" opacity="0.8"/>
  ${pills}
</svg>`;

  return Buffer.from(svg, "utf-8");
}
