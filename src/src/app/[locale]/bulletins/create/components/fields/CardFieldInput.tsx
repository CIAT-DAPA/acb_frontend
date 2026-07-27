"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Field } from "../../../../../../types/template";
import { Card } from "../../../../../../types/card";
import {
  CardAPIService,
  GetCardsResponse,
} from "../../../../../../services/cardService";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  TextInput,
  TextWithIconInput,
  NumberInput,
  DateInput,
  DateRangeInput,
  SelectInput,
  SearchableInput,
  SelectWithIconsField,
  SelectBackgroundField,
  ClimateDataField,
  ListFieldEditor,
} from "./index";
import { BulletinComment } from "../../../../../../types/bulletin";

import {
  encodeReviewFieldId,
  decodeReviewFieldId,
  DecodedReviewFieldId,
} from "@/utils/reviewTarget";

interface CardFieldInputProps {
  field?: Field;

  value: Array<
    | string
    | {
        cardId?: string;
        fieldValues?: Record<string, any>;
        _id?: string;
        id?: string;
      }
  >;

  onChange: (value: any[]) => void;
  disabled?: boolean;
  currentPageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  sectionIndex?: number;
  precedingCardIds?: string[];

  commentsByTarget?: Record<string, BulletinComment[]>;

  renderComments?: (comments: BulletinComment[] | undefined) => React.ReactNode;
}

interface SelectedCardData {
  cardId: string;
  card: Card;
  fieldValues: { [fieldId: string]: any };
}

const normalizeTag = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getCardIdFromValue = (
  item:
    | string
    | {
        cardId?: string;
        fieldValues?: Record<string, any>;
        _id?: string;
        id?: string;
      },
): string => {
  if (typeof item === "string") return item;
  return item.cardId || item._id || item.id || "";
};

// Helper para extraer valores por defecto de una card
const getDefaultFieldValues = (card: Card) => {
  const defaultValues: { [key: string]: any } = {};

  const extractFromFields = (fields: Field[]) => {
    fields.forEach((field) => {
      // Si tiene un valor definido, usarlo como default
      if (
        field.value !== undefined &&
        field.value !== null &&
        field.value !== ""
      ) {
        // Para listas, verificar que no esté vacío si es un array
        if (Array.isArray(field.value) && field.value.length === 0) {
          return;
        }
        defaultValues[field.field_id] = field.value;
      }
    });
  };

  // Extraer de bloques
  card.content.blocks.forEach((block) => {
    if (block.fields) {
      extractFromFields(block.fields);
    }
  });

  // Extraer de header/footer si existen
  if (card.content.header_config?.fields) {
    extractFromFields(card.content.header_config.fields);
  }
  if (card.content.footer_config?.fields) {
    extractFromFields(card.content.footer_config.fields);
  }

  return defaultValues;
};

