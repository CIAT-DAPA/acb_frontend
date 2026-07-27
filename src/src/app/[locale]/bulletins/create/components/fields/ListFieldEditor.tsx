"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Field,
  ClimateDataFieldConfig,
} from "../../../../../../types/template";
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
import { VisualResourceSelector } from "../../../../templates/create/components/VisualResourceSelector";
import { BulletinComment } from "@/types/bulletin";
import { encodeReviewFieldId } from "@/utils/reviewTarget";

interface ListFieldEditorProps {
  field: Field;
  value: any[];
  onChange: (value: any[]) => void;
  commentsByTarget?: Record<string, BulletinComment[]>;
  renderComments?: (comments: BulletinComment[] | undefined) => React.ReactNode;
  readOnly?: boolean;
}

export function ListFieldEditor({
  field,
  value = [],
  onChange,
  commentsByTarget = {},
  renderComments,
  readOnly = false,
}: ListFieldEditorProps) {
  const t = useTranslations("CreateBulletin.listField");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
  const [showHelp, setShowHelp] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [editingIconTarget, setEditingIconTarget] = useState<{
    itemIndex: number;
    fieldId: string;
  } | null>(null);

  // Obtener el esquema de items de la configuración del campo
  const itemSchema =
    field.field_config && "item_schema" in field.field_config
      ? field.field_config.item_schema
      : {};

  const itemSchemaKeys = Object.keys(itemSchema);

  useEffect(() => {
    setExpandedItems((currentExpanded) => {
      const nextExpanded = new Set(currentExpanded);

      value.forEach((_item, itemIndex) => {
        const itemTargetId = getItemTargetId(itemIndex);

        const hasItemComments = Boolean(
          itemTargetId && commentsByTarget[itemTargetId]?.length,
        );

        const hasSubfieldComments = itemSchemaKeys.some((itemFieldId) => {
          const subfieldTargetId = getSubfieldTargetId(itemIndex, itemFieldId);

          return Boolean(
            subfieldTargetId && commentsByTarget[subfieldTargetId]?.length,
          );
        });

        if (hasItemComments || hasSubfieldComments) {
          nextExpanded.add(itemIndex);
        }
      });

      if (nextExpanded.size === currentExpanded.size) {
        return currentExpanded;
      }

      return nextExpanded;
    });
  }, [
    commentsByTarget,
    field.field_id,
    value.length,
    itemSchemaKeys.join("|"),
  ]);

  const getItemTargetId = (itemIndex: number): string | undefined => {
    if (!field.field_id) {
      return undefined;
    }

    return encodeReviewFieldId({
      parentFieldId: field.field_id,
      itemIndex,
    });
  };

  const getSubfieldTargetId = (
    itemIndex: number,
    itemFieldId: string,
  ): string | undefined => {
    if (!field.field_id) {
      return undefined;
    }

    return encodeReviewFieldId({
      parentFieldId: field.field_id,
      itemIndex,
      itemFieldId,
    });
  };

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
        case "text_with_icon":
          newItem[fieldId] = { text: "", icon: "" };
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

  const allowCsvImport =
    field.field_config && "allow_csv_import" in field.field_config
      ? field.field_config.allow_csv_import
      : false;

  const climateDataFieldId = Object.keys(itemSchema).find(
    (key) => itemSchema[key].type === "climate_data_puntual",
  );
  const dateFieldId = Object.keys(itemSchema).find(
    (key) => itemSchema[key].type === "date",
  );
  const textFieldIds = Object.keys(itemSchema).filter(
    (key) => itemSchema[key].type === "text",
  );
  const showCsvUpload = allowCsvImport && climateDataFieldId && dateFieldId;

  const getExpectedColumns = () => {
    const columns = ["date"];
    if (climateDataFieldId) {
      const fieldConfig = itemSchema[climateDataFieldId]
        ?.field_config as ClimateDataFieldConfig;
      const climateDataConfig = fieldConfig?.available_parameters || {};
      Object.values(climateDataConfig).forEach((config: any) => {
        if (config.col_name) {
          columns.push(config.col_name);
        }
      });
    }
    if (textFieldIds.length > 0) {
      columns.push("description");
    }
    return columns;
  };

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Handle escaped quotes "" inside quoted values.
        if (insideQuotes && line[i + 1] === '"') {
          currentValue += '"';
          i += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values.map((value) => value.replace(/^"|"$/g, ""));
  };

  const decodeCsvBuffer = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);

    const hasUtf16LePattern = (() => {
      if (bytes.length < 4) return false;
      let zeroCount = 0;
      const sampleLength = Math.min(bytes.length, 2000);
      for (let i = 1; i < sampleLength; i += 2) {
        if (bytes[i] === 0x00) {
          zeroCount += 1;
        }
      }
      return zeroCount > sampleLength / 8;
    })();

    const hasUtf16BePattern = (() => {
      if (bytes.length < 4) return false;
      let zeroCount = 0;
      const sampleLength = Math.min(bytes.length, 2000);
      for (let i = 0; i < sampleLength; i += 2) {
        if (bytes[i] === 0x00) {
          zeroCount += 1;
        }
      }
      return zeroCount > sampleLength / 8;
    })();

    if (
      bytes.length >= 3 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf
    ) {
      return new TextDecoder("utf-8").decode(bytes.slice(3));
    }

    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(bytes.slice(2));
    }

    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder("utf-16be").decode(bytes.slice(2));
    }

    if (hasUtf16LePattern && !hasUtf16BePattern) {
      return new TextDecoder("utf-16le").decode(bytes);
    }

    if (hasUtf16BePattern && !hasUtf16LePattern) {
      return new TextDecoder("utf-16be").decode(bytes);
    }

    const encodings = ["utf-8", "windows-1258", "windows-1252", "iso-8859-1"];

    for (const encoding of encodings) {
      try {
        const decoded = new TextDecoder(encoding, {
          fatal: encoding === "utf-8",
        }).decode(bytes);

        if (encoding === "utf-8") {
          if (decoded.includes("�") || decoded.includes("\u0000")) {
            continue;
          }
        }

        return decoded;
      } catch {
        continue;
      }
    }

    return new TextDecoder("utf-8").decode(bytes);
  };

  const handleCsvUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const text = decodeCsvBuffer(buffer);

      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      if (lines.length < 2) return; // Need at least header and one row

      const headers = parseCsvLine(lines[0]);
      const getHeaderIndex = (headerName: string) =>
        headers.findIndex(
          (header) => header.toLowerCase() === headerName.toLowerCase(),
        );

      const dateIndex = getHeaderIndex("date");
      const descriptionIndex = getHeaderIndex("description");

      const descriptionTextFieldId = textFieldIds.find((fieldId) => {
        const fieldDef = itemSchema[fieldId];
        const searchableIdentifier = [
          fieldId,
          fieldDef?.field_id,
          fieldDef?.label,
          fieldDef?.display_name,
          fieldDef?.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          searchableIdentifier.includes("description") ||
          searchableIdentifier.includes("descripcion")
        );
      });
      const csvDescriptionTargetFieldId =
        descriptionTextFieldId || textFieldIds[0];
      const newItems: any[] = [];

      // Get climate data config to map columns
      const fieldConfig = itemSchema[climateDataFieldId!]
        ?.field_config as ClimateDataFieldConfig;
      const climateDataConfig = fieldConfig?.available_parameters || {};

      // Map col_name to parameter key (e.g. "temp_max" -> "t_max")
      const colNameToParamKey: Record<string, string> = {};
      Object.entries(climateDataConfig).forEach(
        ([key, config]: [string, any]) => {
          if (config.col_name) {
            colNameToParamKey[config.col_name] = key;
          }
        },
      );

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCsvLine(line);
        const newItem = createEmptyItem();

        // Fill date
        if (dateIndex !== -1 && dateFieldId) {
          const dateStr = values[dateIndex] || "";
          // Simple parser for MM/DD/YYYY to YYYY-MM-DD if needed
          // Assuming input is MM/DD/YYYY based on user example
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            newItem[dateFieldId] = `${parts[2]}-${parts[0].padStart(
              2,
              "0",
            )}-${parts[1].padStart(2, "0")}`;
          } else {
            newItem[dateFieldId] = dateStr;
          }
        }

        // Fill climate data
        if (climateDataFieldId) {
          const climateData: Record<string, string> = {};
          Object.entries(colNameToParamKey).forEach(([colName, paramKey]) => {
            const colIndex = getHeaderIndex(colName);
            if (colIndex !== -1) {
              climateData[paramKey] = values[colIndex] || "";
            }
          });
          newItem[climateDataFieldId] = climateData;
        }

        // Fill list text field from CSV description column, if present.
        if (descriptionIndex !== -1 && csvDescriptionTargetFieldId) {
          const descriptionValue = values[descriptionIndex] || "";
          if (descriptionValue) {
            newItem[csvDescriptionTargetFieldId] = descriptionValue;
          }
        }

        newItems.push(newItem);
      }

      if (newItems.length > 0) {
        onChange([...value, ...newItems]);
        // Expand new items
        const newExpanded = new Set(expandedItems);
        for (let i = 0; i < newItems.length; i++) {
          newExpanded.add(value.length + i);
        }
        setExpandedItems(newExpanded);
      }
    } finally {
      // Reset input
      event.target.value = "";
    }
  };

  // Agregar un nuevo item
  const handleAddItem = () => {
    if (maxItems && value.length >= maxItems) {
      return;
    }

    const newItem = createEmptyItem();

    // Si hay items previos y existe un campo de fecha, autoincrementar la fecha
    if (value.length > 0 && dateFieldId) {
      const lastItem = value[value.length - 1];
      const lastDateVal = lastItem[dateFieldId];

      if (lastDateVal && typeof lastDateVal === "string") {
        try {
          // Asumiendo formato YYYY-MM-DD
          const parts = lastDateVal.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
            const day = parseInt(parts[2], 10);

            const date = new Date(year, month, day);
            date.setDate(date.getDate() + 1);

            const nextYear = date.getFullYear();
            const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
            const nextDay = String(date.getDate()).padStart(2, "0");

            newItem[dateFieldId] = `${nextYear}-${nextMonth}-${nextDay}`;
          }
        } catch (e) {
          console.error("Error calculating next date", e);
        }
      }
    }

    const newValue = [...value, newItem];
    onChange(newValue);
    setExpandedItems(new Set([value.length]));
  };

  // Eliminar un item
  const handleRemoveItem = (index: number) => {
    if (value.length <= minItems) {
      return;
    }
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);

    const nextExpanded = new Set<number>();
    const currentExpandedIndex = [...expandedItems][0];

    if (currentExpandedIndex !== undefined) {
      if (currentExpandedIndex === index) {
        const fallbackIndex = Math.min(index, newValue.length - 1);
        if (fallbackIndex >= 0) {
          nextExpanded.add(fallbackIndex);
        }
      } else if (currentExpandedIndex > index) {
        nextExpanded.add(currentExpandedIndex - 1);
      } else {
        nextExpanded.add(currentExpandedIndex);
      }
    }

    setExpandedItems(nextExpanded);
  };

  // Actualizar el valor de un campo dentro de un item
  const handleFieldChange = (
    itemIndex: number,
    fieldId: string,
    fieldValue: any,
  ) => {
    const newValue = value.map((item, idx) =>
      idx === itemIndex ? { ...item, [fieldId]: fieldValue } : item,
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
    const currentExpandedIndex = [...expandedItems][0];
    if (currentExpandedIndex === index) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set([index]));
    }
  };

  // Renderizar un campo individual dentro del item
  const renderItemField = (
    itemIndex: number,
    fieldId: string,
    fieldDef: any,
  ) => {
    // Obtener el valor del campo o usar un valor por defecto apropiado según el tipo
    const getDefaultValue = (type: string) => {
      switch (type) {
        case "climate_data_puntual":
          return {};
        case "text_with_icon":
          return { text: "", icon: "" };
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

      case "text_with_icon": {
        const itemValue =
          typeof fieldValue === "string"
            ? { text: fieldValue, icon: "" }
            : fieldValue || {};
        const textValue = itemValue.text || "";
        const selectedIcon = itemValue.icon || "";

        const handleTextChange = (text: string) => {
          handleChange({ text, icon: selectedIcon });
        };

        const handleOpenIconSelector = () => {
          setEditingIconTarget({ itemIndex, fieldId });
          setShowIconSelector(true);
        };

        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {fieldDef.label || fieldId}
              </label>
              <input
                type="text"
                value={textValue}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm"
                placeholder={fieldDef.description || fieldDef.label}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("icons")}
              </label>
              <div className="flex items-center space-x-2">
                {selectedIcon ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="relative w-12 h-12 border border-gray-300 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={selectedIcon}
                        alt="Selected icon"
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenIconSelector}
                      className={`${btnOutlineSecondary} whitespace-nowrap`}
                    >
                      {t("changeIcon")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenIconSelector}
                    className={`${btnOutlineSecondary} w-full`}
                  >
                    {t("selectIcon")}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

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

  const formatReadOnlyValue = (rawValue: unknown): string => {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return "Sin valor";
    }

    if (typeof rawValue === "boolean") {
      return rawValue ? "Sí" : "No";
    }

    if (typeof rawValue === "string" || typeof rawValue === "number") {
      return String(rawValue);
    }

    if (
      typeof rawValue === "object" &&
      rawValue !== null &&
      "text" in rawValue
    ) {
      return String((rawValue as { text?: unknown }).text || "Sin valor");
    }

    try {
      return JSON.stringify(rawValue, null, 2);
    } catch {
      return String(rawValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#606c38]">
          {t("items", { count: value.length })}
          {maxItems && ` ${t("maximum", { max: maxItems })}`}
        </span>
        {!readOnly && (
          <div className="flex gap-2">
            {showCsvUpload && (
              <div className="flex items-stretch border-2 border-[#bc6c25] rounded bg-white">
                {/* Upload Button Part */}
                <div className="relative group hover:bg-[#bc6c25] transition-colors border-r border-[#bc6c25]/20">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-2 px-4 py-3 text-[#283618] group-hover:text-[#fefae0] text-sm font-medium transition-colors">
                    <Upload size={16} />
                    {t("importCsv")}
                  </div>
                </div>

                {/* Help Icon Part */}
                <div
                  className="relative flex items-center px-3 hover:bg-[#bc6c25]/10 cursor-help transition-colors"
                  onMouseEnter={() => setShowHelp(true)}
                  onMouseLeave={() => setShowHelp(false)}
                >
                  <HelpCircle size={18} className="text-[#bc6c25]" />

                  {showHelp && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white p-4 rounded-lg shadow-xl border border-gray-200 z-50 text-sm cursor-auto">
                      <h4 className="font-semibold mb-3 text-[#283618] border-b pb-2">
                        {t("csvRequirements")}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-gray-700 mb-1">
                            {t("dateFormat")}
                          </p>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 block w-fit">
                            MM/DD/YYYY
                          </code>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-1">
                            {t("requiredColumns")}
                          </p>
                          <div className="bg-gray-50 rounded p-2 max-h-40 overflow-y-auto">
                            <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                              {getExpectedColumns().map((col) => (
                                <li key={col} className="font-mono">
                                  {col}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
        )}
      </div>

      <div className="space-y-3">
        {value.map((item, itemIndex) => {
          /*
           * Este ID representa el ítem completo.
           * Solo se utiliza para comentarios hechos directamente al ítem.
           */
          const itemTargetId = getItemTargetId(itemIndex);

          const itemComments = itemTargetId
            ? commentsByTarget[itemTargetId]
            : undefined;

          const hasItemComments = Boolean(itemComments?.length);

          const nestedItemCommentCount = Object.keys(itemSchema).reduce(
            (total, itemFieldId) => {
              const subfieldTargetId = getSubfieldTargetId(
                itemIndex,
                itemFieldId,
              );

              if (!subfieldTargetId) {
                return total;
              }

              return total + (commentsByTarget[subfieldTargetId]?.length || 0);
            },
            0,
          );

          const directItemCommentCount = itemComments?.length || 0;

          const totalItemCommentCount =
            directItemCommentCount + nestedItemCommentCount;

          const hasAnyItemComments = totalItemCommentCount > 0;

          return (
            <div
              key={itemTargetId || itemIndex}
              id={itemTargetId ? `review-target-${itemTargetId}` : undefined}
              className={[
                "overflow-hidden rounded-lg transition-all duration-200",
                hasItemComments
                  ? "border-2 border-amber-400 bg-amber-50/60 shadow-sm"
                  : "border border-gray-300",
              ].join(" ")}
            >
              {/* Header del ítem */}
              <div
                className={[
                  "flex items-center justify-between px-4 py-2 transition-colors",
                  hasAnyItemComments ? "bg-amber-50" : "bg-gray-50",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(itemIndex)}
                  className="flex items-center gap-2 text-sm font-medium text-[#283618] transition-colors hover:text-[#606c38]"
                >
                  {expandedItems.has(itemIndex) ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}

                  {t("item", {
                    index: itemIndex + 1,
                  })}
                </button>

                <div className="flex items-center gap-2">
                  {hasAnyItemComments && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
                      title={`${totalItemCommentCount} comentario${
                        totalItemCommentCount === 1 ? "" : "s"
                      } dentro de este ítem`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {totalItemCommentCount}
                    </span>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(itemIndex)}
                      disabled={value.length <= minItems}
                      className="text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      title={t("removeItem")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {hasItemComments && (
                <div className="bg-amber-50 px-4 pb-3">
                  {renderComments?.(itemComments)}
                </div>
              )}

              {/* Campos internos del ítem */}
              {expandedItems.has(itemIndex) && (
                <div className="space-y-3 bg-white p-4">
                  {Object.entries(itemSchema).map(
                    ([itemFieldId, fieldDef]: [string, any]) => {
                      const subfieldTargetId = getSubfieldTargetId(
                        itemIndex,
                        itemFieldId,
                      );

                      const subfieldComments = subfieldTargetId
                        ? commentsByTarget[subfieldTargetId]
                        : undefined;

                      const hasSubfieldComments = Boolean(
                        subfieldComments?.length,
                      );

                      /*
                       * Un subfield form=false normalmente se oculta.
                       * Si tiene comentarios, debe mostrarse.
                       */
                      if (
                        fieldDef.form === false &&
                        !hasSubfieldComments &&
                        !readOnly
                      ) {
                        return null;
                      }

                      const currentValue =
                        item?.[itemFieldId] ?? fieldDef.value;

                      return (
                        <div
                          key={itemFieldId}
                          id={
                            subfieldTargetId
                              ? `review-target-${subfieldTargetId}`
                              : undefined
                          }
                          className={[
                            "relative rounded-lg p-3 transition-all duration-200",
                            hasSubfieldComments
                              ? "border-2 border-amber-400 bg-amber-50/60 shadow-sm"
                              : "border-2 border-transparent",
                          ].join(" ")}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="text-sm font-medium text-[#283618]">
                              {fieldDef.display_name ||
                                fieldDef.label ||
                                itemFieldId}

                              {fieldDef.validation?.required && !readOnly && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </label>

                            {hasSubfieldComments && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
                                title={`${
                                  subfieldComments?.length || 0
                                } comentario${
                                  subfieldComments?.length === 1 ? "" : "s"
                                } en este campo`}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                {subfieldComments?.length}
                              </span>
                            )}
                          </div>

                          {readOnly || fieldDef.form === false ? (
                            <div className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                              {formatReadOnlyValue(currentValue)}
                            </div>
                          ) : (
                            renderItemField(itemIndex, itemFieldId, fieldDef)
                          )}

                          {renderComments?.(subfieldComments)}

                          {fieldDef.description && (
                            <p className="mt-1 text-xs text-[#606c38]">
                              {fieldDef.description}
                            </p>
                          )}

                          {!readOnly && fieldDef.validation?.max_length && (
                            <p className="mt-1 text-xs text-[#606c38]">
                              {t("maxCharacters", {
                                max: fieldDef.validation.max_length,
                              })}
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {value.length === 0 && (
        <div className="text-center py-8 text-[#606c38] border border-dashed border-gray-300 rounded-lg">
          <p className="text-sm">{t("noItems")}</p>
        </div>
      )}

      <VisualResourceSelector
        isOpen={showIconSelector}
        onClose={() => {
          setShowIconSelector(false);
          setEditingIconTarget(null);
        }}
        onSelect={(iconUrl) => {
          if (!editingIconTarget) return;

          const { itemIndex, fieldId } = editingIconTarget;
          const currentItem = value[itemIndex] || {};
          const currentFieldValue = currentItem[fieldId];
          const normalizedFieldValue =
            typeof currentFieldValue === "string"
              ? { text: currentFieldValue, icon: "" }
              : currentFieldValue || { text: "", icon: "" };

          handleFieldChange(itemIndex, fieldId, {
            text: normalizedFieldValue.text || "",
            icon: iconUrl,
          });
        }}
        title="Seleccionar icono"
        resourceType="icon"
        selectedUrl={
          editingIconTarget
            ? (() => {
                const { itemIndex, fieldId } = editingIconTarget;
                const currentItem = value[itemIndex] || {};
                const currentFieldValue = currentItem[fieldId];
                if (typeof currentFieldValue === "string") return "";
                return currentFieldValue?.icon || "";
              })()
            : undefined
        }
      />
    </div>
  );
}
