"use client";

import type { Comment } from "@/types/comment";
import type { ResponsePosts } from "@/types/post";
import { LinkType } from "@/types/post";
import type { Profile } from "@/types/user";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePostAction } from "../../actions";
import ApplicationSection from "../ApplicationSection";
import CommentSection from "../CommentSection";
import RelatedPosts from "../RelatedPosts";
import AuthorBar from "./AuthorBar";
import DeleteModal from "./DeleteModal";
import PostContent from "./PostContent";
import PostHero from "./PostHero";

type Props = {
  post: ResponsePosts;
  relatedPosts: ResponsePosts[];
  initialComments: Comment[];
  currentUserUuid?: string | null;
  currentUser?: Profile | null;
};

export default function PostDetail({
  post,
  relatedPosts,
  initialComments,
  currentUserUuid,
  currentUser,
}: Props) {
  console.log(post);
  const router = useRouter();

  // 작성자 확인
  const isAuthor = !!currentUserUuid && currentUserUuid === post.authorUuid;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePostAction(post.uuid);
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const deployUrl = post.links?.find((l) => l.type === LinkType.DEPLOY)?.url;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-8">
      {showDeleteConfirm && (
        <DeleteModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
        <section>
          <PostHero
            thumbnailUrl={post.thumbnailUrl}
            title={post.title}
            skills={post.skills}
            deployUrl={deployUrl}
          />

          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            {isAuthor && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => router.push(`/board/${post.uuid}/edit`)}
                  className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="게시글 수정"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-full p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="게시글 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <PostContent
            content={post.content}
            tags={post.tags}
            links={post.links ?? []}
            postType={post.postType}
            recruitPositionInfos={post.recruitPositionInfos}
          />

          <AuthorBar
            postUuid={post.uuid}
            authorUuid={post.authorUuid}
            authorName={post.authorName}
            viewCount={post.viewCount}
            initialLikeCount={post.likeCount}
          />

          <ApplicationSection
            postUuid={post.uuid}
            postType={post.postType}
            recruitPositions={post.recruitPositionInfos}
            isAuthor={isAuthor}
          />

          <CommentSection
            postUuid={post.uuid}
            initialComments={initialComments}
            currentUserUuid={currentUserUuid ?? null}
            currentUser={currentUser ?? null}
          />
        </section>

        <RelatedPosts relatedPosts={relatedPosts} />
      </div>
    </main>
  );
}
