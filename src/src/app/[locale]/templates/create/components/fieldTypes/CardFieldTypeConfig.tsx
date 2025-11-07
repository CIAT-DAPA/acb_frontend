"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, Trash2, Search } from "lucide-react";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";
import { CardAPIService } from "../../../../../../services/cardService";
import { Card } from "../../../../../../types/card";

interface CardFieldConfig {
  card_type?: string;
  available_cards: string[];
}

export const CardFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  const config = (currentField.field_config as CardFieldConfig) || {};
  const availableCards = config.available_cards || [];

  // Estado para las cards disponibles
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCardSelector, setShowCardSelector] = useState(false);

  // Cargar todas las cards disponibles
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoadingCards(true);
    try {
      const response = await CardAPIService.getCards();
      if (response.success) {
        // Filtrar solo las cards con status "active"
        const activeCards = response.data.filter(
          (card) => card.status === "active"
        );
        setAllCards(activeCards);
      }
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setIsLoadingCards(false);
    }
  };

  const updateAvailableCards = (newCards: string[]) => {
    updateFieldConfig({ available_cards: newCards });
  };

  const addCard = (cardId: string) => {
    if (!availableCards.includes(cardId)) {
      updateAvailableCards([...availableCards, cardId]);
    }
    setShowCardSelector(false);
    setSearchTerm("");
  };

  const removeCard = (cardId: string) => {
    updateAvailableCards(availableCards.filter((id) => id !== cardId));
  };

  // Obtener información de una card por su ID
  const getCardById = (cardId: string) => {
    return allCards.find((card) => card._id === cardId);
  };

  // Filtrar cards disponibles para agregar (que no estén ya seleccionadas)
  const availableCardsToAdd = allCards.filter(
    (card) => !availableCards.includes(card._id!)
  );

  // Filtrar por término de búsqueda
  const filteredCards = availableCardsToAdd.filter((card) =>
    card.card_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Lista de cards seleccionadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#283618]/70">
            Cards Disponibles para Selección
          </label>
          <button
            type="button"
            onClick={() => setShowCardSelector(true)}
            className={`${btnOutlineSecondary} text-sm flex items-center`}
            disabled={isLoadingCards}
          >
            <Plus className="w-4 h-4 mr-1" />{" "}
            {isLoadingCards ? "Cargando..." : "Agregar Card"}
          </button>
        </div>

        <p className="text-xs text-[#283618]/50 mb-3">
          Selecciona las cards que el usuario podrá elegir para este campo
        </p>

        <div className="space-y-3">
          {availableCards.map((cardId) => {
            const card = getCardById(cardId);
            if (!card) return null;

            return (
              <div
                key={cardId}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Thumbnail de la card */}
                <div className="flex-shrink-0 w-16 h-16 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                  {card.thumbnail_images && card.thumbnail_images.length > 0 ? (
                    <img
                      src={card.thumbnail_images[0]}
                      alt={card.card_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/img/imageNotFound.png";
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Sin preview</span>
                  )}
                </div>

                {/* Información de la card */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#283618] truncate">
                    {card.card_name}
                  </h4>
                  <p className="text-xs text-[#283618]/50">
                    Tipo: {card.card_type}
                  </p>
                  <p className="text-xs text-[#283618]/50">ID: {card._id}</p>
                </div>

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => removeCard(cardId)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {availableCards.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50">
              <p className="mb-2">No hay cards seleccionadas</p>
              <p className="text-xs">
                Haz clic en "Agregar Card" para comenzar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal selector de cards */}
      {showCardSelector && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Seleccionar Card
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCardSelector(false);
                  setSearchTerm("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Buscador */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar card por nombre..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                />
              </div>
            </div>

            {/* Lista de cards disponibles */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingCards ? (
                <div className="text-center py-8 text-gray-500">
                  Cargando cards...
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm
                    ? "No se encontraron cards con ese nombre"
                    : "No hay más cards disponibles"}
                </div>
              ) : (
                filteredCards.map((card) => (
                  <button
                    key={card._id}
                    type="button"
                    onClick={() => addCard(card._id!)}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                      {card.thumbnail_images &&
                      card.thumbnail_images.length > 0 ? (
                        <img
                          src={card.thumbnail_images[0]}
                          alt={card.card_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/assets/img/imageNotFound.png";
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Sin preview
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#283618] truncate">
                        {card.card_name}
                      </h4>
                      <p className="text-xs text-[#283618]/50">
                        Tipo: {card.card_type}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vista previa de cantidad */}
      {availableCards.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>{availableCards.length}</strong> card
            {availableCards.length !== 1 ? "s" : ""} disponible
            {availableCards.length !== 1 ? "s" : ""} para selección
          </p>
        </div>
      )}
    </div>
  );
};
