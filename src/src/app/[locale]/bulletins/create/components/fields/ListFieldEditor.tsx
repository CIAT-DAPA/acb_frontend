"use client";

import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Field } from "../../../../../../types/template";
import {
  TextField,
  NumberField,
  DateField,
  SelectField,
  SearchableInput,
  SelectWithIconsField,
  ClimateDataField,
} from "./index";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";

interface ListFieldEditorProps {
  field: Field;
  value: any[];
  onChange: (value: any[]) => void;
}

export function ListFieldEditor({
  field,
  value = [],
  onChange,
}: ListFieldEditorProps) {
  const t = useTranslations("CreateBulletin.listField");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  // Obtener el esquema de items de la configuración del campo
  const itemSchema =
    field.field_config && "item_schema" in field.field_config
      ? field.field_config.item_schema
      : {};

  const maxItems =
    field.field_config && "max_items" in field.field_config
      ? field.field_config.max_items
      : undefined;

  const minItems =
    field.field_config && "min_items" in field.field_config
      ? field.field_config.min_items
      : 0;

  // Crear un nuevo item vacío basado en el esquema
  const createEmptyItem = () => {
    const newItem: any = {};
    Object.entries(itemSchema).forEach(([fieldId, fieldDef]: [string, any]) => {
      // Inicializar con el valor apropiado según el tipo de campo
      switch (fieldDef.type) {
        case "climate_data_puntual":
          newItem[fieldId] = {};
          break;
        case "number":
          newItem[fieldId] = null;
          break;
        case "date":
          newItem[fieldId] = null;
          break;
        default:
          newItem[fieldId] = "";
          break;
      }
    });
    return newItem;
  };

  // Agregar un nuevo item
  const handleAddItem = () => {
    if (maxItems && value.length >= maxItems) {
      return;
    }
    const newValue = [...value, createEmptyItem()];
    onChange(newValue);
    setExpandedItems(new Set([...expandedItems, value.length]));
  };

  // Eliminar un item
  const handleRemoveItem = (index: number) => {
    if (value.length <= minItems) {
      return;
    }
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
    const newExpanded = new Set(expandedItems);
    newExpanded.delete(index);
    setExpandedItems(newExpanded);
  };

  // Actualizar el valor de un campo dentro de un item
  const handleFieldChange = (
    itemIndex: number,
    fieldId: string,
    fieldValue: any
  ) => {
    const newValue = value.map((item, idx) =>
      idx === itemIndex ? { ...item, [fieldId]: fieldValue } : item
    );
    console.log("ListFieldEditor - Updating value:", {
      itemIndex,
      fieldId,
      fieldValue,
      newValue,
    });
    onChange(newValue);
  };

  // Toggle expand/collapse de un item
  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Renderizar un campo individual dentro del item
  const renderItemField = (
    itemIndex: number,
    fieldId: string,
    fieldDef: any
  ) => {
    // Obtener el valor del campo o usar un valor por defecto apropiado según el tipo
    const getDefaultValue = (type: string) => {
      switch (type) {
        case "climate_data_puntual":
          return {};
        case "number":
          return null;
        case "date":
          return null;
        default:
          return "";
      }
    };

    const fieldValue =
      value[itemIndex]?.[fieldId] ?? getDefaultValue(fieldDef.type);
    const handleChange = (val: any) =>
      handleFieldChange(itemIndex, fieldId, val);

    switch (fieldDef.type) {
      case "text":
        const isLongText = fieldDef.field_config?.subtype === "long";
        return (
          <TextField
            value={fieldValue as string}
            onChange={handleChange}
            placeholder={fieldDef.description || fieldDef.label}
            isLong={isLongText}
            maxLength={fieldDef.validation?.max_length}
          />
        );

      case "number":
        return (
          <NumberField
            value={fieldValue as number}
            onChange={handleChange}
            placeholder={fieldDef.description || fieldDef.label}
            min={fieldDef.validation?.min}
            max={fieldDef.validation?.max}
          />
        );

      case "date":
        return (
          <DateField value={fieldValue as string} onChange={handleChange} />
        );

      case "select":
        const options = fieldDef.field_config?.options || [];
        return (
          <SelectField
            value={fieldValue as string}
            onChange={handleChange}
            options={options}
          />
        );

      case "searchable":
        const searchableOptions = fieldDef.field_config?.options || [];
        return (
          <SearchableInput
            value={fieldValue as string}
            onChange={handleChange}
            options={searchableOptions}
          />
        );

      case "select_with_icons":
        const selectOptions = fieldDef.field_config?.options || [];
        return (
          <SelectWithIconsField
            value={fieldValue as string}
            onChange={handleChange}
            options={selectOptions}
          />
        );

      case "climate_data_puntual":
        return (
          <ClimateDataField
            value={fieldValue}
            onChange={handleChange}
            fieldConfig={fieldDef.field_config}
          />
        );

      default:
        return (
          <TextField
            value={fieldValue as string}
            onChange={handleChange}
            placeholder={fieldDef.description || fieldDef.label}
          />
        );
    }
  };

  // Inicializar con al menos minItems si el array está vacío
  React.useEffect(() => {
    if (value.length < minItems) {
      const itemsToAdd = minItems - value.length;
      const newValue = [
        ...value,
        ...Array.from({ length: itemsToAdd }, () => createEmptyItem()),
      ];
      onChange(newValue);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#606c38]">
          {t("items", { count: value.length })}
          {maxItems && ` ${t("maximum", { max: maxItems })}`}
        </span>
        <button
          type="button"
          onClick={handleAddItem}
          disabled={maxItems ? value.length >= maxItems : false}
          className={`${btnOutlineSecondary} text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Plus size={16} />
          {t("addItem")}
        </button>
      </div>

      <div className="space-y-3">
        {value.map((item, itemIndex) => (
          <div
            key={itemIndex}
            className="border border-gray-300 rounded-lg overflow-hidden"
          >
            {/* Header del item */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
              <button
                type="button"
                onClick={() => toggleExpand(itemIndex)}
                className="flex items-center gap-2 text-sm font-medium text-[#283618] hover:text-[#606c38] transition-colors"
              >
                {expandedItems.has(itemIndex) ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                {t("item", { index: itemIndex + 1 })}
              </button>
              <button
                type="button"
                onClick={() => handleRemoveItem(itemIndex)}
                disabled={value.length <= minItems}
                className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t("removeItem")}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Campos del item */}
            {expandedItems.has(itemIndex) && (
              <div className="p-4 space-y-3 bg-white">
                {Object.entries(itemSchema).map(
                  ([fieldId, fieldDef]: [string, any]) => {
                    // Solo mostrar campos que son editables en el formulario
                    if (fieldDef.form === false) {
                      return null;
                    }

                    return (
                      <div key={fieldId}>
                        <label className="block text-sm font-medium text-[#283618] mb-1">
                          {fieldDef.label || fieldId}
                          {fieldDef.validation?.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {renderItemField(itemIndex, fieldId, fieldDef)}
                        {fieldDef.description && (
                          <p className="text-xs text-[#606c38] mt-1">
                            {fieldDef.description}
                          </p>
                        )}
                        {fieldDef.validation?.max_length && (
                          <p className="text-xs text-[#606c38] mt-1">
                            {t("maxCharacters", { max: fieldDef.validation.max_length })}
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <div className="text-center py-8 text-[#606c38] border border-dashed border-gray-300 rounded-lg">
          <p className="text-sm">
            {t("noItems")}
          </p>
        </div>
      )}
    </div>
  );
}
