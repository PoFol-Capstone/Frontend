import { getPost } from "@/lib/post";
import { getSessionUuid } from "@/lib/session";
import { redirect } from "next/navigation";
import EditPostClient from "./_components/EditPostClient";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, currentUserUuid] = await Promise.all([getPost(id), getSessionUuid()]);

  if (!currentUserUuid || post.authorUuid !== currentUserUuid) {
    redirect(`/board/${id}`);
  }

  return <EditPostClient post={post} />;
}
