"use client";

import { useEffect, useRef } from "react";

const LENGTH = 6;

/**
 * 6자리 인증 코드 입력.
 *
 * 자동 포커스 이동, Backspace/화살표 이동, 붙여넣기 분배, 6자리가 채워지면 자동 제출까지
 * 담당한다. 회원가입 인증과 학교 이메일 인증이 같은 동작을 써야 해서 컴포넌트로 뺐다.
 *
 * digits는 부모가 소유한다 — 제출 후 초기화(재발송 등)를 부모가 제어해야 하기 때문.
 */
export default function OtpInput({
  digits,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
}: {
  digits: string[];
  onChange: (next: string[]) => void;
  /** 6자리가 모두 채워지면 호출 */
  onComplete: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (digits.length === LENGTH && digits.every((d) => d !== "")) {
      onComplete(digits.join(""));
    }
    // onComplete을 의존성에 넣으면 부모가 인라인 함수를 넘길 때마다 재실행된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    onChange(next);

    if (char && index < LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        onChange(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    const next = Array(LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    onChange(next);
    const focusIndex = Math.min(pasted.length, LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="h-14 w-11 rounded-lg border-2 border-gray-200 text-center text-xl font-semibold outline-none transition-colors focus:border-black disabled:bg-gray-50 disabled:text-gray-400"
        />
      ))}
    </div>
  );
}

export const OTP_LENGTH = LENGTH;
