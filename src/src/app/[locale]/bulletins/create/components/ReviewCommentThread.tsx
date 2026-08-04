"use client";

import React, { useState } from "react";
import { Loader2, MessageCircleReply, Send, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { BulletinComment } from "../../../../../types/bulletin";

interface ReviewCommentThreadProps {
  comments: BulletinComment[];
  onReply?: (commentId: string, text: string) => Promise<void>;
}

const getCommentId = (comment: BulletinComment): string => comment.comment_id;

const getAuthorName = (comment: BulletinComment, fallback: string): string => {
  const fullName = [comment.author_first_name, comment.author_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || fallback;
};

export function ReviewCommentThread({
  comments,
  onReply,
}: ReviewCommentThreadProps) {
  const t = useTranslations("CreateBulletin.comments");
  const locale = useLocale();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const formatDate = (value?: string | Date): string => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const openReplyForm = (commentId: string) => {
    setActiveReplyId(commentId);
    setReplyText("");
    setValidationError(null);
  };

  const closeReplyForm = () => {
    if (submittingReplyId) return;

    setActiveReplyId(null);
    setReplyText("");
    setValidationError(null);
  };

  const submitReply = async (
    event: React.FormEvent<HTMLFormElement>,
    commentId: string,
  ) => {
    event.preventDefault();

    const normalizedText = replyText.trim();
    if (!normalizedText) {
      setValidationError(t("replyRequired"));
      return;
    }

    if (!onReply) return;

    setSubmittingReplyId(commentId);
    setValidationError(null);

    try {
      await onReply(commentId, normalizedText);
      setActiveReplyId(null);
      setReplyText("");
    } catch {
      // El callback muestra el toast de error. Se conserva el texto para reintentar.
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const renderCommentNode = (
    comment: BulletinComment,
    depth: number,
  ): React.ReactNode => {
    const commentId = getCommentId(comment);
    const isReplying = activeReplyId === commentId;
    const isSubmitting = submittingReplyId === commentId;
    const isRootComment = depth === 0;
    const authorFallback = isRootComment
      ? t("reviewerFallback")
      : t("authorFallback");

    return (
      <article
        key={commentId}
        className={
          isRootComment
            ? "border-b border-yellow-200 pb-3 last:border-0 last:pb-0"
            : "rounded-md border border-yellow-100 bg-white/70 p-3"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`text-xs font-semibold ${
              isRootComment ? "text-yellow-900" : "text-yellow-800"
            }`}
          >
            {getAuthorName(comment, authorFallback)}
          </span>

          <time
            className={`shrink-0 text-[10px] ${
              isRootComment ? "text-yellow-700/70" : "text-gray-500"
            }`}
          >
            {formatDate(comment.created_at)}
          </time>
        </div>

        <p
          className={`mt-1 whitespace-pre-wrap leading-relaxed ${
            isRootComment ? "text-sm text-gray-800" : "text-xs text-gray-700"
          }`}
        >
          {comment.text}
        </p>

        {onReply && commentId && !isReplying && (
          <button
            type="button"
            onClick={() => openReplyForm(commentId)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#606c38] transition-colors hover:bg-[#606c38]/10 hover:text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#ffaf68]"
            aria-label={t("replyToComment")}
          >
            <MessageCircleReply className="h-3.5 w-3.5" />
            {t("reply")}
          </button>
        )}

        {onReply && commentId && isReplying && (
          <form
            onSubmit={(event) => submitReply(event, commentId)}
            className="mt-3 rounded-lg border border-[#283618]/15 bg-white p-3"
          >
            <label
              htmlFor={`review-reply-${commentId}`}
              className="mb-1.5 block text-xs font-medium text-[#283618]"
            >
              {t("replyLabel")}
            </label>

            <textarea
              id={`review-reply-${commentId}`}
              value={replyText}
              onChange={(event) => {
                setReplyText(event.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={t("replyPlaceholder")}
              rows={3}
              maxLength={2000}
              autoFocus
              disabled={isSubmitting}
              className="w-full resize-y rounded-md border border-[#283618]/20 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#606c38] focus:ring-2 focus:ring-[#ffaf68]/50 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

            {validationError && (
              <p className="mt-1 text-xs text-red-600">{validationError}</p>
            )}

            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeReplyForm}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#283618]/20 px-3 py-1.5 text-xs font-medium text-[#283618] transition-colors hover:bg-[#283618]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                {t("cancelReply")}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#283618] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#606c38] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isSubmitting ? t("sendingReply") : t("sendReply")}
              </button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-yellow-300 pl-3">
            {comment.replies.map((reply) =>
              renderCommentNode(reply, depth + 1),
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-3">
      {comments.map((comment) => renderCommentNode(comment, 0))}
    </div>
  );
}
