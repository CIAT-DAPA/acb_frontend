"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/components/Toast";
import {
  btnOutlineSecondary,
  btnPrimary,
  container,
  pageSubtitle,
  pageTitle,
} from "../components/ui";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, FileStack, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BulletinMaster, BulletinStatus } from "@/types/bulletin";
import type { ReviewComment, ReviewHistory } from "@/types/review";
import BulletinAPIService from "@/services/bulletinService";
import { TemplateAPIService } from "@/services/templateService";
import { ReviewService } from "@/services/reviewService";
import ItemCard from "../components/ItemCard";
import { DuplicateItemModal } from "../components/DuplicateItemModal";
import {
  BulletinFilters,
  REVIEW_STATUS_FILTERS,
} from "../components/BulletinFilters";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const REVIEW_PAGE_STATUSES = new Set<BulletinStatus>([
  "pending_review",
  "review",
  "rejected",
  "published",
]);

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
    const existingNameEntry = Array.from(reviewers.entries()).find(
      ([, existingName]) => existingName.toLocaleLowerCase() === normalizedName,
    );

    if (existingNameEntry) {
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

export default function ReviewsPage() {
  const t = useTranslations("Bulletins");
  const tNavbar = useTranslations("Navbar");
  const locale = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const { can } = usePermissions();
  const { authenticated, loading: authLoading } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<BulletinStatus | "all">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulletins, setBulletins] = useState<BulletinMaster[]>([]);
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({});
  const [templateNameMachineMap, setTemplateNameMachineMap] = useState<
    Record<string, string>
  >({});
  const [templateThumbnailsMap, setTemplateThumbnailsMap] = useState<
    Record<string, string[]>
  >({});
  const [reviewersMap, setReviewersMap] = useState<Record<string, string[]>>(
    {},
  );

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{ url: string } | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [bulletinToDuplicate, setBulletinToDuplicate] =
    useState<BulletinMaster | null>(null);
  const [duplicateBulletinName, setDuplicateBulletinName] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bulletinToDelete, setBulletinToDelete] =
    useState<BulletinMaster | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.title = `Bulletin builder - ${tNavbar("reviews")}`;
  }, [tNavbar]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authenticated) {
      setLoading(false);
      setError(null);
      return;
    }

    void loadBulletins();
  }, [authLoading, authenticated]);

  const loadBulletins = async () => {
    setLoading(true);
    setError(null);
    setReviewersMap({});

    try {
      const response = await BulletinAPIService.getBulletins();

      if (!response.success) {
        setError(response.message || "Error al cargar los boletines");
        return;
      }

      const sortedBulletins = [...response.data].sort(
        (bulletinA, bulletinB) => {
          const dateA = new Date(
            bulletinA.log.updated_at || bulletinA.log.created_at || 0,
          ).getTime();
          const dateB = new Date(
            bulletinB.log.updated_at || bulletinB.log.created_at || 0,
          ).getTime();

          return dateB - dateA;
        },
      );

      const historyCandidates = sortedBulletins.filter(
        (bulletin) =>
          Boolean(bulletin._id) &&
          (bulletin.status === "draft" ||
            REVIEW_PAGE_STATUSES.has(bulletin.status) ||
            REVIEW_STATUS_FILTERS.includes(bulletin.status)),
      );

      const historyResults = await Promise.all(
        historyCandidates.map(async (bulletin) => {
          const bulletinId = bulletin._id as string;

          try {
            const historyResponse =
              await ReviewService.getReviewHistory(bulletinId);
            const history = unwrapReviewHistory(historyResponse);

            return {
              bulletinId,
              hasComments: hasReviewComments(history),
              reviewers: extractReviewerNames(history),
            };
          } catch {
            // Un draft que nunca fue revisado puede no tener historial todavía.
            return {
              bulletinId,
              hasComments: false,
              reviewers: [] as string[],
            };
          }
        }),
      );

      const reviewedDraftIds = new Set<string>();
      const newReviewersMap: Record<string, string[]> = {};

      historyResults.forEach(({ bulletinId, hasComments, reviewers }) => {
        if (hasComments) {
          reviewedDraftIds.add(bulletinId);
        }

        if (reviewers.length > 0) {
          newReviewersMap[bulletinId] = reviewers;
        }
      });

      const reviewBulletins = sortedBulletins.filter((bulletin) => {
        if (bulletin.status === "draft") {
          return Boolean(bulletin._id && reviewedDraftIds.has(bulletin._id));
        }

        return (
          REVIEW_PAGE_STATUSES.has(bulletin.status) ||
          REVIEW_STATUS_FILTERS.includes(bulletin.status)
        );
      });

      setBulletins(reviewBulletins);
      setReviewersMap(newReviewersMap);

      const templateIds = [
        ...new Set(
          reviewBulletins
            .map((bulletin) => bulletin.base_template_master_id)
            .filter(Boolean),
        ),
      ];

      if (templateIds.length === 0) {
        setTemplatesMap({});
        setTemplateNameMachineMap({});
        setTemplateThumbnailsMap({});
        return;
      }

      const templatesResponse = await Promise.all(
        templateIds.map((id) =>
          TemplateAPIService.getTemplateById(id).catch(() => null),
        ),
      );

      const newTemplatesMap: Record<string, string> = {};
      const newTemplateNameMachineMap: Record<string, string> = {};
      const newThumbnailsMap: Record<string, string[]> = {};

      templatesResponse.forEach((templateResponse) => {
        if (templateResponse?.success && templateResponse.data) {
          const template = templateResponse.data as any;
          newTemplatesMap[template._id!] = template.template_name;
          newTemplateNameMachineMap[template._id!] = template.name_machine;
          newThumbnailsMap[template._id!] = template.thumbnail_images || [];
        }
      });

      setTemplatesMap(newTemplatesMap);
      setTemplateNameMachineMap(newTemplateNameMachineMap);
      setTemplateThumbnailsMap(newThumbnailsMap);
    } catch {
      setError("Error de conexión al cargar los boletines");
    } finally {
      setLoading(false);
    }
  };

  const filteredBulletins = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bulletins.filter((bulletin) => {
      const templateName = templatesMap[bulletin.base_template_master_id] || "";

      const matchesSearch =
        !term ||
        bulletin.bulletin_name.toLowerCase().includes(term) ||
        templateName.toLowerCase().includes(term);

      const matchesStatus =
        selectedStatus === "all" || bulletin.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, selectedStatus, bulletins, templatesMap]);

  const uniqueFilteredBulletins = useMemo(
    () =>
      filteredBulletins.filter(
        (bulletin, index, array) =>
          Boolean(bulletin._id) &&
          array.findIndex((item) => item._id === bulletin._id) === index,
      ),
    [filteredBulletins],
  );

  const handleDuplicateBulletin = (bulletin: BulletinMaster) => {
    setBulletinToDuplicate(bulletin);
    setDuplicateBulletinName(`${bulletin.bulletin_name} - ${t("copySuffix")}`);
    setShowDuplicateModal(true);
  };

  const handleCloseDuplicateModal = () => {
    if (!isDuplicating) {
      setShowDuplicateModal(false);
      setBulletinToDuplicate(null);
      setDuplicateBulletinName("");
      setIsDuplicating(false);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!bulletinToDuplicate?._id) {
      return;
    }

    setIsDuplicating(true);

    try {
      const response = await BulletinAPIService.cloneBulletin(
        bulletinToDuplicate._id,
        {
          bulletin_name: duplicateBulletinName.trim(),
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Error al duplicar el boletín");
      }

      showToast(
        t("duplicateSuccess", { name: duplicateBulletinName }),
        "success",
        3000,
      );
      await loadBulletins();
      handleCloseDuplicateModal();
    } catch (duplicateError) {
      console.error("Error duplicating bulletin:", duplicateError);
      showToast(
        t("duplicateError", {
          name: bulletinToDuplicate.bulletin_name,
          error:
            duplicateError instanceof Error
              ? duplicateError.message
              : "Error desconocido",
        }),
        "error",
        5000,
      );
      setIsDuplicating(false);
    }
  };

  const handleDeleteBulletin = (bulletin: BulletinMaster) => {
    setBulletinToDelete(bulletin);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setBulletinToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bulletinToDelete?._id) {
      return;
    }

    const bulletinId = bulletinToDelete._id;
    const bulletinName = bulletinToDelete.bulletin_name;
    setIsDeleting(true);

    try {
      await ReviewService.archiveBulletin(bulletinId);
      showToast(t("deleteSuccess", { name: bulletinName }), "success", 3000);
      setShowDeleteModal(false);
      setBulletinToDelete(null);
      await loadBulletins();
    } catch (deleteError) {
      console.error("Error archiving bulletin:", deleteError);
      showToast(
        t("deleteError", {
          name: bulletinName,
          error:
            deleteError instanceof Error
              ? deleteError.message
              : "Unknown error",
        }),
        "error",
        5000,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute
      requiredPermission={{
        action: PERMISSION_ACTIONS.Read,
        module: MODULES.REVIEW,
      }}
    >
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={pageTitle}>{t("reviewsPageTitle")}</h1>
                <p className={pageSubtitle}>{t("reviewsPageSubtitle")}</p>
              </div>

              <div className="hidden -rotate-12 lg:block">
                <Image
                  src="/assets/img/bol3.jpg"
                  alt="Reviews dashboard"
                  width={150}
                  height={319}
                  className="object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        <div className={`${container} py-8`}>
          <BulletinFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            statusOptions={REVIEW_STATUS_FILTERS}
            className="mb-8 space-y-4"
          />

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffaf68]" />
              <span className="ml-2 text-[#283618]/60">{t("loading")}</span>
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="mb-4 text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadBulletins()}
                className={btnPrimary}
              >
                {t("retry")}
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {uniqueFilteredBulletins.map((bulletin, index) => {
                const status = bulletin.status;
                const isPublished = status === "published";
                const isReviewEditable =
                  status === "pending_review" || status === "review";

                const allowedGroups =
                  bulletin.access_config?.allowed_groups || [];
                const canUpdateBulletin = can(
                  PERMISSION_ACTIONS.Update,
                  MODULES.BULLETINS_COMPOSER,
                  allowedGroups,
                );
                const canDeleteBulletin = can(
                  PERMISSION_ACTIONS.Delete,
                  MODULES.BULLETINS_COMPOSER,
                  allowedGroups,
                );

                // En Reviews:
                // - pending_review/review: entrar al flujo de revisión.
                // - published: mismas acciones que en Bulletins.
                // - rejected: ninguna acción.
                const showReviewEditBtn = isReviewEditable;
                const showViewBtn = isPublished;
                const showDuplicateBtn = isPublished && canUpdateBulletin;
                const showShareBtn = isPublished;
                const showDeleteBtn = isPublished && canDeleteBulletin;

                const templateNameMachine =
                  templateNameMachineMap[bulletin.base_template_master_id];
                const bulletinViewerUrl =
                  templateNameMachine && bulletin.name_machine
                    ? `/${locale}/${templateNameMachine}/${bulletin.name_machine}`
                    : null;

                const handleView = () => {
                  if (bulletinViewerUrl) {
                    window.location.href = bulletinViewerUrl;
                  }
                };

                const handleShare = () => {
                  if (bulletinViewerUrl) {
                    const url = `${window.location.origin}${bulletinViewerUrl}`;
                    setShareData({ url });
                    setShowShareModal(true);
                  }
                };

                const creatorName =
                  bulletin.log.creator_first_name &&
                  bulletin.log.creator_last_name
                    ? `${bulletin.log.creator_first_name} ${bulletin.log.creator_last_name}`
                    : bulletin.log.creator_first_name ||
                      bulletin.log.creator_last_name ||
                      bulletin.log.creator_user_id;

                const lastModified =
                  bulletin.log.updated_at || bulletin.log.created_at;

                return (
                  <ItemCard
                    key={bulletin._id || `bulletin-${index}`}
                    type="template"
                    id={bulletin._id!}
                    name={bulletin.bulletin_name}
                    author={creatorName}
                    reviewers={
                      bulletin._id ? reviewersMap[bulletin._id] : undefined
                    }
                    lastModified={
                      lastModified
                        ? new Date(lastModified).toLocaleDateString()
                        : ""
                    }
                    templateBaseName={
                      templatesMap[bulletin.base_template_master_id]
                    }
                    status={bulletin.status}
                    thumbnailImages={
                      templateThumbnailsMap[bulletin.base_template_master_id] ||
                      []
                    }
                    previewBtn={showViewBtn}
                    onPreview={showViewBtn ? handleView : undefined}
                    editBtn={showReviewEditBtn}
                    onEdit={
                      showReviewEditBtn
                        ? () => router.push(`/reviews/${bulletin._id}`)
                        : undefined
                    }
                    duplicateBtn={showDuplicateBtn}
                    onDuplicate={
                      showDuplicateBtn
                        ? () => handleDuplicateBulletin(bulletin)
                        : undefined
                    }
                    isDuplicating={
                      isDuplicating && bulletinToDuplicate?._id === bulletin._id
                    }
                    shareBtn={showShareBtn}
                    onShare={showShareBtn ? handleShare : undefined}
                    deleteBtn={showDeleteBtn}
                    onDelete={
                      showDeleteBtn
                        ? () => handleDeleteBulletin(bulletin)
                        : undefined
                    }
                    isDeleting={
                      isDeleting && bulletinToDelete?._id === bulletin._id
                    }
                  />
                );
              })}
            </div>
          )}

          {!loading && !error && uniqueFilteredBulletins.length === 0 && (
            <div className="py-12 text-center">
              <p className="mb-4 text-[#283618]/60">{t("reviewsNotFound")}</p>
            </div>
          )}
        </div>
      </main>

      {showShareModal && shareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold text-[#283618]">
              {t("shareModal.title")}
            </h2>
            <p className="mb-6 text-[#606c38]">{t("shareModal.message")}</p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-[#283618]">
                {t("shareModal.urlLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareData.url}
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-[#283618]"
                  onClick={(event) => event.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(shareData.url);
                    setUrlCopied(true);
                    setTimeout(() => setUrlCopied(false), 2000);
                  }}
                  className={btnOutlineSecondary}
                >
                  {urlCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("shareModal.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("shareModal.copyUrl")}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setShareData(null);
                  setUrlCopied(false);
                }}
                className={btnOutlineSecondary}
              >
                {t("shareModal.close")}
              </button>
              <Link href={shareData.url} className={btnPrimary} target="_blank">
                {t("shareModal.viewLink")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && bulletinToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="mx-4 w-full max-w-md rounded-lg bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-[#283618]">
                  {t("deleteConfirmTitle")}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="cursor-pointer p-2 text-[#283618]/80 transition-colors hover:text-[#283618]"
                disabled={isDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="mb-4 text-[#283618]">
                {t("deleteConfirmMessage", {
                  name: bulletinToDelete.bulletin_name,
                })}
              </p>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#606c38]/20">
                  <FileStack className="h-5 w-5 text-[#606c38]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#283618]">
                    {bulletinToDelete.bulletin_name}
                  </p>
                  <p className="text-xs text-[#283618]/70">
                    {t(`status.${bulletinToDelete.status}`)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className={btnOutlineSecondary}
                disabled={isDeleting}
              >
                {t("cancelDelete")}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className={`flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 ${
                  isDeleting
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("deleting")}</span>
                  </>
                ) : (
                  <span>{t("confirmDeleteBtn")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <DuplicateItemModal
        isOpen={showDuplicateModal && Boolean(bulletinToDuplicate)}
        onClose={handleCloseDuplicateModal}
        onConfirm={handleConfirmDuplicate}
        isSubmitting={isDuplicating}
        title={t("duplicateConfirmTitle")}
        message={t("duplicateConfirmMessage")}
        nameLabel={t("bulletinNameLabel")}
        namePlaceholder={t("bulletinNamePlaceholder")}
        nameValue={duplicateBulletinName}
        onNameChange={setDuplicateBulletinName}
        cancelLabel={t("cancelDuplicate")}
        confirmLabel={t("confirmDuplicateBtn")}
        submittingLabel={t("duplicating")}
        originalItemLabel={t("originalBulletinLabel")}
        originalPreview={
          bulletinToDuplicate ? (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#606c38]/20">
                <FileStack className="h-6 w-6 text-[#606c38]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#283618]">
                  {bulletinToDuplicate.bulletin_name}
                </p>
                <p className="text-xs text-[#283618]/60">
                  {t(`status.${bulletinToDuplicate.status}`)}
                </p>
              </div>
            </div>
          ) : null
        }
        headerAccentClassName="bg-[#606c38]/20 text-[#606c38]"
        nameInputId="duplicate-bulletin-name"
      />
    </ProtectedRoute>
  );
}
