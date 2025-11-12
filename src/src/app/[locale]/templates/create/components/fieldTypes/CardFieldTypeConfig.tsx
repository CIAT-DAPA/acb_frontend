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

// CSS Constants
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70";
const HELP_TEXT_CLASS = "text-xs text-[#283618]/50 mb-3";
const CARD_ITEM_CLASS =
  "flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors";
const THUMBNAIL_CLASS =
  "flex-shrink-0 w-16 h-16 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center";
const THUMBNAIL_IMAGE_CLASS = "w-full h-full object-cover";
const CARD_TITLE_CLASS = "font-medium text-[#283618] truncate";
const CARD_META_CLASS = "text-xs text-[#283618]/50";
const REMOVE_BUTTON_CLASS =
  "flex-shrink-0 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors";
const EMPTY_STATE_CLASS =
  "text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50";
const MODAL_OVERLAY_CLASS =
  "fixed inset-0 bg-black/75 flex items-center justify-center z-50";
const MODAL_CONTENT_CLASS =
  "bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl";
const SEARCH_INPUT_CLASS =
  "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]";
const MODAL_CARD_BUTTON_CLASS =
  "w-full flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left";
const MODAL_THUMBNAIL_CLASS =
  "flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center";
const INFO_BOX_CLASS = "p-3 bg-blue-50 border border-blue-200 rounded-md";

export const CardFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.cardConfig");

  const config = (currentField.field_config as CardFieldConfig) || {};
  const availableCards = config.available_cards || [];

  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCardSelector, setShowCardSelector] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoadingCards(true);
    try {
      const response = await CardAPIService.getCards();
      if (response.success) {
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

  const getCardById = (cardId: string) => {
    return allCards.find((card) => card._id === cardId);
  };

  const availableCardsToAdd = allCards.filter(
    (card) => !availableCards.includes(card._id!)
  );

  const filteredCards = availableCardsToAdd.filter((card) =>
    card.card_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModal = () => {
    setShowCardSelector(false);
    setSearchTerm("");
  };

  const renderThumbnail = (card: Card, className: string) => (
    <div className={className}>
      {card.thumbnail_images && card.thumbnail_images.length > 0 ? (
        <img
          src={card.thumbnail_images[0]}
          alt={card.card_name}
          className={THUMBNAIL_IMAGE_CLASS}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/assets/img/imageNotFound.png";
          }}
        />
      ) : (
        <span className="text-gray-400 text-xs">{t("noPreview")}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={LABEL_CLASS}>{t("availableCards")}</label>
          <button
            type="button"
            onClick={() => setShowCardSelector(true)}
            className={`${btnOutlineSecondary} text-sm flex items-center`}
            disabled={isLoadingCards}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isLoadingCards ? t("loading") : t("addCard")}
          </button>
        </div>

        <p className={HELP_TEXT_CLASS}>{t("help")}</p>

        <div className="space-y-3">
          {availableCards.map((cardId) => {
            const card = getCardById(cardId);
            if (!card) return null;

            return (
              <div key={cardId} className={CARD_ITEM_CLASS}>
                {renderThumbnail(card, THUMBNAIL_CLASS)}

                <div className="flex-1 min-w-0">
                  <h4 className={CARD_TITLE_CLASS}>{card.card_name}</h4>
                  <p className={CARD_META_CLASS}>
                    {t("type")}: {card.card_type}
                  </p>
                  <p className={CARD_META_CLASS}>ID: {card._id}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeCard(cardId)}
                  className={REMOVE_BUTTON_CLASS}
                  title={t("remove")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {availableCards.length === 0 && (
            <div className={EMPTY_STATE_CLASS}>
              <p className="mb-2">{t("noCardsSelected")}</p>
              <p className="text-xs">{t("noCardsHelp")}</p>
            </div>
          )}
        </div>
      </div>

      {showCardSelector && (
        <div className={MODAL_OVERLAY_CLASS}>
          <div className={MODAL_CONTENT_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t("modalTitle")}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className={SEARCH_INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingCards ? (
                <div className={EMPTY_STATE_CLASS}>{t("loadingCards")}</div>
              ) : filteredCards.length === 0 ? (
                <div className={EMPTY_STATE_CLASS}>
                  {searchTerm ? t("noResults") : t("noMoreCards")}
                </div>
              ) : (
                filteredCards.map((card) => (
                  <button
                    key={card._id}
                    type="button"
                    onClick={() => addCard(card._id!)}
                    className={MODAL_CARD_BUTTON_CLASS}
                  >
                    {renderThumbnail(card, MODAL_THUMBNAIL_CLASS)}

                    <div className="flex-1 min-w-0">
                      <h4 className={CARD_TITLE_CLASS}>{card.card_name}</h4>
                      <p className={CARD_META_CLASS}>
                        {t("type")}: {card.card_type}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {availableCards.length > 0 && (
        <div className={INFO_BOX_CLASS}>
          <p className="text-sm text-blue-800">
            <strong>
              {t("cardsCount", {
                count: availableCards.length,
                plural: availableCards.length !== 1 ? "s" : "",
              })}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};
