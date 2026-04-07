"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, Trash2, Search } from "lucide-react";
import {
  btnOutlineSecondary,
  labelClass,
  helpTextClass,
  btnDangerIconClass,
  emptyStateClass,
  infoBoxClass,
} from "@/app/[locale]/components/ui";
import { CardAPIService } from "../../../../../../services/cardService";
import { Card } from "../../../../../../types/card";
import { slugify } from "@/utils/slugify";

interface CardFieldConfig {
  card_type?: string;
  available_cards: string[];
  available_tags?: string[];
}

// CSS Constants
const CARD_ITEM_CLASS =
  "flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors";
const THUMBNAIL_CLASS =
  "flex-shrink-0 w-16 h-16 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center";
const THUMBNAIL_IMAGE_CLASS = "w-full h-full object-cover";
const CARD_TITLE_CLASS = "font-medium text-[#283618] truncate";
const CARD_META_CLASS = "text-xs text-[#283618]/50";
const MODAL_OVERLAY_CLASS =
  "fixed inset-0 bg-black/75 flex items-center justify-center z-50 mb-0";
const MODAL_CONTENT_CLASS =
  "bg-white rounded-lg p-6 w-full max-w-2xl max-h-[60vh] overflow-hidden flex flex-col shadow-2xl";
const SEARCH_INPUT_CLASS =
  "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]";
const TYPE_FILTER_SELECT_CLASS =
  "w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]";
const MODAL_CARD_BUTTON_CLASS =
  "w-full flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left";
const MODAL_THUMBNAIL_CLASS =
  "flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center";

