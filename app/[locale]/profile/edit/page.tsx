import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

// 프로필 편집은 /profile의 편집 모달에서 한다 — 예전 링크로 들어와도 거기로 보낸다
export default async function Page() {
  redirect({ href: "/profile", locale: await getLocale() });
}
