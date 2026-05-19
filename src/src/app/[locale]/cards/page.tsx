"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  User,
  Layers,
  Grid3x3,
  FileStack,
  Folder,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import ItemCard from "../components/ItemCard";
import { CardAPIService } from "../../../services/cardService";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { useToast } from "../../../components/Toast";
import {
  container,
  btnPrimary,
  btnOutlineSecondary,
  searchField,
  pageTitle,
  pageSubtitle,
} from "../components/ui";
import { DuplicateItemModal } from "../components/DuplicateItemModal";
import {
  Card,
  CardType,
  getCardTypeIcon,
  CARD_TYPE_DISPLAY_ORDER,
  hasCardTypeTranslation,
  isSelectableCardType,
} from "@/types/card";
import { EnumAPIService, EnumValue } from "@/services/enumService";
import usePermissions from "@/hooks/usePermissions";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { useAuth } from "@/hooks/useAuth";

const UNTAGGED_FOLDER_KEY = "__untagged__";

const formatFolderLabel = (tag: string) =>
  tag
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

export default function CardsPage() {
  const t = useTranslations("Cards");
  const tNavbar = useTranslations("Navbar");

  // Establecer el título de la página
  useEffect(() => {
    document.title = `Bulletin builder - ${tNavbar("cards")}`;
  }, [tNavbar]);
  const { showToast } = useToast();
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<CardType | "all">("all");
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [cardToDuplicate, setCardToDuplicate] = useState<Card | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateCardName, setDuplicateCardName] = useState("");

  // Estados para tipos de cards dinámicos
  const [cardTypes, setCardTypes] = useState<EnumValue[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedFolderKey, setSelectedFolderKey] = useState<string | null>(
    null,
  );
  const { authenticated, loading: authLoading } = useAuth();

  // Cargar cards y tipos solo cuando la autenticación ya está resuelta
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authenticated) {
      setLoading(false);
      setError(null);
      setLoadingTypes(false);
      return;
    }

    loadCards();
    loadCardTypes();
  }, [authLoading, authenticated]);

  // Función helper para obtener el label traducido de un tipo de card
  const getCardTypeLabel = (cardType: string): string => {
    // Si el tipo tiene traducción disponible, usarla
    if (hasCardTypeTranslation(cardType)) {
      return t(`cardTypes.${cardType}`);
    }
    // Si no, mostrar el valor tal como viene de la API
    return cardType;
  };

  const getCardTimestamp = (card: Card): number => {
    return new Date(
      card.log?.updated_at || card.log?.created_at || 0,
    ).getTime();
  };

  const getFolderLabel = (folderKey: string) =>
    folderKey === UNTAGGED_FOLDER_KEY
      ? t("untaggedFolder")
      : formatFolderLabel(folderKey);

  // Función para cargar los tipos de cards desde la API
  const loadCardTypes = async () => {
    setLoadingTypes(true);
    try {
      const types = (await EnumAPIService.getCardTypes()).filter((type) =>
        isSelectableCardType(type.value),
      );

      // Ordenar tipos según el orden preferido
      const sortedTypes = types.sort((a, b) => {
        const indexA = CARD_TYPE_DISPLAY_ORDER.indexOf(a.value);
        const indexB = CARD_TYPE_DISPLAY_ORDER.indexOf(b.value);

        // Si ambos están en el orden preferido, usar ese orden
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // Si solo uno está en el orden preferido, ese va primero
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Si ninguno está en el orden preferido, ordenar alfabéticamente
        return a.label.localeCompare(b.label);
      });

      setCardTypes(sortedTypes);
    } catch (error) {
      console.error("Error loading card types:", error);
      showToast("Error al cargar los tipos de cards", "error", 4000);
      // En caso de error, usar un array vacío
      setCardTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Función para cargar cards desde la API
  const loadCards = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await CardAPIService.getCards();

      if (response.success) {
        const activeCards = response.data.filter(
          (card) => card.status === "active",
        );
        const sortedCards = [...activeCards].sort(
          (a, b) => getCardTimestamp(b) - getCardTimestamp(a),
        );
        setCards(sortedCards);
        setFilteredCards(sortedCards);
      } else {
        setError(response.message || "Error al cargar las cards");
      }
    } catch (err) {
      setError("Error de conexión al cargar las cards");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cards cuando cambia el término de búsqueda o el tipo seleccionado
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = cards.filter((card) => {
      const matchesType =
        selectedType === "all" || card.card_type === selectedType;
      const matchesTags =
        Array.isArray(card.tags) &&
        card.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesSearch =
        !term ||
        card.card_name.toLowerCase().includes(term) ||
        getCardTypeLabel(card.card_type).toLowerCase().includes(term) ||
        matchesTags;

      return matchesType && matchesSearch;
    });

    const sortedFiltered = [...filtered].sort(
      (a, b) => getCardTimestamp(b) - getCardTimestamp(a),
    );

    setFilteredCards(sortedFiltered);
  }, [searchTerm, selectedType, cards, cardTypes, t]);

  const folderGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        cards: Card[];
      }
    >();

    filteredCards.forEach((card) => {
      const tags = Array.isArray(card.tags)
        ? card.tags.map((tag) => tag.trim()).filter(Boolean)
        : [];

      const folderTags = tags.length > 0 ? tags : [UNTAGGED_FOLDER_KEY];

      folderTags.forEach((tag) => {
        const folderKey =
          tag === UNTAGGED_FOLDER_KEY ? UNTAGGED_FOLDER_KEY : tag.toLowerCase();

        if (!groups.has(folderKey)) {
          groups.set(folderKey, {
            key: folderKey,
            label: getFolderLabel(folderKey),
            cards: [],
          });
        }

        groups.get(folderKey)?.cards.push(card);
      });
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (b.cards.length !== a.cards.length) {
        return b.cards.length - a.cards.length;
      }

      return a.label.localeCompare(b.label);
    });
  }, [filteredCards, t]);

  const folderRows = useMemo(() => {
    return folderGroups.map((folder) => {
      const latestCard = [...folder.cards].sort(
        (a, b) => getCardTimestamp(b) - getCardTimestamp(a),
      )[0];
      const latestStats = latestCard
        ? CardAPIService.getCardStats(latestCard)
        : null;
      const hasSharedAccess = folder.cards.some((card) => {
        const allowedGroups = card.access_config?.allowed_groups || [];
        return (
          card.access_config?.access_type !== "private" ||
          allowedGroups.length > 0
        );
      });

      return {
        ...folder,
        modifiedLabel: latestStats
          ? latestStats.updatedAt.toLocaleDateString()
          : "-",
        modifiedBy: latestStats?.createdBy || "-",
        fileSizeLabel: t("folderFileCount", { count: folder.cards.length }),
        sharingLabel: hasSharedAccess ? t("shared") : t("private"),
        activityLabel: latestCard ? latestCard.card_name : t("noActivity"),
      };
    });
  }, [folderGroups, t]);

  const selectedFolderCards = useMemo(() => {
    if (!selectedFolderKey) {
      return [];
    }

    return filteredCards.filter((card) => {
      const tags = Array.isArray(card.tags)
        ? card.tags.map((tag) => tag.trim()).filter(Boolean)
        : [];

      if (selectedFolderKey === UNTAGGED_FOLDER_KEY) {
        return tags.length === 0;
      }

      return tags.some((tag) => tag.toLowerCase() === selectedFolderKey);
    });
  }, [filteredCards, selectedFolderKey]);

  const selectedFolderLabel = selectedFolderKey
    ? folderGroups.find((folder) => folder.key === selectedFolderKey)?.label ||
      getFolderLabel(selectedFolderKey)
    : "";

  const isFolderView = Boolean(selectedFolderKey);

  // Efecto para cerrar el modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showDeleteModal && !isDeleting) {
          handleCloseDeleteModal();
        }
      }
    };

    if (showDeleteModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevenir scroll del fondo
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Restaurar scroll
    };
  }, [showDeleteModal, isDeleting]);

  // Función para mostrar el modal de confirmación de eliminación
  const handleDeleteCard = (card: Card) => {
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  // Función para cerrar el modal de eliminación
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCardToDelete(null);
    setIsDeleting(false);
  };

  // Función para confirmar la eliminación (cambiar status a archived)
  const handleConfirmDelete = async () => {
    if (!cardToDelete?._id) return;

    setIsDeleting(true);

    try {
      const response = await CardAPIService.updateCard(cardToDelete._id, {
        ...cardToDelete,
        status: "archived",
      });

      if (response.success) {
        showToast(
          t("deleteSuccess", { name: cardToDelete.card_name }),
          "success",
          3000,
        );
        loadCards();
        handleCloseDeleteModal();
      } else {
        throw new Error(response.message || "Error al archivar la card");
      }
    } catch (error) {
      console.error("Error archiving card:", error);
      showToast(
        t("deleteError", {
          name: cardToDelete.card_name,
          error: error instanceof Error ? error.message : "Error desconocido",
        }),
        "error",
        5000,
      );
      setIsDeleting(false);
    }
  };

  // Función para mostrar el modal de duplicación
  const handleDuplicateCard = (card: Card) => {
    setCardToDuplicate(card);
    setDuplicateCardName(`${card.card_name} - ${t("copySuffix")}`);
    setShowDuplicateModal(true);
  };

  // Función para cerrar el modal de duplicación
  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false);
    setCardToDuplicate(null);
    setDuplicateCardName("");
    setIsDuplicating(false);
  };

  // Función para confirmar la duplicación
  const handleConfirmDuplicate = async () => {
    if (!cardToDuplicate?._id) return;

    setIsDuplicating(true);

    try {
      const response = await CardAPIService.cloneCard(cardToDuplicate._id, {
        card_name: duplicateCardName.trim(),
      });

      if (response.success) {
        showToast(
          t("duplicateSuccess", { name: duplicateCardName }),
          "success",
          3000,
        );
        loadCards();
        handleCloseDuplicateModal();
      } else {
        throw new Error(response.message || "Error al duplicar la card");
      }
    } catch (error) {
      console.error("Error duplicating card:", error);
      showToast(
        t("duplicateError", {
          name: cardToDuplicate.card_name,
          error: error instanceof Error ? error.message : "Error desconocido",
        }),
        "error",
        5000,
      );
      setIsDuplicating(false);
    }
  };

  return (
    <ProtectedRoute
      requiredPermission={{
        action: PERMISSION_ACTIONS.Read,
        module: MODULES.CARD_MANAGEMENT,
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
              <div className="hidden lg:block rotate-12">
                <Image
                  src="/assets/img/bol2.jpg"
                  alt="Cards dashboard"
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
          {/* Search Bar, Filters and Folder Header */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#283618]/50" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${searchField} pl-10`}
                />
              </div>

              <Link
                href="/cards/create"
                className={`${btnPrimary} whitespace-nowrap flex items-center gap-2`}
              >
                <Plus className="h-4 w-4" />
                {t("createNew")}
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedType === "all"
                    ? "bg-[#606c38] text-white shadow-md"
                    : "bg-white text-[#283618] border border-[#283618]/10 hover:bg-[#fefae0]"
                }`}
              >
                {t("allTypes")}
              </button>

              {cardTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedType === type.value
                      ? "bg-[#606c38] text-white shadow-md"
                      : "bg-white text-[#283618] border border-[#283618]/10 hover:bg-[#fefae0]"
                  }`}
                >
                  <span>{getCardTypeIcon(type.value)}</span>
                  <span>{getCardTypeLabel(type.value)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#606c38]" />
              <span className="ml-2 text-[#283618]/60">{t("loading")}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => loadCards()} className={btnPrimary}>
                {t("retry")}
              </button>
            </div>
          )}

          {/* Breadcrumb for Folder View */}
          {isFolderView && (
            <div className="mb-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFolderKey(null)}
                className="flex items-center gap-2 text-sm font-medium text-[#606c38] hover:text-[#283618] transition-colors"
              >
                <Folder className="h-4 w-4" />
                Folders
              </button>
              <ChevronRight className="h-4 w-4 text-[#606c38]" />
              <span className="text-sm font-medium text-[#283618]">
                {selectedFolderLabel}
              </span>
            </div>
          )}

          {/* Cards Grid */}
          {!loading && !error && (
            <>
              {!isFolderView ? (
                <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-sm">
                  <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.2fr)] border-b border-[#283618]/10 bg-[#fefae0]/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#606c38]">
                    <div>{t("nameColumn")}</div>
                    <div>{t("modifiedColumn")}</div>
                    <div>{t("modifiedByColumn")}</div>
                    <div>{t("fileSizeColumn")}</div>
                    <div>{t("activityColumn")}</div>
                  </div>

                  <div className="divide-y divide-[#283618]/8">
                    {folderRows.map((folder) => (
                      <button
                        key={folder.key}
                        type="button"
                        onClick={() => setSelectedFolderKey(folder.key)}
                        className="grid w-full grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.2fr)] items-center px-5 py-4 text-left transition-colors hover:bg-[#fefae0]/60"
                      >
                        <div className="flex min-w-0 items-center gap-3 pr-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#606c38]/10 text-[#606c38]">
                            <Folder className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[#283618]">
                              {folder.label}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#283618]/75">
                          <Calendar className="h-4 w-4 shrink-0 text-[#606c38]" />
                          <span>{folder.modifiedLabel}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#283618]/75">
                          <User className="h-4 w-4 shrink-0 text-[#606c38]" />
                          <span className="truncate">{folder.modifiedBy}</span>
                        </div>

                        <div className="text-sm text-[#283618]/75">
                          {folder.fileSizeLabel}
                        </div>

                        <div className="flex items-center justify-between gap-2 text-sm text-[#283618]/75">
                          <span className="truncate">
                            {folder.activityLabel}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#606c38]" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedFolderCards.map((card, index) => {
                    const stats = CardAPIService.getCardStats(card);
                    const allowedGroups =
                      card.access_config?.allowed_groups || [];
                    const canEdit = can(
                      PERMISSION_ACTIONS.Update,
                      MODULES.CARD_MANAGEMENT,
                      allowedGroups,
                    );
                    const canDelete = can(
                      PERMISSION_ACTIONS.Delete,
                      MODULES.CARD_MANAGEMENT,
                      allowedGroups,
                    );

                    return (
                      <ItemCard
                        key={card._id || `card-${index}`}
                        type="card"
                        id={card._id!}
                        name={card.card_name}
                        author={stats.createdBy}
                        lastModified={stats.updatedAt.toLocaleDateString()}
                        thumbnailImages={
                          card.thumbnail_images
                            ? card.thumbnail_images
                            : undefined
                        }
                        tags={card.tags}
                        badge={
                          <div className="flex items-center gap-1 text-xs">
                            <span>{getCardTypeIcon(card.card_type)}</span>
                            <span>{getCardTypeLabel(card.card_type)}</span>
                          </div>
                        }
                        metadata={
                          <div className="flex items-center gap-3 text-xs text-[#283618]/60">
                            <div className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              <span>
                                {stats.blocksCount} {t("blocks")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Grid3x3 className="h-3 w-3" />
                              <span>
                                {stats.fieldsCount} {t("fields")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileStack className="h-3 w-3" />
                              <span>
                                {stats.templatesCount} {t("templates")}
                              </span>
                            </div>
                          </div>
                        }
                        editBtn={canEdit}
                        onEdit={
                          canEdit
                            ? () =>
                                (window.location.href = `/cards/${card._id}/edit`)
                            : undefined
                        }
                        duplicateBtn={canEdit}
                        onDuplicate={
                          canEdit ? () => handleDuplicateCard(card) : undefined
                        }
                        isDuplicating={
                          isDuplicating && cardToDuplicate?._id === card._id
                        }
                        deleteBtn={canDelete}
                        onDelete={
                          canDelete ? () => handleDeleteCard(card) : undefined
                        }
                        isDeleting={
                          isDeleting && cardToDelete?._id === card._id
                        }
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && !isFolderView && folderGroups.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[#606c38]/30 bg-white/80 px-8 py-14 text-center shadow-sm">
              <Folder className="mx-auto h-12 w-12 text-[#606c38]/35" />
              <p className="mt-4 text-[#283618]/60">
                {searchTerm || selectedType !== "all"
                  ? t("noFolders")
                  : t("noFolders")}
              </p>
              {can(PERMISSION_ACTIONS.Create, MODULES.CARD_MANAGEMENT) && (
                <Link href="/cards/create" className={`${btnPrimary} mt-5`}>
                  {t("createFirst")}
                </Link>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            isFolderView &&
            selectedFolderCards.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[#606c38]/30 bg-white/80 px-8 py-14 text-center shadow-sm">
                <FolderOpen className="mx-auto h-12 w-12 text-[#606c38]/35" />
                <p className="mt-4 text-[#283618]/60">{t("folderEmpty")}</p>
                <button
                  type="button"
                  onClick={() => setSelectedFolderKey(null)}
                  className={`${btnPrimary} mt-5`}
                >
                  {t("backToFolders")}
                </button>
              </div>
            )}
        </div>
      </main>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && cardToDelete && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
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

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="flex gap-4">
                {/* Icono de la card */}
                <div className="shrink-0">
                  <div className="w-16 h-16 bg-[#606c38]/20 rounded-lg flex items-center justify-center text-3xl">
                    {getCardTypeIcon(cardToDelete.card_type)}
                  </div>
                </div>

                {/* Mensaje de confirmación */}
                <div className="flex-1">
                  <p className="text-[#283618] mb-3">
                    {t("deleteConfirmMessage", {
                      name: cardToDelete.card_name,
                    })}
                  </p>
                  <div className="text-sm text-[#283618]/70 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {t(`cardTypes.${cardToDelete.card_type}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>
                        {t("by")}{" "}
                        {CardAPIService.getCardStats(cardToDelete).createdBy}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {t("lastModified")}:{" "}
                        {CardAPIService.getCardStats(
                          cardToDelete,
                        ).updatedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensajes de error */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
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
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>{t("confirmDeleteBtn")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <DuplicateItemModal
        isOpen={showDuplicateModal && Boolean(cardToDuplicate)}
        onClose={handleCloseDuplicateModal}
        onConfirm={handleConfirmDuplicate}
        isSubmitting={isDuplicating}
        title={t("duplicateConfirmTitle")}
        message={t("duplicateConfirmMessage")}
        nameLabel={t("cardNameLabel")}
        namePlaceholder={t("cardNamePlaceholder")}
        nameValue={duplicateCardName}
        onNameChange={setDuplicateCardName}
        cancelLabel={t("cancelDuplicate")}
        confirmLabel={t("confirmDuplicateBtn")}
        submittingLabel={t("duplicating")}
        originalItemLabel={t("originalCardLabel")}
        originalPreview={
          cardToDuplicate ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#606c38]/20 rounded-lg flex items-center justify-center text-2xl shrink-0">
                {getCardTypeIcon(cardToDuplicate.card_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#283618] truncate">
                  {cardToDuplicate.card_name}
                </p>
                <p className="text-xs text-[#283618]/60">
                  {t(`cardTypes.${cardToDuplicate.card_type}`)}
                </p>
              </div>
            </div>
          ) : null
        }
        headerAccentClassName="bg-[#606c38]/20 text-[#606c38]"
        nameInputId="duplicate-card-name"
      />
    </ProtectedRoute>
  );
}
