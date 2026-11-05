"use client";

import { useRef, useState } from "react";
import { Link2, Mail, Camera } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { AVATAR_ACCEPT, AVATAR_EXTENSIONS, MAX_AVATAR_BYTES, MAX_AVATAR_MB } from "@/lib/uploadLimits";
import Modal from "@/components/Modal";
import Field from "@/components/ui/Field";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl ?? null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 사진은 고르는 즉시 업로드하고, 저장 버튼을 눌러야 프로필에 반영된다
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!AVATAR_EXTENSIONS[file.type]) {
      setError(t("avatarInvalidType"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(t("avatarTooLarge", { max: MAX_AVATAR_MB }));
      return;
    }
    setError(null);
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? t("avatarUploadFailed"));
        return;
      }
      setAvatarUrl(data.url);
    } catch {
      setError(t("avatarUploadFailed"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    // 예전엔 검증도 실패 피드백도 없어서, 저장이 실패하면 모달이 그냥 열린 채로 남았다
    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }

    const duration = calcDuration(startMonth, t);
    setError(null);
    setIsSubmitting(true);
    try {
      await updateProfile({
        ...form,
        name: form.name.trim(),
        positionMonths: duration?.totalMonths ?? 0,
        avatarUrl,
      });
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("[profile] 프로필 저장 실패:", err);
      setError(t("saveFailed"));
      setIsSubmitting(false);
    }
    // 성공 시엔 새로고침하므로 로딩 상태를 되돌리지 않는다
  };

  const duration = calcDuration(startMonth, t);

  return (
    <Modal
      title={t("title")}
      onClose={onClose}
      className="max-w-2xl
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-gray-100
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
    >
      <div className="space-y-6 text-left">
        <p className="-mt-4 text-sm text-gray-400">{t("subtitle")}</p>

        {/* 프로필 사진 — 원형으로 잘린 모습 그대로 미리 보여준다 */}
        <div className="flex items-center gap-5">
          <Avatar src={avatarUrl} name={form.name || profile.name} size="lg" />
          <div className="space-y-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {isUploadingAvatar ? t("avatarUploading") : t("avatarChange")}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="block text-xs text-gray-500 hover:text-black"
              >
                {t("avatarReset")}
              </button>
            )}
            <p className="text-xs text-gray-400">{t("avatarHint", { max: MAX_AVATAR_MB })}</p>
          </div>
        </div>

        <Field label={t("name")}>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t("namePlaceholder")}
            className="input"
          />
        </Field>

        <Field label={<span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{t("email")}</span>} hint={t("emailHint")}>
          <input type="email" value={profile.email} disabled className="input" />
        </Field>

        <Field label={<span className="inline-flex items-center gap-1.5"><FaGithub className="h-4 w-4" />{t("github")}</span>} hint={t("githubHint")}>
          <input
            type="text"
            value={githubUrl || t("githubNotConnected")}
            disabled
            className="input"
          />
        </Field>

        <Field label={<span className="inline-flex items-center gap-1.5"><Link2 className="h-4 w-4" />{t("portfolio")}</span>}>
          <input
            type="text"
            name="portfolioUrl"
            value={form.portfolioUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="input"
          />
        </Field>

        <Field label={t("position")}>
          <input
            type="text"
            name="position"
            value={form.position}
            onChange={handleChange}
            placeholder={t("positionPlaceholder")}
            className="input"
          />
        </Field>

        <Field
          label={t("startMonth")}
          hint={
            duration && (
              <span className="text-sm font-medium text-gray-700">
                {t("currentLabel")} <span className="text-black">{duration.label}</span>
              </span>
            )
          }
        >
          <input
            type="month"
            value={startMonth}
            max={new Date().toISOString().slice(0, 7)}
            onChange={(e) => setStartMonth(e.target.value)}
            className="input"
          />
        </Field>

        <Field label={t("bio")}>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={5}
            placeholder={t("bioPlaceholder")}
            className="input resize-none"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isUploadingAvatar}
          className="btn btn-primary w-full"
        >
          {isSubmitting ? t("saving") : t("save")}
        </button>
      </div>
    </Modal>
  );
}
