"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveAccessToken } from "@/lib/session";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken") ?? "";
    const refreshToken = params.get("refreshToken") ?? "";
    const uuid = params.get("uuid") ?? "";
    const name = params.get("name") ?? "";

    if (!accessToken || !uuid) {
      router.replace("/board/write?github_error=true");
      return;
    }

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("uuid", uuid);
    localStorage.setItem("name", name);

    saveAccessToken(uuid, accessToken, refreshToken).then(() => {
      router.replace("/board/write?github_connected=true");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">GitHub 연결 중...</p>
    </div>
  );
}
