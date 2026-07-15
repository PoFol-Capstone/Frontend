"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { saveAccessToken } from "@/lib/session";
import { useTranslations } from "next-intl";

export default function OAuthCallbackPage() {
  const t = useTranslations("auth.oauth");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken") ?? "";
    const refreshToken = params.get("refreshToken") ?? "";
    const uuid = params.get("uuid") ?? "";

    if (!accessToken || !uuid) {
      router.replace("/board/write?github_error=true");
      return;
    }

    saveAccessToken(uuid, accessToken, refreshToken).then(() => {
      router.replace("/board/write?github_connected=true");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">{t("connecting")}</p>
    </div>
  );
}
