"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CircleCheck, GraduationCap } from "lucide-react";
import OtpInput, { OTP_LENGTH } from "@/components/OtpInput";
import { sendSchoolOtp, verifySchoolOtp } from "@/lib/school";
import type { SchoolStatus } from "@/types/school";

const inputClass =
  "min-h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black";

type Step = "idle" | "code";

export default function SchoolVerificationCard({
  status,
}: {
  /** 백엔드 조회에 실패하면 null — 잘못된 상태를 단정해 보여주지 않는다 */
  status: SchoolStatus | null;
}) {
  const t = useTranslations("settings.school");
  const router = useRouter();

  const [step, setStep] = useState<Step>("idle");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [pendingSchool, setPendingSchool] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 인증 직후에는 서버에서 새로 받은 학교명을 우선 보여준다 (router.refresh 전에도 반영)
  const [justVerified, setJustVerified] = useState("");
  const verifiedSchool = justVerified || status?.schoolNameKo || "";
  const isVerified = Boolean(justVerified) || Boolean(status?.verified);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("emailRequired"));
      return;
    }

    setBusy(true);
    setError("");

    const result = await sendSchoolOtp(trimmed);

    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setPendingSchool(result.schoolNameKo ?? "");
    setDigits(Array(OTP_LENGTH).fill(""));
    setStep("code");
  };

  const handleVerify = async (code: string) => {
    if (busy) return;

    setBusy(true);
    setError("");

    const result = await verifySchoolOtp(email.trim(), code);

    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      setDigits(Array(OTP_LENGTH).fill(""));
      return;
    }

    setJustVerified(result.schoolNameKo ?? pendingSchool);
    setStep("idle");
    setEmail("");
    // 헤더는 서버 컴포넌트에서 쿠키를 읽으므로 refresh해야 "PoFoL | 강남대"가 나타난다
    router.refresh();
  };

  const resetToIdle = () => {
    setStep("idle");
    setDigits(Array(OTP_LENGTH).fill(""));
    setError("");
  };

  return (
    <section className="rounded-xl border border-gray-300 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-black">
            <GraduationCap className="h-5 w-5" />
            {t("title")}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{t("desc")}</p>
        </div>

        {isVerified && verifiedSchool && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
            <CircleCheck className="h-3.5 w-3.5" />
            {t("verifiedAt", { school: verifiedSchool })}
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-gray-300 pt-4">
        {status === null && (
          <p role="alert" className="text-sm text-red-500">
            {t("statusUnavailable")}
          </p>
        )}

        {status !== null && step === "idle" && (
          <>
            {isVerified && verifiedSchool && (
              <p className="mb-3 text-sm text-gray-600">
                {t("verifiedNotice", { school: verifiedSchool })}
              </p>
            )}

            <label
              htmlFor="school-email"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              {t("emailLabel")}
            </label>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="school-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                disabled={busy}
                className={inputClass}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={busy}
                className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {busy ? t("sending") : t("sendCode")}
              </button>
            </div>
          </>
        )}

        {status !== null && step === "code" && (
          <>
            <p className="mb-3 text-sm text-gray-600">
              {t("codeSentTo", { school: pendingSchool })}
            </p>

            <span className="mb-2 block text-sm font-semibold text-gray-900">
              {t("codeLabel")}
            </span>

            <OtpInput
              digits={digits}
              onChange={setDigits}
              onComplete={handleVerify}
              disabled={busy}
              autoFocus
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleVerify(digits.join(""))}
                disabled={busy || digits.some((d) => d === "")}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {busy ? t("verifying") : t("verify")}
              </button>

              <button
                type="button"
                onClick={resetToIdle}
                disabled={busy}
                className="text-sm text-gray-500 underline disabled:opacity-50"
              >
                {t("cancel")}
              </button>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
