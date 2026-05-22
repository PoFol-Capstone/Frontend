"use client";
import { startTransition, useEffect, useRef, useState } from "react";

export type Repo = { name: string; fullName: string };

export function useGithubRepos() {
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
          ? "이미 다른 계정에 연결된 GitHub 계정입니다."
          : "GitHub 연결에 실패했습니다. 다시 시도해주세요.",
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
    setIsConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/auth/github/connect");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setConnectError("로그인 후 이용해주세요.");
        } else {
          setConnectError(data.error ?? "GitHub 연결 요청에 실패했습니다.");
        }
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setConnectError("GitHub 연결 URL을 받지 못했습니다.");
    } catch {
      setConnectError("GitHub 연결 요청에 실패했습니다.");
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
