"use client";

import React, { useState, useEffect } from "react";
import { Field } from "../../../../../../types/template";
import { Card } from "../../../../../../types/card";
import { CardAPIService } from "../../../../../../services/cardService";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  TextInput,
  TextWithIconInput,
  NumberInput,
  DateInput,
  DateRangeInput,
  SelectInput,
  SelectWithIconsField,
  SelectBackgroundField,
  ClimateDataField,
  ListFieldEditor,
} from "./index";

interface CardFieldInputProps {
  field?: Field;
  value: string[]; // Array de IDs de cards seleccionadas
  onChange: (value: string[]) => void;
  disabled?: boolean;
  currentPageIndex?: number; // Índice de la página actual del preview
  onPageChange?: (pageIndex: number) => void; // Callback para cambiar de página
}

interface SelectedCardData {
  cardId: string;
  card: Card;
  fieldValues: { [fieldId: string]: any };
}

export function CardFieldInput({
  field,
  value = [],
  onChange,
  disabled = false,
  currentPageIndex = 0,
  onPageChange,
}: CardFieldInputProps) {
  const t = useTranslations("CreateBulletin");
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<SelectedCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // Obtener la configuración del field
  const fieldConfig = field?.field_config as any;
  const availableCardIds = fieldConfig?.available_cards || [];
  const cardType = fieldConfig?.card_type;

  // Cargar las cards disponibles
  useEffect(() => {
    loadAvailableCards();
  }, []);

  // Sincronizar selectedCards con value
  useEffect(() => {
    if (availableCards.length > 0 && value.length > 0) {
      const newSelectedCards: SelectedCardData[] = value
        .map((item) => {
          // El item puede ser un string (cardId) o un objeto con {cardId, fieldValues}
          const cardId = typeof item === "string" ? item : (item as any).cardId;
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

          return {
            cardId,
            card,
            fieldValues: existingFieldValues,
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
      const response = await CardAPIService.getCards();

      if (response.success) {
        // Filtrar cards: solo las disponibles y del tipo correcto
        let filtered = response.data.filter((card) =>
          availableCardIds.includes(card._id)
        );

        // Si hay un card_type específico, filtrar por ese tipo
        if (cardType) {
          filtered = filtered.filter((card) => card.card_type === cardType);
        }

        setAvailableCards(filtered);
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

  // Agregar una nueva card
  const handleAddCard = (cardId: string) => {
    if (value.includes(cardId)) return;

    // Notificar al padre con la estructura completa de datos
    const fullData = [
      ...selectedCards.map((sc) => ({
        cardId: sc.cardId,
        fieldValues: sc.fieldValues,
      })),
      {
        cardId: cardId,
        fieldValues: {},
      },
    ];
    onChange(fullData as any);

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
    fieldValue: any
  ) => {
    setSelectedCards((prev) => {
      const updated = [...prev];
      if (updated[cardIndex]) {
        updated[cardIndex] = {
          ...updated[cardIndex],
          fieldValues: {
            ...updated[cardIndex].fieldValues,
            [fieldId]: fieldValue,
          },
        };
      }

      // Notificar al padre con la estructura completa de datos
      // Convertir selectedCards a un formato que incluya tanto los IDs como los valores
      const fullData = updated.map((sc) => ({
        cardId: sc.cardId,
        fieldValues: sc.fieldValues,
      }));

      // Llamar onChange con la estructura completa
      onChange(fullData as any);

      return updated;
    });
  };

  // Renderizar un field dentro de una card
  const renderCardField = (
    cardField: Field,
    cardIndex: number,
    value: any,
    onChange: (value: any) => void
  ) => {
    switch (cardField.type) {
      case "text":
        return (
          <TextInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case "text_with_icon":
        return (
          <TextWithIconInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case "number":
        return (
          <NumberInput
            field={cardField}
            value={value ?? ""}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case "date":
        return (
          <DateInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
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
            disabled={disabled}
          />
        );

      case "select":
        return (
          <SelectInput
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case "select_background":
        return (
          <SelectBackgroundField
            field={cardField}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
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
            disabled={disabled}
          />
        );

      case "climate_data_puntual":
        return (
          <ClimateDataField
            value={value || {}}
            onChange={onChange}
            fieldConfig={cardField.field_config}
            disabled={disabled}
          />
        );

      case "list":
        const listValue = Array.isArray(value) ? value : [];
        return (
          <ListFieldEditor
            field={cardField}
            value={listValue}
            onChange={onChange}
          />
        );

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            Tipo de campo no soportado en cards: {cardField.type}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#606c38]" />
        <span className="ml-2 text-sm text-[#283618]/60">
          Cargando cards...
        </span>
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
        <p className="text-sm text-gray-600">
          No hay cards disponibles para este campo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector para agregar cards */}
      <div className="flex gap-2">
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddCard(e.target.value);
              e.target.value = "";
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm"
          disabled={disabled}
        >
          <option value="">Seleccionar card...</option>
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
            const firstAvailable = availableCards.find(
              (card) => !value.includes(card._id!)
            );
            if (firstAvailable) {
              handleAddCard(firstAvailable._id!);
            }
          }}
          disabled={
            disabled ||
            availableCards.every((card) => value.includes(card._id!))
          }
          className="px-4 py-2 bg-[#606c38] text-white rounded-md hover:bg-[#283618] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar</span>
        </button>
      </div>

      {/* Lista de cards seleccionadas */}
      {selectedCards.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#283618]">
            Cards seleccionadas: {selectedCards.length}
          </p>

          {selectedCards.map((selectedCard, index) => {
            const isExpanded = expandedCards.has(index);
            const formFields = selectedCard.card.content.blocks
              .flatMap((block) => block.fields)
              .filter((f) => f.form);

            return (
              <div
                key={`${selectedCard.cardId}-${index}`}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                {/* Header de la card */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#606c38]/20 rounded-full text-[#606c38] font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#283618]">
                        {selectedCard.card.card_name}
                      </p>
                      {formFields.length > 0 && (
                        <p className="text-xs text-[#283618]/60">
                          {formFields.length} campo(s) para completar
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {formFields.length > 0 && (
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
                {isExpanded && formFields.length > 0 && (
                  <div className="p-4 space-y-4">
                    {formFields.map((cardField) => (
                      <div key={cardField.field_id}>
                        <label className="block text-sm font-medium text-[#283618] mb-1">
                          {cardField.label || cardField.display_name}
                        </label>
                        {renderCardField(
                          cardField,
                          index,
                          selectedCard.fieldValues[cardField.field_id],
                          (newValue) =>
                            handleFieldChange(
                              index,
                              cardField.field_id,
                              newValue
                            )
                        )}
                        {cardField.description && (
                          <p className="text-xs text-[#283618]/60 mt-1">
                            {cardField.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mensaje cuando no hay campos de formulario */}
                {formFields.length === 0 && (
                  <div className="p-4 text-sm text-[#283618]/60 italic">
                    Esta card no tiene campos para completar
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
          <p className="text-sm text-[#283618]/60">
            No hay cards seleccionadas. Selecciona una card para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}
