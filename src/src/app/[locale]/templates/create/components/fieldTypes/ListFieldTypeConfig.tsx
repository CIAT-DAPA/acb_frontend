"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ListFieldConfig, Field } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { FieldEditor } from "../FieldEditor";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";
import { Plus, Settings, Trash2, GripVertical } from "lucide-react";
import { VisualResourceSelector } from "../VisualResourceSelector";

// Constantes CSS reutilizables
const INPUT_CLASS =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm";
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
const LABEL_SM_CLASS = "block text-sm font-medium text-[#283618]/70 mb-1";
const HELP_TEXT_CLASS = "mt-1 text-xs text-[#283618]/50";
const CARD_CLASS = "border rounded-lg p-4 bg-gray-50";
const BUTTON_ICON_CLASS =
  "text-[#283618]/50 hover:text-[#283618] cursor-pointer";
const BUTTON_DANGER_ICON_CLASS =
  "text-[#283618]/50 hover:text-red-600 cursor-pointer";

// Componente para renderizar el input apropiado según el tipo de campo
interface ItemFieldInputProps {
  fieldId: string;
  fieldDef: any;
  value: any;
  onChange: (value: any) => void;
}

const ItemFieldInput: React.FC<ItemFieldInputProps> = ({
  fieldId,
  fieldDef,
  value,
  onChange,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.listConfig");
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Para campos de tipo image, usar el VisualResourceSelector
  if (fieldDef.type === "image") {
    return (
      <>
        <div className="flex items-center space-x-2">
          {value ? (
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                <img
                  src={value}
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
        <VisualResourceSelector
          isOpen={showImageSelector}
          onClose={() => setShowImageSelector(false)}
          onSelect={(url) => {
            onChange(url);
            setShowImageSelector(false);
          }}
          title={`${t("selectTitle")} ${fieldDef.label || fieldId}`}
          resourceType="image"
          selectedUrl={value}
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
      className={INPUT_CLASS}
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
            className={BUTTON_ICON_CLASS}
            title={t("configureField")}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={BUTTON_DANGER_ICON_CLASS}
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
            <label className={LABEL_CLASS}>{t("minItems")}</label>
            <input
              type="number"
              min="0"
              value={fieldConfig?.min_items || 0}
              onChange={(e) =>
                updateFieldConfig({
                  min_items: parseInt(e.target.value) || 0,
                })
              }
              className={INPUT_CLASS}
              placeholder="0"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t("maxItems")}</label>
            <input
              type="number"
              min="1"
              value={fieldConfig?.max_items || 10}
              onChange={(e) =>
                updateFieldConfig({
                  max_items: parseInt(e.target.value) || 10,
                })
              }
              className={INPUT_CLASS}
              placeholder="10"
            />
          </div>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>{t("itemsPerPage")}</label>
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
          className={INPUT_CLASS}
          placeholder={t("itemsPerPagePlaceholder")}
        />
        <p className={HELP_TEXT_CLASS}>{t("itemsPerPageHelp")}</p>
      </div>

      {/* Configuración del esquema de elementos */}
      <div>
        <h4 className="text-md font-medium text-[#283618] mb-3">
          {t("schemaTitle")}
        </h4>

        <div className={`${CARD_CLASS} border`}>
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
                        className={BUTTON_DANGER_ICON_CLASS}
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
                            <label className={LABEL_SM_CLASS}>
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
