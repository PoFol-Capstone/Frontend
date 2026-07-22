"use client";

import { Avatar } from "@/components/Avatar";
import {
  createComment,
  deleteComment,
  toggleCommentLike,
  updateComment,
} from "@/lib/comment";
import type { Comment } from "@/types/comment";
import type { Profile } from "@/types/user";
import { CornerDownRight, Heart, Pencil, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  postUuid: string;
  initialComments: Comment[];
  currentUserUuid: string | null;
  currentUser?: Profile | null;
};

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function applyLikeToggle(
  comments: Comment[],
  uuid: string,
  liked: boolean,
): Comment[] {
  return comments.map((c) => {
    if (c.uuid === uuid) {
      return {
        ...c,
        likeCount: liked ? c.likeCount + 1 : c.likeCount - 1,
      };
    }
    if (c.replies.length > 0) {
      return { ...c, replies: applyLikeToggle(c.replies, uuid, liked) };
    }
    return c;
  });
}

function applyDelete(
  comments: Comment[],
  uuid: string,
  deletedContentLabel: string,
): Comment[] {
  return comments.map((c) => {
    if (c.uuid === uuid) {
      return { ...c, deleted: true, content: deletedContentLabel };
    }
    if (c.replies.length > 0) {
      return {
        ...c,
        replies: applyDelete(c.replies, uuid, deletedContentLabel),
      };
    }
    return c;
  });
}

function applyUpdate(
  comments: Comment[],
  uuid: string,
  content: string,
): Comment[] {
  return comments.map((c) => {
    if (c.uuid === uuid) return { ...c, content };
    if (c.replies.length > 0) {
      return { ...c, replies: applyUpdate(c.replies, uuid, content) };
    }
    return c;
  });
}

function appendReply(
  comments: Comment[],
  parentUuid: string,
  reply: Comment,
): Comment[] {
  return comments.map((c) => {
    if (c.uuid === parentUuid) return { ...c, replies: [...c.replies, reply] };
    return c;
  });
}

type CommentItemProps = {
  comment: Comment;
  postUuid: string;
  currentUserUuid: string | null;
  isReply?: boolean;
  onLikeToggle: (uuid: string) => void;
  onDelete: (uuid: string) => void;
  onUpdate: (uuid: string, content: string) => void;
  onReplySubmit: (parentUuid: string, reply: Comment) => void;
};

