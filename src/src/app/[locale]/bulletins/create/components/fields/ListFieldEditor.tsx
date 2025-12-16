"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  HelpCircle,
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
  const [showHelp, setShowHelp] = useState(false);

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

  const allowCsvImport =
    field.field_config && "allow_csv_import" in field.field_config
      ? field.field_config.allow_csv_import
      : false;

  const climateDataFieldId = Object.keys(itemSchema).find(
    (key) => itemSchema[key].type === "climate_data_puntual"
  );
  const dateFieldId = Object.keys(itemSchema).find(
    (key) => itemSchema[key].type === "date"
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
    return columns;
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      if (lines.length < 2) return; // Need at least header and one row

      const headers = lines[0].split(",").map((h) => h.trim());
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
        }
      );

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map((v) => v.trim());
        const newItem = createEmptyItem();

        // Fill date
        const dateIndex = headers.indexOf("date");
        if (dateIndex !== -1 && dateFieldId) {
          const dateStr = values[dateIndex];
          // Simple parser for MM/DD/YYYY to YYYY-MM-DD if needed
          // Assuming input is MM/DD/YYYY based on user example
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            newItem[dateFieldId] = `${parts[2]}-${parts[0].padStart(
              2,
              "0"
            )}-${parts[1].padStart(2, "0")}`;
          } else {
            newItem[dateFieldId] = dateStr;
          }
        }

        // Fill climate data
        if (climateDataFieldId) {
          const climateData: Record<string, string> = {};
          Object.entries(colNameToParamKey).forEach(([colName, paramKey]) => {
            const colIndex = headers.indexOf(colName);
            if (colIndex !== -1) {
              climateData[paramKey] = values[colIndex];
            }
          });
          newItem[climateDataFieldId] = climateData;
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
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = "";
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
                            {t("maxCharacters", {
                              max: fieldDef.validation.max_length,
                            })}
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
          <p className="text-sm">{t("noItems")}</p>
        </div>
      )}
    </div>
  );
}
