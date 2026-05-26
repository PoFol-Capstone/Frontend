import { getComments } from "@/lib/comment";
import { getPost, getRelatedPosts } from "@/lib/post";
import { getSessionUuid } from "@/lib/session";
import getUser from "@/lib/user";
import PostDetail from "./_components/PostDetail/index";
import getUser from "@/lib/user";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [postResult, relatedPostsResult, commentsResult, currentUserUuid] =
    await Promise.all([
      getPost(id).then(
        (v) => ({ status: "fulfilled" as const, value: v }),
        (e) => ({ status: "rejected" as const, reason: e }),
      ),
      getRelatedPosts(id).then(
        (v) => ({ status: "fulfilled" as const, value: v }),
        () => ({ status: "rejected" as const, reason: null }),
      ),
      getComments(id).then(
        (v) => ({ status: "fulfilled" as const, value: v }),
        () => ({ status: "rejected" as const, reason: null }),
      ),
      getSessionUuid(),
    ]);

  if (postResult.status === "rejected") throw postResult.reason;
  const post = postResult.value;
  const relatedPosts =
    relatedPostsResult.status === "fulfilled" ? relatedPostsResult.value : [];
  const initialComments =
    commentsResult.status === "fulfilled" ? commentsResult.value : [];

  const currentUser = currentUserUuid
    ? await getUser(currentUserUuid).catch(() => null)
    : null;

  return (
    <PostDetail
      post={post}
      relatedPosts={relatedPosts}
      initialComments={initialComments}
      currentUserUuid={currentUserUuid}
      currentUser={currentUser}
    />
  );
}
