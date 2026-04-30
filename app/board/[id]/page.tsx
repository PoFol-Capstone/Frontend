import { getPost, getRelatedPosts } from "@/lib/post";
import PostDetail from "./_components/PostDetail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, relatedPosts] = await Promise.all([
    getPost(id),
    getRelatedPosts(id),
  ]);

  return <PostDetail post={post} relatedPosts={relatedPosts} />;
}
