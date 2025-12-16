"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ListFieldConfig, Field } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { FieldEditor } from "../FieldEditor";
import {
  btnOutlineSecondary,
  inputClass,
  labelClass,
  labelXsClass,
  helpTextClass,
  cardClass,
  btnIconClass,
  btnDangerIconClass,
} from "@/app/[locale]/components/ui";
import { Plus, Settings, Trash2, GripVertical } from "lucide-react";
import { VisualResourceSelector } from "../VisualResourceSelector";

// Componente para renderizar el input apropiado según el tipo de campo
interface ItemFieldInputProps {
  fieldId: string;
  fieldDef: any;
  value: any;
  onChange: (value: any) => void;
  onFieldDefChange?: (updatedFieldDef: any) => void; // Nueva prop para actualizar el fieldDef
}

const ItemFieldInput: React.FC<ItemFieldInputProps> = ({
  fieldId,
  fieldDef,
  value,
  onChange,
  onFieldDefChange,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.listConfig");
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);

  // Para campos de tipo image, usar el VisualResourceSelector
  if (fieldDef.type === "image") {
    // Verificar si el field_config tiene show_label configurado
    const showLabel = fieldDef.field_config?.show_label ?? true;

    // El valor puede ser un string (solo URL) o un objeto {url, label}
    const imageValue =
      typeof value === "string" ? { url: value, label: "" } : value || {};
    const imageUrl = imageValue.url || "";
    const imageLabel = imageValue.label || "";

    const handleImageChange = (url: string) => {
      if (showLabel) {
        onChange({ url, label: imageLabel });
      } else {
        onChange(url); // Solo guardar la URL si no se muestra el label
      }
      setShowImageSelector(false);
    };

    const handleLabelChange = (label: string) => {
      onChange({ url: imageUrl, label });
    };

    return (
      <>
        <div className="space-y-3">
          {/* Selector de imagen */}
          <div className="flex items-center space-x-2">
            {imageUrl ? (
              <div className="flex items-center space-x-2 flex-1">
                <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                  <img
                    src={imageUrl}
                    alt={fieldDef.label || fieldId}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageSelector(true)}
                  className={`${btnOutlineSecondary} whitespace-nowrap`}
                >
                  {t("changeImage")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowImageSelector(true)}
                className={`${btnOutlineSecondary} w-full`}
              >
                {t("selectImage")}
              </button>
            )}
          </div>

          {/* Input para el label de la imagen - solo si show_label está habilitado */}
          {imageUrl && showLabel && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("imageLabel")}
              </label>
              <input
                type="text"
                value={imageLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                className={inputClass}
                placeholder={t("imageLabelPlaceholder")}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("imageLabelHelp")}
              </p>
            </div>
          )}
        </div>

        <VisualResourceSelector
          isOpen={showImageSelector}
          onClose={() => setShowImageSelector(false)}
          onSelect={handleImageChange}
          title={`${t("selectTitle")} ${fieldDef.label || fieldId}`}
          resourceType="image"
          selectedUrl={imageUrl}
        />
      </>
    );
  }

  // Para campos de tipo text_with_icon, permitir seleccionar icono y escribir texto
  if (fieldDef.type === "text_with_icon") {
    // El valor puede ser un string (solo texto) o un objeto {text, icon}
    const itemValue =
      typeof value === "string" ? { text: value, icon: "" } : value || {};
    const textValue = itemValue.text || "";
    const selectedIcon = itemValue.icon || "";

    const handleIconChange = (url: string) => {
      onChange({ text: textValue, icon: url });
      setShowIconSelector(false);
    };

    const handleTextChange = (text: string) => {
      onChange({ text, icon: selectedIcon });
    };

    return (
      <>
        <div className="space-y-3">
          {/* Input para el texto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {fieldDef.label || fieldId}
            </label>
            <input
              type="text"
              value={textValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className={inputClass}
              placeholder={`${t("enterValue")} ${fieldDef.label || fieldId}`}
            />
          </div>

          {/* Selector de icono */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("iconLabel")}
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
                    onClick={() => setShowIconSelector(true)}
                    className={`${btnOutlineSecondary} whitespace-nowrap`}
                  >
                    {t("changeIcon")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowIconSelector(true)}
                  className={`${btnOutlineSecondary} w-full`}
                >
                  {t("selectIcon")}
                </button>
              )}
            </div>
          </div>
        </div>

        <VisualResourceSelector
          isOpen={showIconSelector}
          onClose={() => setShowIconSelector(false)}
          onSelect={handleIconChange}
          title={t("selectIconTitle")}
          resourceType="icon"
          selectedUrl={selectedIcon}
        />
      </>
    );
  }

  // Para otros tipos, usar un input de texto simple por ahora
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      placeholder={`${t("enterValue")} ${fieldDef.label || fieldId}`}
    />
  );
};

