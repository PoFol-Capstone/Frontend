import { ChevronIcon } from "./ChevronIcon";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronIcon direction="left" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
              i === page
                ? "bg-black font-semibold text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-black"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}
