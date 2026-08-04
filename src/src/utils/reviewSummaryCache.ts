import { ReviewService } from "@/services/reviewService";
import type { ReviewComment, ReviewHistory } from "@/types/review";

export interface ReviewSummary {
  reviewers: string[];
  hasComments: boolean;
}

export interface ReviewSummaryCandidate {
  bulletinId: string;
  cacheVersion?: string | number | null;
}

export interface ReviewSummaryBatchResult extends ReviewSummary {
  bulletinId: string;
}

interface StoredReviewSummary {
  expiresAt: number;
  summary: ReviewSummary;
}

interface LoadReviewSummaryBatchesOptions {
  batchSize?: number;
  onBatch: (results: ReviewSummaryBatchResult[]) => void;
  shouldContinue?: () => boolean;
}

const CACHE_PREFIX = "bulletin-review-summary:v1";
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 6;

const memoryCache = new Map<string, StoredReviewSummary>();
const inFlightRequests = new Map<string, Promise<ReviewSummary>>();

const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
  reviewers: [],
  hasComments: false,
};

const unwrapReviewHistory = (response: unknown): ReviewHistory | null => {
  const responseObject = response as Record<string, unknown> | null;
  const candidate =
    responseObject &&
    typeof responseObject === "object" &&
    "data" in responseObject
      ? responseObject.data
      : response;

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const history = candidate as Partial<ReviewHistory>;

  if (
    history.bulletin_master_id ||
    history.id ||
    Array.isArray(history.review_cycles) ||
    Array.isArray(history.comments)
  ) {
    return candidate as ReviewHistory;
  }

  return null;
};

const hasReviewComments = (history: ReviewHistory | null): boolean => {
  if (!history) {
    return false;
  }

  if (history.comments?.length) {
    return true;
  }

  if (history.active_cycle?.comments?.length) {
    return true;
  }

  return Boolean(
    history.review_cycles?.some((cycle) => Boolean(cycle.comments?.length)),
  );
};

const extractReviewerNames = (history: ReviewHistory | null): string[] => {
  if (!history) {
    return [];
  }

  const reviewers = new Map<string, string>();

  const addReviewer = (
    idValue?: unknown,
    firstNameValue?: unknown,
    lastNameValue?: unknown,
    displayNameValue?: unknown,
  ) => {
    const id = typeof idValue === "string" ? idValue.trim() : "";
    const firstName =
      typeof firstNameValue === "string" ? firstNameValue.trim() : "";
    const lastName =
      typeof lastNameValue === "string" ? lastNameValue.trim() : "";
    const explicitName =
      typeof displayNameValue === "string" ? displayNameValue.trim() : "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const name = fullName || explicitName || id;

    if (!name) {
      return;
    }

    const normalizedName = name.toLocaleLowerCase();
    const alreadyAddedByName = Array.from(reviewers.values()).some(
      (existingName) => existingName.toLocaleLowerCase() === normalizedName,
    );

    if (alreadyAddedByName) {
      return;
    }

    const key = id ? `id:${id}` : `name:${normalizedName}`;
    const existingValue = reviewers.get(key);

    if (!existingValue || existingValue === id) {
      reviewers.set(key, name);
    }
  };

  addReviewer(
    history.reviewer_user_id,
    history.reviewer_first_name,
    history.reviewer_last_name,
  );

  const addCycleReviewer = (cycleValue: unknown) => {
    if (!cycleValue || typeof cycleValue !== "object") {
      return;
    }

    const cycle = cycleValue as Record<string, unknown>;
    const reviewer = cycle.reviewer;

    addReviewer(
      cycle.reviewer_user_id,
      cycle.reviewer_first_name,
      cycle.reviewer_last_name,
      cycle.reviewer_name,
    );

    if (typeof reviewer === "string") {
      addReviewer(undefined, undefined, undefined, reviewer);
      return;
    }

    if (reviewer && typeof reviewer === "object") {
      const reviewerObject = reviewer as Record<string, unknown>;

      addReviewer(
        reviewerObject.user_id ?? reviewerObject.id ?? reviewerObject._id,
        reviewerObject.first_name,
        reviewerObject.last_name,
        reviewerObject.name ?? reviewerObject.full_name,
      );
    }
  };

  history.review_cycles?.forEach(addCycleReviewer);

  if (history.active_cycle) {
    addCycleReviewer(history.active_cycle);
  }

  const addRootCommentAuthor = (comment: ReviewComment) => {
    if (comment.parent_comment_id || comment.parent_id) {
      return;
    }

    addReviewer(
      comment.author_id,
      comment.author_first_name,
      comment.author_last_name,
      comment.author_name,
    );
  };

  history.comments?.forEach(addRootCommentAuthor);
  history.active_cycle?.comments?.forEach(addRootCommentAuthor);
  history.review_cycles?.forEach((cycle) =>
    cycle.comments?.forEach(addRootCommentAuthor),
  );

  return Array.from(reviewers.values());
};

