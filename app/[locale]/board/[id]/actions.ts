"use server";

import { deletePost } from "@/lib/post";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export async function deletePostAction(uuid: string) {
  await deletePost(uuid);
  redirect({ href: "/board", locale: await getLocale() });
}
