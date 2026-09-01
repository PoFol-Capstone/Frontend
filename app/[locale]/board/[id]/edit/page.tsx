import { Suspense } from "react";
import { getPost } from "@/lib/post";
import { getSessionUuid } from "@/lib/session";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import EditPostClient from "./_components/EditPostClient";
import PostDetailLoading from "../loading";

type Props = { params: Promise<{ id: string }> };

export default function EditPostPage({ params }: Props) {
  return (
    <Suspense fallback={<PostDetailLoading />}>
      <EditPostContent params={params} />
    </Suspense>
  );
}

async function EditPostContent({ params }: Props) {
  const { id } = await params;
  const [post, currentUserUuid] = await Promise.all([
    getPost(id),
    getSessionUuid(),
  ]);

  if (!currentUserUuid || post.authorUuid !== currentUserUuid) {
    redirect({ href: `/board/${id}`, locale: await getLocale() });
  }

  return <EditPostClient post={post} />;
}
