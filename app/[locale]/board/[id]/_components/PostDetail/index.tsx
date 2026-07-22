"use client";

import type { Comment } from "@/types/comment";
import type { ResponsePosts } from "@/types/post";
import { LinkType } from "@/types/post";
import type { Profile } from "@/types/user";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("board.detail");
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
            deployUrl={deployUrl}
          />

          <div className="mb-6">
            <div className="mb-3 flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
              {isAuthor && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => router.push(`/board/${post.uuid}/edit`)}
                    className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label={t("editPost")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-full p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label={t("deletePost")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {post.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                  >
                    {skill.name}
                  </span>
                ))}
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

          <ApplicationSection
            postUuid={post.uuid}
            postType={post.postType}
            recruitPositions={post.recruitPositionInfos}
            isAuthor={isAuthor}
          />

          <AuthorBar
            postUuid={post.uuid}
            authorUuid={post.authorUuid}
            authorName={post.authorName}
            isAuthor={isAuthor}
            viewCount={post.viewCount}
            initialLikeCount={post.likeCount}
            initialIsLiked={post.isLiked}
            initialIsBookmarked={post.isBookmarked}
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
