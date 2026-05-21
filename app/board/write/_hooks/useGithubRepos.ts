"use client";
import { startTransition, useEffect, useRef, useState } from "react";

export type Repo = { name: string; fullName: string };

export function useGithubRepos() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [isCheckingGithub, setIsCheckingGithub] = useState(true);
  const hasGithubError = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = new URL(window.location.href);

    if (params.get("github_error") === "true") {
      hasGithubError.current = true;
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
      .then(async (data) => {
        const connected = data.connected ?? false;
        setIsGithubConnected(connected);
        //git 연결 후
        // if (!connected && !hasGithubError.current) {
        //   try {
        //     const res = await fetch("/api/auth/github/connect");
        //     const connectData = await res.json();
        //     if (res.ok && connectData.redirectUrl) {
        //       window.location.href = connectData.redirectUrl;
        //     }
        //   } catch { /* ignore */ }
        // }
      })
      .catch(() => {})
      .finally(() => setIsCheckingGithub(false));
  }, []);

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
    try {
      const res = await fetch("/api/auth/github/connect");
      const data = await res.json();
      if (!res.ok) return;
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch { /* ignore */ }
  };

  return {
    repos,
    selectedRepo,
    setSelectedRepo,
    isLoadingRepos,
    isGithubConnected,
    isCheckingGithub,
    handleGithubConnect,
  };
}
