import { getPost } from "@/lib/post";
import { getSessionUuid } from "@/lib/session";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import EditPostClient from "./_components/EditPostClient";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, currentUserUuid] = await Promise.all([getPost(id), getSessionUuid()]);

  if (!currentUserUuid || post.authorUuid !== currentUserUuid) {
    redirect({ href: `/board/${id}`, locale: await getLocale() });
  }

  return <EditPostClient post={post} />;
}
