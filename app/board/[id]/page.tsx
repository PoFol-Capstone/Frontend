import { getPost } from "@/lib/post";
import PostDetail from "./_components/PostDetail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  return <PostDetail post={post} relatedPosts={[]} />;
}
