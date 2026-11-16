import { FaGithub } from "react-icons/fa";

/**
 * GitHub 로그인 시작 — 로그인과 레포 연동이 한 번에 끝난다.
 * locale이 붙지 않는 백엔드 경로(next.config rewrite)라 i18n Link가 아닌 <a>로 이동한다.
 * 시작 · 콜백 · 교환이 모두 이 프론트 호스트를 거쳐야 oauth_binding 쿠키가 이어진다.
 */
export default function GithubLoginButton({ label }: { label: string }) {
  return (
    // 페이지가 아니라 백엔드 302(→ github.com)라 전체 페이지 이동이어야 한다
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      href="/api/auth/github"
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 text-[15px] font-semibold text-white transition hover:opacity-90"
    >
      <FaGithub className="h-5 w-5" aria-hidden />
      {label}
    </a>
  );
}
