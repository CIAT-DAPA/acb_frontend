import { BaseAPIService } from "./apiConfig";
import { ReviewHistory, ReviewComment, CommentPayload } from "../types/review";

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export class ReviewService extends BaseAPIService {
  /**
   * Submit bulletin for review (DRAFT → PENDING_REVIEW)
   * Creates a new review cycle with the current version.
   */
  static async submitForReview(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/submit-for-review`);
  }

  /**
   * Assign a reviewer to the bulletin (Admin only)
   * Bulletin remains in PENDING_REVIEW until reviewer opens it.
   */
  static async assignReviewer(
    bulletinId: string,
    reviewerId: string,
  ): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/assign-reviewer`, {
      reviewer_id: reviewerId,
    });
  }

  /**
   * Open bulletin for review (PENDING_REVIEW → REVIEW)
   * Can be done by assigned reviewer or admin.
   */
  static async openReview(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/open-review`);
  }

  /**
   * Approve bulletin (REVIEW → PUBLISHED)
   * Can only be done by assigned reviewer or admin.
   */
  static async approveBulletin(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/approve`);
  }

  /**
   * Reject bulletin (REVIEW → REJECTED)
   * Requires at least one comment in the current cycle.
   * Can only be done by assigned reviewer or admin.
   */
  static async rejectBulletin(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/reject`);
  }

  /**
   * Reopen rejected bulletin for editing (REJECTED → DRAFT)
   */
  static async reopenBulletin(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/reopen`);
  }

  /**
   * Publish bulletin directly without review (DRAFT → PUBLISHED)
   * Admin only. For bulletins that don't need review.
   */
  static async publishDirect(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/publish-direct`);
  }

  /**
   * Archive published bulletin (PUBLISHED → ARCHIVED)
   * Admin only.
   */
  static async archiveBulletin(bulletinId: string): Promise<void> {
    return this.post(`/bulletins/reviews/${bulletinId}/archive`);
  }

  /**
   * Add a comment or reply to a bulletin review.
   */
  static async addComment(
    bulletinId: string,
    payload: CommentPayload,
  ): Promise<APIResponse<ReviewComment>> {
    return this.post<APIResponse<ReviewComment>>(
      `/bulletins/reviews/${bulletinId}/comments`,
      payload,
    );
  }

  /**
   * Edit a comment's text.
   * Only the original author can edit.
   */
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

  /**
   * Delete a comment.
   * Only the original author can delete.
   */
  static async deleteComment(
    bulletinId: string,
    commentId: string,
  ): Promise<void> {
    return this.delete(
      `/bulletins/reviews/${bulletinId}/comments/${commentId}`,
    );
  }

  /**
   * Get complete review history including all cycles and comments
   */
  static async getReviewHistory(
    bulletinId: string,
  ): Promise<APIResponse<ReviewHistory>> {
    return this.get<APIResponse<ReviewHistory>>(
      `/bulletins/reviews/${bulletinId}/review-history`,
    );
  }
}