export function CardFieldInput({
  field,
  value = [],
  onChange,
  disabled = false,
  currentPageIndex = 0,
  onPageChange,
  sectionIndex,
  precedingCardIds,
  commentsByTarget = {},
  renderComments,
}: CardFieldInputProps) {
  const t = useTranslations("CreateBulletin.cardField");
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<SelectedCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [pendingCardId, setPendingCardId] = useState("");

  // Obtener la configuración del field
  const fieldConfig = field?.field_config as any;
  const availableCardIds = fieldConfig?.available_cards || [];
  const availableCardTags = fieldConfig?.available_tags || [];
  const cardType = fieldConfig?.card_type;

  type CardReviewPath = Pick<
    DecodedReviewFieldId,
    | "cardIndex"
    | "cardId"
    | "cardBlockIndex"
    | "cardBlockId"
    | "cardFieldIndex"
    | "cardFieldId"
  >;

  type CardListReviewContext = CardReviewPath & {
    parentFieldId: string;
  };

  const getCardReviewTargetId = (path: CardReviewPath): string | undefined => {
    if (!field?.field_id) {
      return undefined;
    }

    return encodeReviewFieldId({
      parentFieldId: field.field_id,
      ...path,
    });
  };

  const getExactComments = (
    targetId?: string,
  ): BulletinComment[] | undefined => {
    if (!targetId) {
      return undefined;
    }

    return commentsByTarget[targetId];
  };

  const getExactCommentCount = (targetId?: string): number =>
    getExactComments(targetId)?.length || 0;

  const renderTargetCommentBadge = (
    targetId?: string,
    title = "Comentarios",
  ) => {
    const count = getExactCommentCount(targetId);

    if (count === 0) {
      return null;
    }

    return (
      <span
        className="
        inline-flex items-center gap-1 rounded-full
        bg-amber-500 px-2 py-0.5
        text-xs font-semibold text-white shadow-sm
      "
        title={`${count} comentario${count === 1 ? "" : "s"} en ${title}`}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {count}
      </span>
    );
  };
  const cardCommentCounts = useMemo(() => {
    if (!field?.field_id) {
      return selectedCards.map(() => 0);
    }

    return selectedCards.map((selectedCard, cardIndex) => {
      return Object.entries(commentsByTarget).reduce(
        (total, [encodedTargetId, targetComments]) => {
          const decoded = decodeReviewFieldId(encodedTargetId);

          if (
            !decoded ||
            decoded.parentFieldId !== field.field_id ||
            decoded.cardIndex !== cardIndex
          ) {
            return total;
          }

          /*
           * cardId es complementario. El índice es la referencia
           * principal porque comentarios antiguos pueden no tener cardId.
           */
          if (decoded.cardId && decoded.cardId !== selectedCard.cardId) {
            return total;
          }

          return total + targetComments.length;
        },
        0,
      );
    });
  }, [commentsByTarget, field?.field_id, selectedCards]);

  // Cargar las cards disponibles
  useEffect(() => {
    loadAvailableCards();
  }, [field?.field_id, precedingCardIds?.length, sectionIndex]);

  // Sincronizar selectedCards con value
  useEffect(() => {
    if (availableCards.length > 0 && value.length > 0) {
      const newSelectedCards: SelectedCardData[] = value
        .map((item) => {
          // El item puede ser un string (cardId) o un objeto con {cardId, fieldValues}
          const cardId = getCardIdFromValue(item);
          const existingFieldValues =
            typeof item === "object" && (item as any).fieldValues
              ? (item as any).fieldValues
              : {};

          const existingCard = selectedCards.find((sc) => sc.cardId === cardId);
          if (existingCard) {
            // Mantener los valores existentes o usar los que vienen del prop
            return {
              ...existingCard,
              fieldValues:
                Object.keys(existingFieldValues).length > 0
                  ? existingFieldValues
                  : existingCard.fieldValues,
            };
          }

          const card = availableCards.find((c) => c._id === cardId);
          if (!card) return null;

          // Si no hay valores existentes, usar los valores por defecto de la card
          const finalFieldValues =
            Object.keys(existingFieldValues).length > 0
              ? existingFieldValues
              : getDefaultFieldValues(card);

          return {
            cardId,
            card,
            fieldValues: finalFieldValues,
          };
        })
        .filter((item): item is SelectedCardData => item !== null);

      setSelectedCards(newSelectedCards);
    } else if (value.length === 0) {
      setSelectedCards([]);
    }
  }, [value, availableCards]);

  // Sincronizar la expansión con la página actual del preview
  useEffect(() => {
    if (currentPageIndex !== undefined && selectedCards.length > 0) {
      // Solo expandir la card que corresponde a la página actual
      setExpandedCards(new Set([currentPageIndex]));
    }
  }, [currentPageIndex, selectedCards.length]);

  const loadAvailableCards = async () => {
    setLoading(true);
    setError(null);

    try {
      const shouldCascadeFilter =
        Array.isArray(precedingCardIds) &&
        precedingCardIds.length > 0 &&
        sectionIndex !== undefined &&
        sectionIndex > 0;

      const explicitIds = Array.isArray(availableCardIds)
        ? availableCardIds.filter(Boolean)
        : [];
      const configuredTags = Array.isArray(availableCardTags)
        ? availableCardTags.filter(Boolean)
        : [];

      if (
        explicitIds.length === 0 &&
        configuredTags.length === 0 &&
        !shouldCascadeFilter
      ) {
        setAvailableCards([]);
        return;
      }

      const fallbackResponse: GetCardsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      const [explicitCardsResult, tagsCardsResult] = await Promise.all([
        explicitIds.length > 0
          ? CardAPIService.getCardsByUserGroups()
          : Promise.resolve(fallbackResponse),
        configuredTags.length > 0
          ? CardAPIService.getCardsByTags(configuredTags)
          : Promise.resolve(fallbackResponse),
      ]);

      if (!explicitCardsResult.success && !tagsCardsResult.success) {
        throw new Error(
          tagsCardsResult.message ||
            explicitCardsResult.message ||
            "Error al cargar las cards",
        );
      }

      const mergedCards = new Map<string, Card>();

      if (explicitCardsResult.success) {
        explicitCardsResult.data
          .filter(
            (card) => Boolean(card._id) && explicitIds.includes(card._id!),
          )
          .forEach((card) => {
            if (card._id) {
              mergedCards.set(card._id, card);
            }
          });
      }

      if (tagsCardsResult.success) {
        tagsCardsResult.data.forEach((card) => {
          if (card._id) {
            mergedCards.set(card._id, card);
          }
        });
      }

      let filtered = Array.from(mergedCards.values()).filter(
        (card) => card.status === "active",
      );

      // Preparar conjunto de tags heredados (si aplica) obteniendo solo las cards necesarias
      let precedingTagsSet: Set<string> | null = null;
      if (shouldCascadeFilter) {
        precedingTagsSet = new Set<string>();
        const fetches = precedingCardIds.map((id) =>
          CardAPIService.getCardById(id).catch(() => ({ success: false })),
        );
        const results = await Promise.all(fetches);
        results.forEach((res: any) => {
          if (res && res.success && res.data && Array.isArray(res.data.tags)) {
            res.data.tags.forEach((tag: string) =>
              precedingTagsSet!.add(normalizeTag(tag)),
            );
          }
        });

        // Si no obtuvimos cards desde configuración y tenemos tags heredados,
        // pedir directamente por tags para poblar 'filtered'
        if (filtered.length === 0 && precedingTagsSet.size > 0) {
          const tagsArray = Array.from(precedingTagsSet);
          const byTagsResult = await CardAPIService.getCardsByTags(tagsArray);
          if (byTagsResult.success) {
            filtered = byTagsResult.data.filter(
              (card) => card.status === "active",
            );
          }
        }
      }

      // Si hay un card_type específico, filtrar por ese tipo
      if (cardType) {
        filtered = filtered.filter((card) => card.card_type === cardType);
      }

      // Aplicar filtrado por tags heredados si los tenemos
      if (precedingTagsSet && precedingTagsSet.size > 0) {
        filtered = filtered.filter((card) => {
          if (!Array.isArray(card.tags) || card.tags.length === 0) return false;
          return card.tags.some((tag) =>
            precedingTagsSet!.has(normalizeTag(tag)),
          );
        });
      }

      setAvailableCards(filtered);
    } catch (err) {
      setError("Error de conexión al cargar las cards");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Agregar una nueva card
  const handleAddCard = (cardId: string) => {
    if (value.some((item) => getCardIdFromValue(item) === cardId)) return;

    const card = availableCards.find((c) => c._id === cardId);
    const defaultValues = card ? getDefaultFieldValues(card) : {};

    // Notificar al padre con la estructura completa de datos
    const fullData = [
      ...selectedCards.map((sc) => ({
        cardId: sc.cardId,
        fieldValues: sc.fieldValues,
      })),
      {
        cardId: cardId,
        fieldValues: defaultValues,
      },
    ];
    onChange(fullData as any);
    setPendingCardId("");

    // Expandir automáticamente la card recién agregada
    setExpandedCards(new Set([...expandedCards, value.length]));
  };

  // Eliminar una card
  const handleRemoveCard = (index: number) => {
    const updatedSelectedCards = selectedCards.filter((_, i) => i !== index);

    // Notificar al padre con la estructura completa de datos
    const fullData = updatedSelectedCards.map((sc) => ({
      cardId: sc.cardId,
      fieldValues: sc.fieldValues,
    }));
    onChange(fullData as any);

    // Actualizar los índices expandidos
    const newExpandedCards = new Set<number>();
    expandedCards.forEach((expandedIndex) => {
      if (expandedIndex < index) {
        newExpandedCards.add(expandedIndex);
      } else if (expandedIndex > index) {
        newExpandedCards.add(expandedIndex - 1);
      }
    });
    setExpandedCards(newExpandedCards);
  };

  // Toggle expandir/colapsar card
  const toggleCardExpanded = (index: number) => {
    const isCurrentlyExpanded = expandedCards.has(index);

    if (isCurrentlyExpanded) {
      // Si está expandida, colapsarla
      const newExpanded = new Set(expandedCards);
      newExpanded.delete(index);
      setExpandedCards(newExpanded);
    } else {
      // Si está colapsada, expandirla y cambiar el preview a esta card
      setExpandedCards(new Set([index]));

      // Notificar al preview que cambie de página
      if (onPageChange) {
        onPageChange(index);
      }
    }
  };

  // Actualizar el valor de un field dentro de una card
  const handleFieldChange = (
    cardIndex: number,
    fieldId: string,
    fieldValue: any,
  ) => {
    const updated = [...selectedCards];
    if (updated[cardIndex]) {
      updated[cardIndex] = {
        ...updated[cardIndex],
        fieldValues: {
          ...updated[cardIndex].fieldValues,
          [fieldId]: fieldValue,
        },
      };
    }

    setSelectedCards(updated);

    // Notificar al padre con la estructura completa de datos
    // Convertir selectedCards a un formato que incluya tanto los IDs como los valores
    const fullData = updated.map((sc) => ({
      cardId: sc.cardId,
      fieldValues: sc.fieldValues,
    }));

    // Llamar onChange con la estructura completa
    onChange(fullData as any);
  };

  // Renderizar un field dentro de una card
  const renderCardField = (
    cardField: Field,
    cardIndex: number,
    value: any,
    onChange: (value: any) => void,
    reviewTargetContext: CardListReviewContext,
  ) => {
    const fieldDisabled = disabled || !cardField.form;
    switch (cardField.type) {
      case "text":
        return (
          <TextInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "text_with_icon":
        return (
          <TextWithIconInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "number":
        return (
          <NumberInput
            field={cardField}
            value={value ?? ""}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "date":
        return (
          <DateInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "date_range":
        const dateRangeValue =
          typeof value === "object" && value !== null && !Array.isArray(value)
            ? (value as { start_date: string; end_date: string })
            : { start_date: "", end_date: "" };
        return (
          <DateRangeInput
            field={cardField}
            value={dateRangeValue}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "select":
        return (
          <SelectInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "searchable":
        return (
          <SearchableInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "select_background":
        return (
          <SelectBackgroundField
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={fieldDisabled}
          />
        );

      case "select_with_icons":
        return (
          <SelectWithIconsField
            value={value || ""}
            onChange={onChange}
            options={
              cardField.field_config && "options" in cardField.field_config
                ? cardField.field_config.options || []
                : []
            }
            disabled={fieldDisabled}
          />
        );

      case "climate_data_puntual":
        return (
          <ClimateDataField
            value={value || {}}
            onChange={onChange}
            fieldConfig={cardField.field_config}
            disabled={fieldDisabled}
          />
        );

      case "list": {
        const listValue = Array.isArray(value) ? value : [];

        return (
          <ListFieldEditor
            field={cardField}
            value={listValue}
            onChange={onChange}
            readOnly={fieldDisabled}
            commentsByTarget={commentsByTarget}
            renderComments={renderComments}
            reviewTargetContext={reviewTargetContext}
          />
        );
      }

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            {t("unsupportedFieldType", { type: cardField.type })}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#606c38]" />
        <span className="ml-2 text-sm text-[#283618]/60">{t("loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (availableCards.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">{t("noCardsAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector para agregar cards */}
      <div className="flex gap-2">
        <select
          value={pendingCardId}
          onChange={(e) => setPendingCardId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm"
          disabled={
            disabled ||
            availableCards.every((card) => value.includes(card._id!))
          }
        >
          <option value="">{t("selectCard")}</option>
          {availableCards
            .filter((card) => !value.includes(card._id!))
            .map((card) => (
              <option key={card._id} value={card._id}>
                {card.card_name}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (pendingCardId) {
              handleAddCard(pendingCardId);
            }
          }}
          disabled={
            disabled ||
            !pendingCardId ||
            availableCards.every((card) => value.includes(card._id!))
          }
          className="px-4 py-2 bg-[#606c38] text-white rounded-md hover:bg-[#283618] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>{t("add")}</span>
        </button>
      </div>

      {/* Lista de cards seleccionadas */}
      {selectedCards.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#283618]">
            {t("selectedCards", { count: selectedCards.length })}
          </p>

          {selectedCards.map((selectedCard, index) => {
            const isExpanded = expandedCards.has(index);
            const cardTargetId = getCardReviewTargetId({
              cardIndex: index,
              cardId: selectedCard.cardId,
            });

            const directCardComments = getExactComments(cardTargetId);

            const hasDirectCardComments = Boolean(directCardComments?.length);

            const totalCardComments = cardCommentCounts[index] || 0;
            const cardBlocksToRender = selectedCard.card.content.blocks
              .map((block, cardBlockIndex) => {
                const fields = (block.fields || [])
                  .map((cardField, cardFieldIndex) => {
                    const fieldTargetId = getCardReviewTargetId({
                      cardIndex: index,
                      cardId: selectedCard.cardId,

                      cardBlockIndex,
                      cardBlockId: block.block_id,

                      cardFieldIndex,
                      cardFieldId: cardField.field_id,
                    });

                    /*
                     * Incluye comentarios directos y comentarios internos
                     * de una posible lista.
                     */
                    const nestedCommentCount = Object.entries(
                      commentsByTarget,
                    ).reduce((total, [targetId, comments]) => {
                      const decoded = decodeReviewFieldId(targetId);

                      if (
                        !decoded ||
                        decoded.parentFieldId !== field?.field_id ||
                        decoded.cardIndex !== index ||
                        decoded.cardBlockIndex !== cardBlockIndex ||
                        decoded.cardFieldIndex !== cardFieldIndex
                      ) {
                        return total;
                      }

                      return total + comments.length;
                    }, 0);

                    return {
                      cardField,
                      cardFieldIndex,
                      fieldTargetId,
                      nestedCommentCount,
                    };
                  })
                  .filter(
                    ({ cardField, nestedCommentCount }) =>
                      cardField.form || nestedCommentCount > 0,
                  );

                const blockTargetId = getCardReviewTargetId({
                  cardIndex: index,
                  cardId: selectedCard.cardId,

                  cardBlockIndex,
                  cardBlockId: block.block_id,
                });

                const hasDirectBlockComments =
                  getExactCommentCount(blockTargetId) > 0;

                return {
                  block,
                  cardBlockIndex,
                  blockTargetId,
                  hasDirectBlockComments,
                  fields,
                };
              })
              .filter(
                ({ fields, hasDirectBlockComments }) =>
                  fields.length > 0 || hasDirectBlockComments,
              );

            const totalVisibleFields = cardBlocksToRender.reduce(
              (total, blockEntry) => total + blockEntry.fields.length,
              0,
            );

            return (
              <div
                key={`${selectedCard.cardId}-${index}`}
                className={[
                  "overflow-hidden rounded-lg bg-white transition-all",
                  hasDirectCardComments
                    ? "border-2 border-amber-400 shadow-sm"
                    : "border border-gray-200",
                ].join(" ")}
              >
                {/* Header de la card */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                  <button
                    type="button"
                    onClick={() => toggleCardExpanded(index)}
                    disabled={disabled || totalVisibleFields === 0}
                    className="flex items-center gap-3 flex-1 text-left disabled:cursor-default"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-[#606c38]/20 rounded-full text-[#606c38] font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#283618]">
                        {selectedCard.card.card_name}
                      </p>
                      {totalVisibleFields > 0 && (
                        <p className="text-xs text-[#283618]/60">
                          {t("fieldsToComplete", { count: totalVisibleFields })}
                        </p>
                      )}
                    </div>
                  </button>
                  {totalCardComments > 0 && (
                    <span
                      className="
                        inline-flex items-center gap-1 rounded-full
                        bg-amber-500 px-2 py-0.5
                        text-xs font-semibold text-white shadow-sm
                      "
                      title={`${totalCardComments} comentario${
                        totalCardComments === 1 ? "" : "s"
                      } dentro de esta card`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {totalCardComments}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {totalVisibleFields > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleCardExpanded(index)}
                        className="p-2 text-[#283618]/60 hover:text-[#283618] transition-colors"
                        disabled={disabled}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Campos del form de la card */}
                {isExpanded && cardBlocksToRender.length > 0 && (
                  <div className="space-y-4 p-4">
                    {cardBlocksToRender.map(
                      ({ block, cardBlockIndex, blockTargetId, fields }) => {
                        const directBlockComments =
                          getExactComments(blockTargetId);

                        const hasDirectBlockComments = Boolean(
                          directBlockComments?.length,
                        );

                        return (
                          <div
                            key={`${selectedCard.cardId}-block-${cardBlockIndex}`}
                            className={[
                              "relative rounded-lg p-3 transition-all",
                              hasDirectBlockComments
                                ? "border-2 border-amber-400 bg-amber-50/40"
                                : "border border-gray-100",
                            ].join(" ")}
                          >
                            {(block.display_name || hasDirectBlockComments) && (
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-[#283618]">
                                  {block.display_name ||
                                    `Bloque ${cardBlockIndex + 1}`}
                                </p>

                                {renderTargetCommentBadge(
                                  blockTargetId,
                                  "este bloque",
                                )}
                              </div>
                            )}

                            <div className="space-y-4">
                              {fields.map(
                                ({
                                  cardField,
                                  cardFieldIndex,
                                  fieldTargetId,
                                }) => {
                                  const directFieldComments =
                                    getExactComments(fieldTargetId);

                                  const hasDirectFieldComments = Boolean(
                                    directFieldComments?.length,
                                  );

                                  const reviewTargetContext: CardListReviewContext =
                                    {
                                      parentFieldId: field?.field_id || "",

                                      cardIndex: index,
                                      cardId: selectedCard.cardId,

                                      cardBlockIndex,
                                      cardBlockId: block.block_id,

                                      cardFieldIndex,
                                      cardFieldId: cardField.field_id,
                                    };

                                  return (
                                    <div
                                      key={`${selectedCard.cardId}-${cardBlockIndex}-${cardFieldIndex}`}
                                      className={[
                                        "relative rounded-lg p-3 transition-all",
                                        hasDirectFieldComments
                                          ? "border-2 border-amber-400 bg-amber-50/60 shadow-sm"
                                          : "border-2 border-transparent",
                                      ].join(" ")}
                                    >
                                      <div className="mb-1 flex items-center justify-between gap-3">
                                        <label className="block text-sm font-medium text-[#283618]">
                                          {cardField.label ||
                                            cardField.display_name ||
                                            `Campo ${cardFieldIndex + 1}`}
                                        </label>

                                        {renderTargetCommentBadge(
                                          fieldTargetId,
                                          "este campo",
                                        )}
                                      </div>

                                      {renderCardField(
                                        cardField,
                                        index,
                                        selectedCard.fieldValues[
                                          cardField.field_id
                                        ] ?? cardField.value,
                                        (newValue) =>
                                          handleFieldChange(
                                            index,
                                            cardField.field_id,
                                            newValue,
                                          ),
                                        reviewTargetContext,
                                      )}

                                      {renderComments?.(directFieldComments)}

                                      {cardField.description && (
                                        <p className="mt-1 text-xs text-[#283618]/60">
                                          {cardField.description}
                                        </p>
                                      )}
                                    </div>
                                  );
                                },
                              )}
                            </div>

                            {/* Comentarios dirigidos directamente al bloque */}
                            {renderComments?.(directBlockComments)}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

                {/* Mensaje cuando no hay campos de formulario */}
                {totalVisibleFields === 0 && (
                  <div className="p-4 text-sm text-[#283618]/60 italic">
                    {t("noFieldsToComplete")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mensaje cuando no hay cards seleccionadas */}
      {selectedCards.length === 0 && (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-[#283618]/60">{t("noCardsSelected")}</p>
        </div>
      )}
    </div>
  );
}
