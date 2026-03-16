"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/components/Toast";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Loader2,
  Plus,
  Search,
  Check,
  Copy,
  FileStack,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BulletinMaster, BulletinStatus } from "@/types/bulletin";
import BulletinAPIService from "@/services/bulletinService";
import { TemplateAPIService } from "@/services/templateService";
import { ReviewService } from "@/services/reviewService";
import ItemCard from "../components/ItemCard";
import { DuplicateItemModal } from "../components/DuplicateItemModal";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { usePermissions } from "@/hooks/usePermissions";
import { useParams } from "next/navigation";
import {
  btnOutlineSecondary,
  btnPrimary,
  container,
  pageSubtitle,
  pageTitle,
  searchField,
} from "../components/ui";

const BULLETIN_STATUS_FILTERS: BulletinStatus[] = [
  "draft",
  "pending_review",
  "review",
  "rejected",
  "published",
  "archived",
];

export default function Bulletins() {
  const t = useTranslations("Bulletins");
  const { showToast } = useToast();
  const params = useParams();
  const locale = (params.locale as string) || "es";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<BulletinStatus | "all">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulletins, setBulletins] = useState<BulletinMaster[]>([]);
  const [filteredBulletins, setFilteredBulletins] = useState<BulletinMaster[]>(
    [],
  );
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({});
  const [templateNameMachineMap, setTemplateNameMachineMap] = useState<
    Record<string, string>
  >({});
  const [templateThumbnailsMap, setTemplateThumbnailsMap] = useState<
    Record<string, string[]>
  >({});

  // State for Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{ url: string } | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [bulletinToDuplicate, setBulletinToDuplicate] =
    useState<BulletinMaster | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateBulletinName, setDuplicateBulletinName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bulletinToDelete, setBulletinToDelete] =
    useState<BulletinMaster | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { can } = usePermissions();

  // Cargar bulletins al montar el componente
  useEffect(() => {
    loadBulletins();
  }, []);

  // Función para cargar boletines desde la API
  const loadBulletins = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await BulletinAPIService.getBulletins();

      if (response.success) {
        console.log("Fetched bulletins:", response);
        setBulletins(response.data);
        setFilteredBulletins(
          response.data.filter((bulletin) => bulletin.status !== "archived"),
        );

        // Obtener los nombres y thumbnails de los templates base
        const templateIds = [
          ...new Set(response.data.map((b) => b.base_template_master_id)),
        ];
        const templatesResponse = await Promise.all(
          templateIds.map((id) =>
            TemplateAPIService.getTemplateById(id).catch(() => null),
          ),
        );

        const newTemplatesMap: Record<string, string> = {};
        const newTemplateNameMachineMap: Record<string, string> = {};
        const newThumbnailsMap: Record<string, string[]> = {};
        templatesResponse.forEach((res) => {
          if (res?.success && res.data) {
            const template = res.data as any;
            newTemplatesMap[template._id!] = template.template_name;
            newTemplateNameMachineMap[template._id!] = template.name_machine;
            newThumbnailsMap[template._id!] = template.thumbnail_images || [];
          }
        });
        setTemplatesMap(newTemplatesMap);
        setTemplateNameMachineMap(newTemplateNameMachineMap);
        setTemplateThumbnailsMap(newThumbnailsMap);
      } else {
        setError(response.message || "Error al cargar los boletines");
      }
    } catch (err) {
      setError("Error de conexión al cargar los boletines");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar boletines cuando cambia el término de búsqueda
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = bulletins.filter((bulletin) => {
      const matchesStatus =
        selectedStatus === "all"
          ? bulletin.status !== "archived"
          : bulletin.status === selectedStatus;
      const matchesSearch =
        !term ||
        bulletin.bulletin_name.toLowerCase().includes(term) ||
        (templatesMap[bulletin.base_template_master_id] &&
          templatesMap[bulletin.base_template_master_id]
            .toLowerCase()
            .includes(term));

      return matchesStatus && matchesSearch;
    });

    setFilteredBulletins(filtered);
  }, [searchTerm, selectedStatus, bulletins, templatesMap]);

  const groupedBulletins = useMemo(() => {
    const uniqueBulletins = filteredBulletins.filter(
      (bulletin, index, array) => {
        return (
          bulletin._id &&
          array.findIndex(
            (otherBulletin) => otherBulletin._id === bulletin._id,
          ) === index
        );
      },
    );

    const groupsMap = new Map<
      string,
      {
        templateId: string;
        templateName: string;
        bulletins: BulletinMaster[];
      }
    >();

    uniqueBulletins.forEach((bulletin) => {
      const templateId = bulletin.base_template_master_id || "unknown-template";
      const templateName = templatesMap[templateId] || t("templateUnknown");
      const existingGroup = groupsMap.get(templateId);

      if (existingGroup) {
        existingGroup.bulletins.push(bulletin);
      } else {
        groupsMap.set(templateId, {
          templateId,
          templateName,
          bulletins: [bulletin],
        });
      }
    });

    return Array.from(groupsMap.values())
      .map((group) => ({
        ...group,
        bulletins: [...group.bulletins].sort((a, b) => {
          const leftDate = new Date(
            b.log.updated_at || b.log.created_at || 0,
          ).getTime();
          const rightDate = new Date(
            a.log.updated_at || a.log.created_at || 0,
          ).getTime();
          return leftDate - rightDate;
        }),
      }))
      .sort((a, b) => a.templateName.localeCompare(b.templateName));
  }, [filteredBulletins, templatesMap, t]);

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
    } catch (error) {
      console.error("Error duplicating bulletin:", error);
      showToast(
        t("duplicateError", {
          name: bulletinToDuplicate.bulletin_name,
          error: error instanceof Error ? error.message : "Error desconocido",
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
    } catch (error) {
      console.error("Error archiving bulletin:", error);
      showToast(
        t("deleteError", {
          name: bulletinName,
          error: error instanceof Error ? error.message : "Unknown error",
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
        module: MODULES.BULLETINS_COMPOSER,
      }}
    >
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block -rotate-12">
                <Image
                  src="/assets/img/bol3.jpg"
                  alt="Templates dashboard"
                  width={150}
                  height={319}
                  className="object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className={`${container} py-8`}>
          {/* Search Bar, Filtros y Botones */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#283618]/50" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={searchField}
                />
              </div>

              {/* Botón Crear */}
              {can(PERMISSION_ACTIONS.Create, MODULES.BULLETINS_COMPOSER) && (
                <Link
                  href="/bulletins/create"
                  className={`${btnPrimary} whitespace-nowrap`}
                >
                  <Plus className="h-5 w-5" />
                  <span>{t("createNew")}</span>
                </Link>
              )}
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-sm font-medium text-[#283618] whitespace-nowrap">
                {t("filterByStatus")}:
              </span>
              <button
                onClick={() => setSelectedStatus("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedStatus === "all"
                    ? "bg-[#606c38] text-white"
                    : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t("allStatuses")}
              </button>
              {BULLETIN_STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedStatus === status
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t(`status.${status}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffaf68]" />
              <span className="ml-2 text-[#283618]/60">{t("loading")}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => loadBulletins()} className={btnPrimary}>
                {t("retry")}
              </button>
            </div>
          )}

          {/* Bulletins Grid */}
          {!loading && !error && (
            <div className="space-y-8">
              {groupedBulletins.map((group) => (
                <section key={group.templateId} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#606c38]/10 text-[#606c38] flex items-center justify-center">
                      <FileStack className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide font-semibold text-[#606c38]/80">
                        {t("groupedByTemplate")}
                      </p>
                      <h2 className="text-lg font-bold text-[#283618]">
                        {group.templateName}
                      </h2>
                    </div>
                    <span className="ml-auto text-sm text-[#606c38]/80 font-medium">
                      {group.bulletins.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.bulletins.map((bulletin, index) => {
                      const allowedGroups =
                        bulletin.access_config?.allowed_groups || [];
                      const canEdit = can(
                        PERMISSION_ACTIONS.Update,
                        MODULES.BULLETINS_COMPOSER,
                        allowedGroups,
                      );
                      const canDelete = can(
                        PERMISSION_ACTIONS.Delete,
                        MODULES.BULLETINS_COMPOSER,
                        allowedGroups,
                      );

                      const status = bulletin.status;
                      const isPublished = status === "published";

                      const isEditableStatus =
                        status === "draft" || status === "rejected";
                      const showEditBtn = canEdit && isEditableStatus;
                      const showDuplicateBtn = canEdit;
                      const showShareBtn = isPublished;
                      const showDeleteBtn = canDelete && isPublished;

                      const handleShare = () => {
                        const templateNameMachine =
                          templateNameMachineMap[
                            bulletin.base_template_master_id
                          ];
                        if (templateNameMachine && bulletin.name_machine) {
                          const url = `${window.location.origin}/${locale}/${templateNameMachine}/${bulletin.name_machine}`;
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

                      return (
                        <ItemCard
                          key={
                            bulletin._id ||
                            `bulletin-${group.templateId}-${index}`
                          }
                          type="template"
                          id={bulletin._id!}
                          name={bulletin.bulletin_name}
                          author={creatorName}
                          lastModified={new Date(
                            bulletin.log.updated_at!,
                          ).toLocaleDateString()}
                          templateBaseName={
                            templatesMap[bulletin.base_template_master_id]
                          }
                          status={bulletin.status}
                          thumbnailImages={
                            templateThumbnailsMap[
                              bulletin.base_template_master_id
                            ] || []
                          }
                          editBtn={showEditBtn}
                          onEdit={() =>
                            (window.location.href = `/bulletins/${bulletin._id}/edit`)
                          }
                          duplicateBtn={showDuplicateBtn}
                          onDuplicate={
                            showDuplicateBtn
                              ? () => handleDuplicateBulletin(bulletin)
                              : undefined
                          }
                          isDuplicating={
                            isDuplicating &&
                            bulletinToDuplicate?._id === bulletin._id
                          }
                          shareBtn={showShareBtn}
                          onShare={handleShare}
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
                </section>
              ))}
            </div>
          )}

          {/* Share Modal */}
          {showShareModal && shareData && (
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
                <h2 className="text-2xl font-bold text-[#283618] mb-4">
                  {t("shareModal.title")}
                </h2>
                <p className="text-[#606c38] mb-6">{t("shareModal.message")}</p>

                {/* URL Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#283618] mb-2">
                    {t("shareModal.urlLabel")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareData.url}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-[#283618] text-sm"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareData.url);
                        setUrlCopied(true);
                        setTimeout(() => setUrlCopied(false), 2000);
                      }}
                      className={`${btnOutlineSecondary}`}
                    >
                      {urlCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          {t("shareModal.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          {t("shareModal.copyUrl")}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col justify-between sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setShareData(null);
                      setUrlCopied(false);
                    }}
                    className={`${btnOutlineSecondary} `}
                  >
                    {t("shareModal.close")}
                  </button>
                  <Link
                    href={shareData.url}
                    className={`${btnPrimary}`}
                    target="_blank"
                  >
                    {t("shareModal.viewLink")}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && groupedBulletins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#283618]/60 mb-4">
                {searchTerm ? t("noResults") : t("noResults")}
              </p>
              {!searchTerm &&
                can(PERMISSION_ACTIONS.Create, MODULES.BULLETINS_COMPOSER) && (
                  <Link href="/bulletins/create" className={btnPrimary}>
                    {t("createFirst")}
                  </Link>
                )}
            </div>
          )}
        </div>
      </main>

      {showDeleteModal && bulletinToDelete && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-[#283618]">
                  {t("deleteConfirmTitle")}
                </h3>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                className="p-2 text-[#283618]/80 hover:text-[#283618] transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[#283618] mb-4">
                {t("deleteConfirmMessage", {
                  name: bulletinToDelete.bulletin_name,
                })}
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#606c38]/20 rounded-lg flex items-center justify-center shrink-0">
                  <FileStack className="h-5 w-5 text-[#606c38]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#283618] truncate">
                    {bulletinToDelete.bulletin_name}
                  </p>
                  <p className="text-xs text-[#283618]/70">
                    {t(`status.${bulletinToDelete.status}`)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-4 border-t bg-gray-50">
              <button
                onClick={handleCloseDeleteModal}
                className={btnOutlineSecondary}
                disabled={isDeleting}
              >
                {t("cancelDelete")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  isDeleting
                    ? "opacity-50 cursor-not-allowed"
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
              <div className="w-12 h-12 bg-[#606c38]/20 rounded-lg flex items-center justify-center shrink-0">
                <FileStack className="h-6 w-6 text-[#606c38]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#283618] truncate">
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
