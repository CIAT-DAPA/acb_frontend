export interface CommentTargetElement {
  section_id?: string | null;
  block_id?: string | null;
  field_id?: string | null;
  // Legacy or frontend-only properties effectively
  type?:
    | "section"
    | "block"
    | "field"
    | "header"
    | "footer"
    | "header_field"
    | "footer_field";
  id?: string; // Frontend ID like section-0
  section_index?: number;
  block_index?: number;
  field_index?: number;
  display_name?: string; // Name of the element (e.g., block, field, etc.)
}

export interface ReviewComment {
  id?: string; // Legacy ID support if needed or map comment_id to it
  comment_id: string;
  bulletin_id?: string; // Not present in sample but might be useful
  bulletin_version_id?: string;
  author_id: string;
  author_first_name?: string;
  author_last_name?: string;
  author_name?: string; // For compatibility
  text: string;
  created_at: string;
  updated_at?: string;
  is_editable: boolean;
  parent_comment_id?: string | null;
  parent_id?: string; // For compatibility
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
  // Legacy fields (make optional or remove if not returned anymore)
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
  target_element?: {
    section_id?: string;
    block_id?: string;
    field_id?: string;
  };
  parent_comment_id?: string;
}

export interface ReviewHistory {
  bulletin_master_id: string;
  id: string; // This looks like the review process ID
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

  // Legacy fields
  bulletin_id?: string;
  current_status?: string;
  past_cycles?: ReviewCycle[];
}
