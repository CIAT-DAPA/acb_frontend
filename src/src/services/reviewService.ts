import { BaseAPIService } from "./apiConfig";
import {
  ReviewHistory,
  ReviewComment,
  CommentPayload,
  ReviewSession,
  ReviewCollaborationState,
  ReviewDecisionPayload,
} from "../types/review";

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

type AddCommentAPIResponse =
  | ReviewComment
  | APIResponse<ReviewComment>
  | {
      success?: boolean;
      message?: string;
      comment?: ReviewComment;
      data?: ReviewComment;
    };

const isReviewComment = (value: unknown): value is ReviewComment => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ReviewComment>;

  return (
    typeof candidate.text === "string" &&
    typeof candidate.author_id === "string" &&
    typeof candidate.created_at === "string" &&
    (typeof candidate.comment_id === "string" ||
      typeof candidate.id === "string")
  );
};

const extractCreatedComment = (
  response: AddCommentAPIResponse,
): ReviewComment => {
  if (isReviewComment(response)) {
    return response;
  }

  if (response.success === false) {
    throw new Error(response.message || "Unable to send the comment");
  }

  if (isReviewComment(response.data)) {
    return response.data;
  }

  if ("comment" in response && isReviewComment(response.comment)) {
    return response.comment;
  }

  throw new Error(
    response.message || "The server returned an invalid comment response",
  );
};

export class ReviewService extends BaseAPIService {
  static async submitForReview(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/submit-for-review`);
  }

  static async assignReviewer(
    bulletinId: string,
    reviewerId: string,
  ): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/assign-reviewer`, {
      reviewer_user_id: reviewerId,
    });
  }

  static async openReview(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/open-review`);
  }

  static async approveBulletin(
    bulletinId: string,
    options: ReviewDecisionPayload = {},
  ): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/approve`, {
      confirm_other_reviewers: options.confirm_other_reviewers ?? false,
    });
  }

  static async rejectBulletin(
    bulletinId: string,
    options: ReviewDecisionPayload = {},
  ): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/reject`, {
      confirm_other_reviewers: options.confirm_other_reviewers ?? false,
    });
  }

  static async reopenBulletin(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/reopen`);
  }

  static async publishDirect(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/publish-direct`);
  }

  static async archiveBulletin(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/archive`);
  }

  // ---------------------------------------------------------------------------
  // Presencia y estado de revisión colaborativa
  // ---------------------------------------------------------------------------

  static async createReviewSession(
    bulletinId: string,
    sessionId: string,
  ): Promise<ReviewSession> {
    return this.post<ReviewSession>(
      `/bulletins/reviews/${bulletinId}/sessions`,
      { session_id: sessionId },
    );
  }

  static async heartbeatReviewSession(
    bulletinId: string,
    sessionId: string,
  ): Promise<ReviewSession> {
    return this.patch<ReviewSession>(
      `/bulletins/reviews/${bulletinId}/sessions/${encodeURIComponent(
        sessionId,
      )}/heartbeat`,
    );
  }

  static async closeReviewSession(
    bulletinId: string,
    sessionId: string,
  ): Promise<void> {
    return this.delete(
      `/bulletins/reviews/${bulletinId}/sessions/${encodeURIComponent(
        sessionId,
      )}`,
    );
  }

  static async getCollaborationState(
    bulletinId: string,
  ): Promise<ReviewCollaborationState> {
    return this.get<ReviewCollaborationState>(
      `/bulletins/reviews/${bulletinId}/collaboration-state`,
    );
  }

  /**
   * Adds a comment or reply and normalizes the different successful response
   * shapes returned by the API. Consumers always receive a ReviewComment.
   */
  static async addComment(
    bulletinId: string,
    payload: CommentPayload,
  ): Promise<ReviewComment> {
    const response = await this.post<AddCommentAPIResponse>(
      `/bulletins/reviews/${bulletinId}/comments`,
      payload,
    );

    return extractCreatedComment(response);
  }

  static async editComment(
    bulletinId: string,
    commentId: string,
    text: string,
  ): Promise<ReviewComment> {
    return this.put<ReviewComment>(
      `/bulletins/reviews/${bulletinId}/comments/${commentId}`,
      { text },
    );
  }

  static async deleteComment(
    bulletinId: string,
    commentId: string,
  ): Promise<void> {
    return this.delete(
      `/bulletins/reviews/${bulletinId}/comments/${commentId}`,
    );
  }

  static async getReviewHistory(
    bulletinId: string,
  ): Promise<ReviewHistory | APIResponse<ReviewHistory>> {
    return this.get<ReviewHistory | APIResponse<ReviewHistory>>(
      `/bulletins/reviews/${bulletinId}/review-history`,
    );
  }
}
