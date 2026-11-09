import { cloneElement, isValidElement, useId } from "react";

type Props = {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** 글자수 표시. max와 함께 쓰면 "12 / 200" */
  count?: number;
  max?: number;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

// 라벨·힌트·에러를 인풋에 id/aria로 자동 연결한다. children이 단일 요소일 때만 주입.
export default function Field({ label, hint, error, count, max, required, className, children }: Props) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const el = isValidElement<{ id?: string }>(children) ? children : null;
  const controlId = el ? (el.props.id ?? id) : undefined;
  const control = el
    ? cloneElement<Record<string, unknown>>(el, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={controlId} className="text-sm font-semibold text-gray-900">
          {label}
          {required && <span aria-hidden className="ml-0.5 text-red-500">*</span>}
        </label>
        {count !== undefined && (
          <span className="text-xs tabular-nums text-gray-400">
            {count}
            {max !== undefined && ` / ${max}`}
          </span>
        )}
      </div>
      {control}
      {hint && !error && <p id={hintId} className="mt-2 text-[13px] text-gray-500">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-2 text-[13px] text-red-500">{error}</p>}
    </div>
  );
}