// Componente para configurar cada campo del esquema usando el FieldEditor completo
interface ItemSchemaFieldProps {
  fieldId: string;
  fieldDef: any;
  onUpdate: (updatedField: any) => void;
  onDelete: () => void;
}

const ItemSchemaField: React.FC<ItemSchemaFieldProps> = ({
  fieldId,
  fieldDef,
  onUpdate,
  onDelete,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.listConfig");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  // Convertir el fieldDef a un Field completo para el FieldEditor
  const fieldForEditor: Field = {
    field_id: fieldId,
    display_name: fieldDef.label || fieldId,
    type: fieldDef.type || "text",
    description: fieldDef.description || "",
    label: fieldDef.label || "",
    form: fieldDef.form !== undefined ? fieldDef.form : true,
    bulletin: fieldDef.bulletin !== undefined ? fieldDef.bulletin : true,
    validation: fieldDef.validation || {},
    field_config: fieldDef.field_config || {},
    style_config: fieldDef.style_config || {},
    value: fieldDef.value,
  };

  return (
    <div className="border rounded-lg p-4 transition-all duration-200 border-gray-200 bg-gray-50 hover:shadow-md hover:border-gray-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {/* Icono de arrastre */}
          <div
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 transition-colors"
            title={t("dragToReorder")}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-[#283618]">
              {fieldDef.label || fieldId}
            </h4>
            <p className="text-sm text-[#283618]/50">
              {t("type")}: {fieldDef.type || "text"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowFieldEditor(true)}
            className={btnIconClass}
            title={t("configureField")}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={btnDangerIconClass}
            title={t("deleteField")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-[#283618] grid grid-cols-2 gap-2">
        <div>
          {t("form")}:
          <span
            className={fieldDef.form ? "text-green-600" : "text-[#283618]/50"}
          >
            {fieldDef.form ? ` ${t("yes")}` : ` ${t("no")}`}
          </span>
        </div>
        <div>
          {t("bulletin")}:
          <span
            className={
              fieldDef.bulletin ? "text-green-600" : "text-[#283618]/50"
            }
          >
            {fieldDef.bulletin ? ` ${t("yes")}` : ` ${t("no")}`}
          </span>
        </div>
      </div>

      {/* Modal del FieldEditor */}
      {showFieldEditor && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t("configureFieldTitle")}: {fieldDef.label || fieldId}
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <FieldEditor
                field={fieldForEditor}
                onFieldChange={(updatedField) => {
                  // Convertir de vuelta a fieldDef
                  const updatedFieldDef = {
                    type: updatedField.type,
                    label: updatedField.label,
                    description: updatedField.description,
                    form: updatedField.form,
                    bulletin: updatedField.bulletin,
                    validation: updatedField.validation,
                    field_config: updatedField.field_config,
                    style_config: updatedField.style_config,
                    value: updatedField.value,
                  };
                  onUpdate(updatedFieldDef);
                  setShowFieldEditor(false);
                }}
                onClose={() => setShowFieldEditor(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ListFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.listConfig");
  const isFormMode = currentField.form !== false;

  // Helper para obtener config tipada
  const fieldConfig = currentField.field_config as ListFieldConfig;

  return (
    <div className="space-y-4">
      {/* Solo mostrar límites en modo formulario */}
      {isFormMode && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("minItems")}</label>
            <input
              type="number"
              min="0"
              value={fieldConfig?.min_items || 0}
              onChange={(e) =>
                updateFieldConfig({
                  min_items: parseInt(e.target.value) || 0,
                })
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>{t("maxItems")}</label>
            <input
              type="number"
              min="1"
              value={fieldConfig?.max_items || 10}
              onChange={(e) =>
                updateFieldConfig({
                  max_items: parseInt(e.target.value) || 10,
                })
              }
              className={inputClass}
              placeholder="10"
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>{t("itemsPerPage")}</label>
        <input
          type="number"
          min="1"
          value={fieldConfig?.max_items_per_page || ""}
          onChange={(e) =>
            updateFieldConfig({
              max_items_per_page: e.target.value
                ? parseInt(e.target.value)
                : undefined,
            })
          }
          className={inputClass}
          placeholder={t("itemsPerPagePlaceholder")}
        />
        <p className={helpTextClass}>{t("itemsPerPageHelp")}</p>
      </div>

      {/* Configuración de importación CSV */}
      {isFormMode && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allow_csv_import"
            checked={fieldConfig?.allow_csv_import || false}
            onChange={(e) =>
              updateFieldConfig({
                allow_csv_import: e.target.checked,
              })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="allow_csv_import" className={labelClass}>
            {t("allowCsvImport")}
          </label>
        </div>
      )}

      {/* Configuración del esquema de elementos */}
      <div>
        <h4 className="text-md font-medium text-[#283618] mb-3">
          {t("schemaTitle")}
        </h4>

        <div className={`${cardClass} border`}>
          <div className="flex items-center justify-between mb-4 space-x-2">
            <p className="text-sm text-gray-700">{t("schemaDescription")}</p>
            <button
              type="button"
              onClick={() => {
                const currentSchema = fieldConfig?.item_schema || {};
                const newFieldId = `field_${Date.now()}`;
                const newField = {
                  type: "text",
                  label: t("newField"),
                  form: isFormMode,
                  bulletin: true,
                  validation: {},
                };
                updateFieldConfig({
                  item_schema: {
                    ...currentSchema,
                    [newFieldId]: newField,
                  },
                });
              }}
              className={`${btnOutlineSecondary} text-sm px-2 py-2`}
            >
              <Plus className="w-4 h-4" />
              {t("addField")}
            </button>
          </div>

          {/* Lista de campos del esquema */}
          <div className="space-y-3">
            {Object.entries(fieldConfig?.item_schema || {}).map(
              ([fieldId, fieldDef]) => (
                <ItemSchemaField
                  key={fieldId}
                  fieldId={fieldId}
                  fieldDef={fieldDef}
                  onUpdate={(updatedField) => {
                    const currentSchema = fieldConfig?.item_schema || {};
                    updateFieldConfig({
                      item_schema: {
                        ...currentSchema,
                        [fieldId]: updatedField,
                      },
                    });
                  }}
                  onDelete={() => {
                    const currentSchema = fieldConfig?.item_schema || {};
                    const { [fieldId]: deleted, ...newSchema } = currentSchema;
                    updateFieldConfig({
                      item_schema: newSchema,
                    });
                  }}
                />
              )
            )}

            {Object.keys(fieldConfig?.item_schema || {}).length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                {t("noFieldsMessage")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Datos de items (solo cuando form = false) */}
      {!isFormMode && (
        <div>
          <h4 className="text-md font-medium text-[#283618] mb-3">
            {t("itemsTitle")}
          </h4>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4 space-x-2">
              <p className="text-sm text-gray-700">{t("itemsDescription")}</p>
              <button
                type="button"
                onClick={() => {
                  const currentItems = Array.isArray(currentField.value)
                    ? currentField.value
                    : [];
                  const itemSchema = fieldConfig?.item_schema || {};

                  // Crear un nuevo item con valores vacíos basado en el schema
                  const newItem: any = {};
                  Object.keys(itemSchema).forEach((fieldId) => {
                    newItem[fieldId] = "";
                  });

                  updateField({
                    value: [...currentItems, newItem],
                  });
                }}
                className={`${btnOutlineSecondary} text-sm px-2 py-2`}
                disabled={!Object.keys(fieldConfig?.item_schema || {}).length}
              >
                <Plus className="w-4 h-4" />
                {t("addItem")}
              </button>
            </div>

            {/* Lista de items */}
            <div className="space-y-4">
              {Array.isArray(currentField.value) &&
              currentField.value.length > 0 ? (
                currentField.value.map((item: any, itemIndex: number) => (
                  <div
                    key={itemIndex}
                    className="border rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-[#283618]">
                        {t("itemNumber")} {itemIndex + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          const currentItems = (
                            Array.isArray(currentField.value)
                              ? currentField.value
                              : []
                          ) as Record<string, any>[];
                          const newItems = currentItems.filter(
                            (_, idx) => idx !== itemIndex
                          );
                          updateField({
                            value: newItems,
                          });
                        }}
                        className={btnDangerIconClass}
                        title={t("deleteItem")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Campos del item según el schema */}
                    <div className="space-y-3">
                      {Object.entries(fieldConfig?.item_schema || {}).map(
                        ([fieldId, fieldDef]: [string, any]) => (
                          <div key={fieldId}>
                            <label className={labelXsClass}>
                              {fieldDef.label || fieldId}
                            </label>
                            <ItemFieldInput
                              fieldId={fieldId}
                              fieldDef={fieldDef}
                              value={item[fieldId]}
                              onChange={(newValue) => {
                                const currentItems = (
                                  Array.isArray(currentField.value)
                                    ? currentField.value
                                    : []
                                ) as Record<string, any>[];
                                const newItems = [...currentItems];
                                const currentItem = newItems[itemIndex] || {};
                                newItems[itemIndex] = {
                                  ...(typeof currentItem === "object"
                                    ? currentItem
                                    : {}),
                                  [fieldId]: newValue,
                                };
                                updateField({
                                  value: newItems,
                                });
                              }}
                              onFieldDefChange={(updatedFieldDef) => {
                                // Actualizar el fieldDef en el schema
                                const currentSchema =
                                  fieldConfig?.item_schema || {};
                                updateFieldConfig({
                                  item_schema: {
                                    ...currentSchema,
                                    [fieldId]: updatedFieldDef,
                                  },
                                });
                              }}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {Object.keys(fieldConfig?.item_schema || {}).length === 0
                    ? t("defineSchemaFirst")
                    : t("noItemsMessage")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
