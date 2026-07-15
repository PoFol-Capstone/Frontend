"use client";

import { useState } from "react";
import { X, Link2, Mail } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Profile } from "@/types/user";
import { updateProfile } from "@/lib/user";
import { useTranslations } from "next-intl";

interface Props {
  profile: Profile;
  onClose: () => void;
}

function calcDuration(
  ym: string,
  t: ReturnType<typeof useTranslations<"profile.editModal">>,
): { totalMonths: number; label: string } | null {
  if (!ym) return null;
  const [y, m] = ym.split("-").map(Number);
  const now = new Date();
  const totalMonths = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (totalMonths < 0) return null;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const label =
    years > 0
      ? months > 0
        ? t("yearsMonthsLabel", { years, months })
        : t("yearsLabel", { years })
      : t("monthsLabel", { months });
  return { totalMonths, label };
}

function toStartMonth(positionMonths: number | null | undefined): string {
  if (positionMonths == null) return "";
  const d = new Date();
  d.setMonth(d.getMonth() - positionMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ProfileEditModal({ profile, onClose }: Props) {
  const t = useTranslations("profile.editModal");
  const githubUrl = profile.links.find((l) => l.type === "GITHUB")?.url ?? "";
  const portfolioUrl = profile.links.find((l) => l.type !== "GITHUB")?.url ?? "";

  const [form, setForm] = useState({
    name: profile.name ?? "",
    bio: profile.bio ?? "",
    position: profile.position ?? "",
    portfolioUrl,
  });
  const [startMonth, setStartMonth] = useState(() => toStartMonth(profile.positionMonths));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const duration = calcDuration(startMonth, t);
    setIsSubmitting(true);
    try {
      await updateProfile({ ...form, positionMonths: duration?.totalMonths ?? 0 });
      onClose();
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  const duration = calcDuration(startMonth, t);

  const inputClass =
    "min-h-10.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black";
  const disabledClass =
    "min-h-10.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      {/* overflow-hidden + rounded으로 스크롤바가 모달 모서리 안에 클리핑됨 */}
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="max-h-[90vh] overflow-y-auto
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
        >
        {/* 헤더 */}
        <div className="px-8 pt-8 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-7 top-7 text-gray-400 transition hover:text-black"
          >
            <X size={24} />
          </button>
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {/* 폼 */}
        <div className="px-8 pb-8 pt-2 space-y-6 text-left">
          {/* 이름 */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-gray-900">
              {t("name")}
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("namePlaceholder")}
              className={inputClass}
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Mail className="h-4 w-4" />
              {t("email")}
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className={disabledClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t("emailHint")}
            </p>
          </div>

          {/* GitHub */}
          <div>
            <label className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <FaGithub className="h-4 w-4" />
              {t("github")}
            </label>
            <input
              type="text"
              value={githubUrl || t("githubNotConnected")}
              disabled
              className={disabledClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t("githubHint")}
            </p>
          </div>

          {/* 포트폴리오 */}
          <div>
            <label className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Link2 className="h-4 w-4" />
              {t("portfolio")}
            </label>
            <input
              type="text"
              name="portfolioUrl"
              value={form.portfolioUrl}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* 직무 */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-gray-900">
              {t("position")}
            </label>
            <input
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
              placeholder={t("positionPlaceholder")}
              className={inputClass}
            />
          </div>

          {/* 경력 시작월 */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-gray-900">
              {t("startMonth")}
            </label>
            <input
              type="month"
              value={startMonth}
              max={new Date().toISOString().slice(0, 7)}
              onChange={(e) => setStartMonth(e.target.value)}
              className={inputClass}
            />
            {duration && (
              <p className="mt-1.5 text-sm font-medium text-gray-700">
                {t("currentLabel")} <span className="text-black">{duration.label}</span>
              </p>
            )}
          </div>

          {/* 소개글 */}
          <div>
            <label className="mb-2.5 block text-sm font-semibold text-gray-900">
              {t("bio")}
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={5}
              placeholder={t("bioPlaceholder")}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-3 min-h-10.5 w-full rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? t("saving") : t("save")}
          </button>
        </div>
        </div> {/* overflow-y-auto 스크롤 컨테이너 닫기 */}
      </div>
    </div>
  );
}
