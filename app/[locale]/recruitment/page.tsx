import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

// 팀원 모집 숨김 1단계 (docs/2026-11-06-pivot-review-community.md 1.3) — 저장된 주소 · 알림 링크가 깨지지 않게 게시판으로 보낸다.
// 모집 관리 화면 코드(_components, actions)는 2단계 코드 삭제 때 함께 지운다. 이전 페이지는 git 기록에 있다.
export default async function RecruitmentPage() {
  redirect({ href: "/board", locale: await getLocale() });
}
