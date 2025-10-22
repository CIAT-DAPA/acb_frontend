"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  X,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Layers,
  Grid3x3,
  FileStack,
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
import { Card, CardType, CARD_TYPES } from "@/types/card";
import usePermissions from "@/hooks/usePermissions";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";

export default function CardsPage() {
  const t = useTranslations("Cards");
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

  // Cargar cards al montar el componente
  useEffect(() => {
    loadCards();
  }, []);

  // Función para cargar cards desde la API
  const loadCards = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await CardAPIService.getCards();

      if (response.success) {
        console.log("Fetched cards:", response);
        // Filtrar solo las cards activas
        const activeCards = response.data.filter(
          (card) => card.status === "active"
        );
        setCards(activeCards);
        setFilteredCards(activeCards);
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
    let filtered = cards;

    // Filtrar por tipo
    if (selectedType !== "all") {
      filtered = filtered.filter((card) => card.card_type === selectedType);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.card_name.toLowerCase().includes(term) ||
          t(`cardTypes.${card.card_type}`).toLowerCase().includes(term)
      );
    }

    setFilteredCards(filtered);
  }, [searchTerm, selectedType, cards, t]);

  // Efecto para cerrar el modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showDeleteModal && !isDeleting) {
        handleCloseDeleteModal();
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
    if (!cardToDelete || !cardToDelete._id) return;

    setIsDeleting(true);

    try {
      // Actualizar el card cambiando su status a archived
      const response = await CardAPIService.updateCard(cardToDelete._id, {
        ...cardToDelete,
        status: "archived",
      });

      if (response.success) {
        showToast(
          t("deleteSuccess", { name: cardToDelete.card_name }),
          "success",
          3000
        );

        // Recargar la lista de cards
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
        5000
      );
      setIsDeleting(false);
    }
  };

  // Función para obtener el icono del tipo de card
  const getCardTypeIcon = (cardType: CardType) => {
    const icons = {
      pest_or_disease: "🐛",
      crop_info: "🌾",
      recommendation: "💡",
      weather_alert: "⚠️",
      general: "📄",
    };
    return icons[cardType] || "📄";
  };

  return (
    <ProtectedRoute requiredPermission={{ action: PERMISSION_ACTIONS.Read, module: MODULES.CARD_MANAGEMENT }}>
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

              {/* Botón Crear (condicionado) */}
              {can(PERMISSION_ACTIONS.Create, MODULES.CARD_MANAGEMENT) && (
                <Link href="/cards/create" className={`${btnPrimary} whitespace-nowrap`}>
                  <Plus className="h-5 w-5" />
                  <span>{t("createNew")}</span>
                </Link>
              )}
            </div>

            {/* Filtro por tipo */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-sm font-medium text-[#283618] whitespace-nowrap">
                {t("filterByType")}:
              </span>
              <button
                onClick={() => setSelectedType("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === "all"
                    ? "bg-[#606c38] text-white"
                    : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t("allTypes")}
              </button>
              {Object.entries(CARD_TYPES).map(([type, { label, icon }]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type as CardType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    selectedType === type
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{t(`cardTypes.${type}`)}</span>
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

          {/* Cards Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card, index) => {
                const stats = CardAPIService.getCardStats(card);
                const allowedGroups = card.access_config?.allowed_groups || [];
                const canEdit = can(PERMISSION_ACTIONS.Update, MODULES.CARD_MANAGEMENT, allowedGroups);
                const canDelete = can(PERMISSION_ACTIONS.Delete, MODULES.CARD_MANAGEMENT, allowedGroups);

                return (
                  <ItemCard
                    key={card._id || `card-${index}`}
                    type="card"
                    id={card._id!}
                    name={card.card_name}
                    author={stats.createdBy}
                    lastModified={stats.updatedAt.toLocaleDateString()}
                    thumbnailImages={
                      card.content.background_url
                        ? [card.content.background_url]
                        : undefined
                    }
                    badge={
                      <div className="flex items-center gap-1 text-xs">
                        <span>{getCardTypeIcon(card.card_type)}</span>
                        <span>{t(`cardTypes.${card.card_type}`)}</span>
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
                    onEdit={canEdit ? () => (window.location.href = `/cards/${card._id}/edit`) : undefined}
                    deleteBtn={canDelete}
                    onDelete={canDelete ? () => handleDeleteCard(card) : undefined}
                    isDeleting={isDeleting && cardToDelete?._id === card._id}
                  />
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#283618]/60 mb-4">
                {searchTerm || selectedType !== "all"
                  ? t("noResults")
                  : t("noResults")}
              </p>
              { can(PERMISSION_ACTIONS.Create, MODULES.CARD_MANAGEMENT) && (
                <Link href="/cards/create" className={btnPrimary}>
                  {t("createFirst")}
                </Link>
              )}
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
                <div className="flex-shrink-0">
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
                          cardToDelete
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
    </ProtectedRoute>
  );
}