export const CardFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.cardConfig");
  const tCardTypes = useTranslations("Cards.cardTypes");

  const config = (currentField.field_config as CardFieldConfig) || {};
  const availableCards = config.available_cards || [];
  const selectedTags = config.available_tags || [];

  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState("");

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoadingCards(true);
    try {
      const response = await CardAPIService.getCards();
      if (response.success) {
        const activeCards = response.data.filter(
          (card) => card.status === "active",
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

  const updateAvailableTags = (newTags: string[]) => {
    updateFieldConfig({ available_tags: newTags });
  };

  const addCard = (cardId: string) => {
    if (!availableCards.includes(cardId)) {
      updateAvailableCards([...availableCards, cardId]);
    }
    setShowCardSelector(false);
    setSearchTerm("");
    setSelectedType("all");
  };

  const removeCard = (cardId: string) => {
    updateAvailableCards(availableCards.filter((id) => id !== cardId));
  };

  const normalizeTag = (value: unknown): string => {
    return slugify(String(value ?? ""));
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      updateAvailableTags([...selectedTags, tag]);
    }

    setShowTagSelector(false);
    setTagSearchTerm("");
  };

  const removeTag = (tagToRemove: string) => {
    updateAvailableTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const getCardById = (cardId: string) => {
    return allCards.find((card) => card._id === cardId);
  };

  const availableCardsToAdd = allCards.filter(
    (card) => !availableCards.includes(card._id!),
  );

  const getCardTypeLabel = (type?: string) => {
    if (!type) {
      return "";
    }

    try {
      return tCardTypes(type as any);
    } catch {
      return type
        .split("_")
        .map((segment) =>
          segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "",
        )
        .join(" ");
    }
  };

  const availableCardTypes = Array.from(
    new Set(
      availableCardsToAdd
        .map((card) => card.card_type)
        .filter((type): type is string => Boolean(type)),
    ),
  ).sort((a, b) => getCardTypeLabel(a).localeCompare(getCardTypeLabel(b)));

  const filteredCards = availableCardsToAdd.filter((card) => {
    const normalizedSearch = normalizeTag(searchTerm);
    const matchesSearch =
      card.card_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(card.tags)
        ? card.tags.some((tag) => normalizeTag(tag).includes(normalizedSearch))
        : false);
    const matchesType =
      selectedType === "all" || card.card_type === selectedType;

    return matchesSearch && matchesType;
  });

  const allAvailableTags = useMemo(() => {
    const tags = allCards.flatMap((card) =>
      Array.isArray(card.tags) ? card.tags : [],
    );

    return Array.from(
      new Set(tags.map((tag) => normalizeTag(tag)).filter(Boolean)),
    ).sort();
  }, [allCards]);

  const availableTagsToAdd = allAvailableTags.filter(
    (tag) => !selectedTags.includes(tag),
  );

  const filteredTags = availableTagsToAdd.filter((tag) =>
    tag.includes(normalizeTag(tagSearchTerm)),
  );

  const cardsMatchedByTags = useMemo(() => {
    if (selectedTags.length === 0) {
      return [] as Card[];
    }

    const selectedTagSet = new Set(
      selectedTags.map((tag) => normalizeTag(tag)),
    );

    return allCards.filter(
      (card) =>
        Array.isArray(card.tags) &&
        card.tags.some((tag) => selectedTagSet.has(normalizeTag(tag))),
    );
  }, [allCards, selectedTags]);

  const effectiveConfiguredCardCount = useMemo(() => {
    const ids = new Set(availableCards);

    cardsMatchedByTags.forEach((card) => {
      if (card._id) {
        ids.add(card._id);
      }
    });

    return ids.size;
  }, [availableCards, cardsMatchedByTags]);

  const closeCardModal = () => {
    setShowCardSelector(false);
    setSearchTerm("");
    setSelectedType("all");
  };

  const closeTagModal = () => {
    setShowTagSelector(false);
    setTagSearchTerm("");
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
          <label className={labelClass}>{t("availableCards")}</label>
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

        <p className={helpTextClass}>{t("help")}</p>

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
                    {t("type")}: {getCardTypeLabel(card.card_type)}
                  </p>
                  <p className={CARD_META_CLASS}>ID: {card._id}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeCard(cardId)}
                  className={btnDangerIconClass}
                  title={t("remove")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {availableCards.length === 0 && (
            <div className={emptyStateClass}>
              <p className="mb-2">{t("noCardsSelected")}</p>
              <p className="text-xs">{t("noCardsHelp")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>{t("availableTags")}</label>
          <button
            type="button"
            onClick={() => setShowTagSelector(true)}
            className={`${btnOutlineSecondary} text-sm flex items-center`}
            disabled={isLoadingCards}
          >
            <Plus className="w-4 h-4 mr-1" />
            {isLoadingCards ? t("loading") : t("addTag")}
          </button>
        </div>

        <p className={helpTextClass}>{t("tagsHelp")}</p>

        {selectedTags.length === 0 ? (
          <div className={emptyStateClass}>
            <p className="mb-2">{t("noTagsSelected")}</p>
            <p className="text-xs">{t("noTagsHelp")}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ffaf68]/20 border border-[#ffaf68]/40 rounded-full text-sm text-[#283618]"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-red-600 hover:text-red-700"
                  title={t("removeTag")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
                onClick={closeCardModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={TYPE_FILTER_SELECT_CLASS}
                aria-label={t("type")}
              >
                <option value="all">{t("allTypes")}</option>
                {availableCardTypes.map((type) => (
                  <option key={type} value={type}>
                    {getCardTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingCards ? (
                <div className={emptyStateClass}>{t("loadingCards")}</div>
              ) : filteredCards.length === 0 ? (
                <div className={emptyStateClass}>
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
                      {Array.isArray(card.tags) && card.tags.length > 0 && (
                        <p className={CARD_META_CLASS}>
                          {card.tags
                            .slice(0, 4)
                            .map((tag) => `#${tag}`)
                            .join(" ")}
                        </p>
                      )}
                      <p className={CARD_META_CLASS}>
                        {t("type")}: {getCardTypeLabel(card.card_type)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showTagSelector && (
        <div className={MODAL_OVERLAY_CLASS}>
          <div className={MODAL_CONTENT_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t("tagModalTitle")}
              </h3>
              <button
                type="button"
                onClick={closeTagModal}
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
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  placeholder={t("searchTagPlaceholder")}
                  className={SEARCH_INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingCards ? (
                <div className={emptyStateClass}>{t("loadingCards")}</div>
              ) : filteredTags.length === 0 ? (
                <div className={emptyStateClass}>
                  {tagSearchTerm ? t("noResultsTags") : t("noMoreTags")}
                </div>
              ) : (
                filteredTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className={MODAL_CARD_BUTTON_CLASS}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className={CARD_TITLE_CLASS}>#{tag}</h4>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {effectiveConfiguredCardCount > 0 && (
        <div className={infoBoxClass}>
          <p className="text-sm text-blue-800">
            <strong>
              {t("cardsCount", {
                count: effectiveConfiguredCardCount,
                plural: effectiveConfiguredCardCount !== 1 ? "s" : "",
              })}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
};
