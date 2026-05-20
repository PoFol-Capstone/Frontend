import { getPost, getRelatedPosts } from "@/lib/post";
import { getSessionUuid } from "@/lib/session";
import PostDetail from "./_components/PostDetail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [postResult, relatedPostsResult, currentUserUuid] = await Promise.all([
    getPost(id).then(
      (v) => ({ status: "fulfilled" as const, value: v }),
      (e) => ({ status: "rejected" as const, reason: e }),
    ),
    getRelatedPosts(id).then(
      (v) => ({ status: "fulfilled" as const, value: v }),
      () => ({ status: "rejected" as const, reason: null }),
    ),
    getSessionUuid(),
  ]);

  if (postResult.status === "rejected") throw postResult.reason;
  const post = postResult.value;
  const relatedPosts =
    relatedPostsResult.status === "fulfilled" ? relatedPostsResult.value : [];

  return (
    <PostDetail
      post={post}
      relatedPosts={relatedPosts}
      currentUserUuid={currentUserUuid}
    />
  );
}