function CommentItem({
  comment,
  postUuid,
  currentUserUuid,
  isReply = false,
  onLikeToggle,
  onDelete,
  onUpdate,
  onReplySubmit,
}: CommentItemProps) {
  const t = useTranslations("board.comment");
  const locale = useLocale();
  const [replyInput, setReplyInput] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [editInput, setEditInput] = useState(comment.content);
  const [isEditing, setIsEditing] = useState(false);

  const isOwner = !!currentUserUuid && currentUserUuid === comment.author.uuid;

  const handleReplySubmit = async () => {
    if (!replyInput.trim()) return;
    const newReply = await createComment(postUuid, replyInput, comment.uuid);
    onReplySubmit(comment.uuid, newReply);
    setReplyInput("");
    setShowReplyInput(false);
  };

  const handleEditSubmit = async () => {
    if (!editInput.trim() || editInput === comment.content) {
      setIsEditing(false);
      return;
    }
    await updateComment(comment.uuid, editInput);
    onUpdate(comment.uuid, editInput);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteComment(comment.uuid);
    onDelete(comment.uuid);
  };

  return (
    <div className={isReply ? "ml-12 mt-3" : ""}>
      <div className="flex gap-3">
        <Avatar
          src={null}
          name={comment.deleted ? "?" : comment.author.name}
          size="sm"
        />
        <div className="flex-1">
          {!comment.deleted && (
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm font-semibold">{comment.author.name}</p>
              <span className="text-xs text-gray-400">
                {formatDate(comment.createdAt, locale)}
              </span>
              {isOwner && !isEditing && (
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded p-1 text-gray-400 hover:text-gray-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                value={editInput}
                onChange={(e) => setEditInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSubmit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="flex-1 border-b border-gray-300 py-1 text-sm outline-none focus:border-black"
                autoFocus
              />
              <button
                type="button"
                onClick={handleEditSubmit}
                className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
              >
                {t("save")}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                {t("cancel")}
              </button>
            </div>
          ) : (
            <p
              className={`text-sm leading-6 ${comment.deleted ? "text-gray-400 italic" : "text-gray-700"}`}
            >
              {comment.content}
            </p>
          )}

          {!comment.deleted && (
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => onLikeToggle(comment.uuid)}
                className="flex items-center gap-1 transition hover:text-black"
              >
                <Heart className="h-4 w-4" />
                <span>{comment.likeCount}</span>
              </button>
              {!isReply && currentUserUuid && (
                <button
                  type="button"
                  onClick={() => setShowReplyInput((v) => !v)}
                  className="flex items-center gap-1 transition hover:text-black"
                >
                  <CornerDownRight className="h-4 w-4" />
                  {t("reply")}
                </button>
              )}
            </div>
          )}

          {showReplyInput && (
            <div className="mt-3 flex items-center gap-2">
              <input
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReplySubmit();
                }}
                placeholder={t("replyPlaceholder")}
                className="flex-1 border-b border-gray-200 py-1.5 text-sm outline-none focus:border-black"
                autoFocus
              />
              {replyInput.trim() && (
                <button
                  type="button"
                  onClick={handleReplySubmit}
                  className="flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  <Send className="h-3 w-3" />
                  {t("submit")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.uuid}
          comment={reply}
          postUuid={postUuid}
          currentUserUuid={currentUserUuid}
          isReply
          onLikeToggle={onLikeToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onReplySubmit={onReplySubmit}
        />
      ))}
    </div>
  );
}

export default function CommentSection({
  postUuid,
  initialComments,
  currentUserUuid,
  currentUser,
}: Props) {
  const t = useTranslations("board.comment");
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentInput, setCommentInput] = useState("");

  const totalCount = comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const newComment = await createComment(postUuid, commentInput);
    setComments((prev) => [...prev, newComment]);
    setCommentInput("");
  };

  const handleLikeToggle = async (uuid: string) => {
    const { liked } = await toggleCommentLike(uuid);
    setComments((prev) => applyLikeToggle(prev, uuid, liked));
  };

  const handleDelete = (uuid: string) => {
    setComments((prev) => applyDelete(prev, uuid, t("deletedContent")));
  };

  const handleUpdate = (uuid: string, content: string) => {
    setComments((prev) => applyUpdate(prev, uuid, content));
  };

  const handleReplySubmit = (parentUuid: string, reply: Comment) => {
    setComments((prev) => appendReply(prev, parentUuid, reply));
  };

  return (
    <section className="mt-10 border-t border-gray-100 pt-8">
      <h2 className="mb-5 text-lg font-bold">{t("count", { count: totalCount })}</h2>

      {currentUserUuid && (
        <div className="mb-6 flex items-center gap-3">
          <Avatar
            src={currentUser?.avatarUrl}
            name={currentUser?.name ?? "?"}
            size="sm"
          />
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddComment();
            }}
            placeholder={t("placeholder")}
            className="flex-1 border-b border-gray-200 py-2 text-sm outline-none focus:border-black"
          />
          {commentInput.trim() && (
            <button
              type="button"
              onClick={handleAddComment}
              className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
            >
              <Send className="h-3 w-3" />
              {t("submit")}
            </button>
          )}
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.uuid}
            comment={comment}
            postUuid={postUuid}
            currentUserUuid={currentUserUuid}
            onLikeToggle={handleLikeToggle}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onReplySubmit={handleReplySubmit}
          />
        ))}
      </div>
    </section>
  );
}
