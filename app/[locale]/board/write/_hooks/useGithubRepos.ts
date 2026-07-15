"use client";
import { startTransition, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type Repo = { name: string; fullName: string };

export function useGithubRepos() {
  const t = useTranslations("board.write.github");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isCheckingGithub, setIsCheckingGithub] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const hasGithubError = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = new URL(window.location.href);

    const githubError = params.get("github_error");
    if (githubError) {
      hasGithubError.current = true;
      setConnectError(
        githubError === "already_linked"
          ? t("errorAlreadyLinked")
          : githubError === "state_expired"
            ? t("errorStateExpired")
            : t("errorGeneric"),
      );
      url.searchParams.delete("github_error");
      window.history.replaceState({}, "", url.toString());
    }

    if (params.get("github_connected") === "true") {
      url.searchParams.delete("github_connected");
      window.history.replaceState({}, "", url.toString());
      startTransition(() => {
        setIsGithubConnected(true);
        setIsCheckingGithub(false);
      });
      return;
    }

    fetch("/api/user/me/github-status")
      .then((r) => r.json())
      .then((data) => {
        setIsGithubConnected(data.connected ?? false);
      })
      .catch(() => {})
      .finally(() => setIsCheckingGithub(false));
  }, [t]);

  useEffect(() => {
    if (!isGithubConnected) return;
    startTransition(() => setIsLoadingRepos(true));
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data: Repo[]) => {
        if (Array.isArray(data)) setRepos(data);
      })
      .catch(() => {})
      .finally(() => setIsLoadingRepos(false));
  }, [isGithubConnected]);

  const handleGithubConnect = async () => {
    setIsConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/auth/github/connect");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setConnectError(t("errorLoginRequired"));
        } else {
          setConnectError(data.error ?? t("errorConnectFailed"));
        }
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setConnectError(t("errorNoRedirectUrl"));
    } catch {
      setConnectError(t("errorConnectFailed"));
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    repos,
    selectedRepo,
    setSelectedRepo,
    isLoadingRepos,
    isGithubConnected,
    isCheckingGithub,
    isConnecting,
    connectError,
    handleGithubConnect,
  };
}
