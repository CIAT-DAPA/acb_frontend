export interface ReviewComment {
  id: string; // The backend likely uses string IDs (ObjectId or UUID)
  bulletin_id: string;
  author_id: string;
  author_name: string; // Often included for display
  text: string;
  created_at: string;
  updated_at: string;
  is_editable: boolean;
  parent_id?: string; // For replies
  replies?: ReviewComment[];
}

export interface ReviewCycle {
  cycle_id: string;
  version: number;
  start_date: string;
  end_date?: string;
  status: "pending_review" | "review" | "rejected" | "published" | "archived";
  reviewer_id?: string;
  comments: ReviewComment[];
}

export interface ReviewHistory {
  bulletin_id: string;
  current_status: string;
  active_cycle?: ReviewCycle;
  past_cycles: ReviewCycle[];
}

export interface CommentPayload {
  text: string;
  parent_id?: string;
}
