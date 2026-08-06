export type ReviewElementType =
  | "section"
  | "block"
  | "field"
  | "list_item"
  | "list_item_field"
  | "card_item"
  | "card_block"
  | "card_field"
  | "header"
  | "footer"
  | "header_field"
  | "footer_field";

export interface CommentTargetElement {
  section_id?: string | null;
  block_id?: string | null;
  field_id?: string | null;

  // Listas
  item_index?: number | null;
  item_field_id?: string | null;

  // Cards
  card_index?: number | null;
  card_id?: string | null;

  card_block_index?: number | null;
  card_block_id?: string | null;

  card_field_index?: number | null;
  card_field_id?: string | null;

  // Datos de interfaz
  type?: ReviewElementType;
  id?: string;

  section_index?: number;
  block_index?: number;
  field_index?: number;

  display_name?: string;
}

export interface ReviewComment {
  id?: string;
  comment_id: string;
  bulletin_id?: string;
  bulletin_version_id?: string;

  author_id: string;
  author_first_name?: string;
  author_last_name?: string;
  author_name?: string;

  text: string;

  created_at: string;
  updated_at?: string;

  is_editable: boolean;

  parent_comment_id?: string | null;
  parent_id?: string;
  comment_path?: string;

  target_element?: CommentTargetElement;

  replies?: ReviewComment[];
  resolved?: boolean;
}

export interface ReviewCycle {
  bulletin_version_id: string;
  cycle_number: number;
  submitted_at: string;
  outcome?: string | null;
  completed_at?: string | null;

  // Legacy
  cycle_id?: string;
  version?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  reviewer?: string;

  comments?: ReviewComment[];
}

export interface CommentPayload {
  text: string;

  target_element?: Pick<
    CommentTargetElement,
    "section_id" | "block_id" | "field_id"
  >;

  parent_comment_id?: string;
}

export interface ReviewHistory {
  bulletin_master_id: string;
  id: string;

  review_cycles: ReviewCycle[];

  reviewer_user_id?: string | null;
  reviewer_first_name?: string | null;
  reviewer_last_name?: string | null;

  comments?: ReviewComment[];
  active_cycle?: ReviewCycle;

  log?: {
    created_at: string;
    creator_user_id: string;
    creator_first_name: string;
    creator_last_name: string;

    updated_at: string;
    updater_user_id: string;
    updater_first_name: string;
    updater_last_name: string;
  };

  // Legacy
  bulletin_id?: string;
  current_status?: string;
  past_cycles?: ReviewCycle[];
}

// -----------------------------------------------------------------------------
// Revisión colaborativa
// -----------------------------------------------------------------------------

export type BulletinReviewStatus =
  | "draft"
  | "pending_review"
  | "review"
  | "rejected"
  | "published"
  | "archived";

export type ReviewDecisionAction = "approved" | "rejected";

export interface ReviewSessionCreatePayload {
  session_id: string;
}

export interface ReviewDecisionPayload {
  confirm_other_reviewers?: boolean;
}

export interface ActiveReviewer {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  entered_at: string;
  last_seen_at: string;
  session_count: number;
  is_current_user: boolean;
}

export interface ReviewSession {
  session_id: string;
  bulletin_id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  entered_at: string;
  last_seen_at: string;
}

export interface ReviewFinalDecision {
  cycle_number: number;
  action: ReviewDecisionAction;
  target_status: BulletinReviewStatus | string;
  decided_by: string;
  decided_by_first_name?: string | null;
  decided_by_last_name?: string | null;
  decided_at: string;
}

export interface ReviewCollaborationState {
  bulletin_id: string;
  status: BulletinReviewStatus | string;
  cycle_number?: number | null;
  active_reviewers: ActiveReviewer[];
  final_decision?: ReviewFinalDecision | null;
}

export type ReviewConflictCode =
  | "OTHER_REVIEWERS_ACTIVE"
  | "REVIEW_ALREADY_FINALIZED"
  | "REVIEW_SESSION_ID_CONFLICT";

export interface ReviewConflictDetail {
  code: ReviewConflictCode;
  message: string;
  active_reviewers?: ActiveReviewer[];
  current_status?: BulletinReviewStatus | string;
  final_decision?: ReviewFinalDecision | null;
}

export interface ReviewConflictResponse {
  detail: ReviewConflictDetail;
}

export const isReviewConflictDetail = (
  value: unknown,
): value is ReviewConflictDetail => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ReviewConflictDetail>;

  return (
    typeof candidate.code === "string" && typeof candidate.message === "string"
  );
};
