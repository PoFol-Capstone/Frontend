export function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