const buildCacheKey = ({
  bulletinId,
  cacheVersion,
}: ReviewSummaryCandidate): string => {
  const normalizedVersion =
    cacheVersion === null || cacheVersion === undefined || cacheVersion === ""
      ? "unversioned"
      : String(cacheVersion);

  return `${CACHE_PREFIX}:${bulletinId}:${normalizedVersion}`;
};

const readSessionCache = (cacheKey: string): StoredReviewSummary | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(cacheKey);

    if (!rawValue) {
      return null;
    }

    const cached = JSON.parse(rawValue) as StoredReviewSummary;

    if (
      typeof cached.expiresAt !== "number" ||
      cached.expiresAt <= Date.now() ||
      !cached.summary ||
      !Array.isArray(cached.summary.reviewers)
    ) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return cached;
  } catch {
    return null;
  }
};

const writeSessionCache = (
  cacheKey: string,
  cachedValue: StoredReviewSummary,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(cachedValue));
  } catch {
    // Storage can be unavailable or full. The in-memory cache still works.
  }
};

const readCachedSummary = (cacheKey: string): ReviewSummary | null => {
  const memoryValue = memoryCache.get(cacheKey);

  if (memoryValue && memoryValue.expiresAt > Date.now()) {
    return memoryValue.summary;
  }

  if (memoryValue) {
    memoryCache.delete(cacheKey);
  }

  const sessionValue = readSessionCache(cacheKey);

  if (sessionValue) {
    memoryCache.set(cacheKey, sessionValue);
    return sessionValue.summary;
  }

  return null;
};

const cacheSummary = (cacheKey: string, summary: ReviewSummary): void => {
  const cachedValue: StoredReviewSummary = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    summary,
  };

  memoryCache.set(cacheKey, cachedValue);
  writeSessionCache(cacheKey, cachedValue);
};

export const getReviewSummary = async (
  candidate: ReviewSummaryCandidate,
): Promise<ReviewSummary> => {
  const cacheKey = buildCacheKey(candidate);
  const cachedSummary = readCachedSummary(cacheKey);

  if (cachedSummary) {
    return cachedSummary;
  }

  const existingRequest = inFlightRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = ReviewService.getReviewHistory(candidate.bulletinId)
    .then((response) => {
      const history = unwrapReviewHistory(response);
      const summary: ReviewSummary = {
        reviewers: extractReviewerNames(history),
        hasComments: hasReviewComments(history),
      };

      cacheSummary(cacheKey, summary);
      return summary;
    })
    .catch(() => {
      cacheSummary(cacheKey, EMPTY_REVIEW_SUMMARY);
      return EMPTY_REVIEW_SUMMARY;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
};

export const loadReviewSummaryBatches = async (
  candidates: ReviewSummaryCandidate[],
  options: LoadReviewSummaryBatchesOptions,
): Promise<void> => {
  const batchSize = Math.max(1, options.batchSize ?? DEFAULT_BATCH_SIZE);

  for (let index = 0; index < candidates.length; index += batchSize) {
    if (options.shouldContinue && !options.shouldContinue()) {
      return;
    }

    const batch = candidates.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map(async (candidate): Promise<ReviewSummaryBatchResult> => {
        const summary = await getReviewSummary(candidate);

        return {
          bulletinId: candidate.bulletinId,
          ...summary,
        };
      }),
    );

    if (options.shouldContinue && !options.shouldContinue()) {
      return;
    }

    options.onBatch(results);
  }
};
