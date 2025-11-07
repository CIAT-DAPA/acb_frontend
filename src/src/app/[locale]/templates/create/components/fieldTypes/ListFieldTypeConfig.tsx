"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ListFieldConfig,
  Field,
  FIELD_TYPES,
} from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { FieldEditor } from "../FieldEditor";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";
import { Plus, Settings, Trash2, GripVertical } from "lucide-react";
import { VisualResourceSelector } from "../VisualResourceSelector";

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
                Cambiar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowImageSelector(true)}
              className={`${btnOutlineSecondary} w-full`}
            >
              Seleccionar Imagen
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
          title={`Seleccionar ${fieldDef.label || fieldId}`}
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
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
      placeholder={`Ingresa ${fieldDef.label || fieldId}`}
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
            title="Arrastra para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-[#283618]">
              {fieldDef.label || fieldId}
            </h4>
            <p className="text-sm text-[#283618]/50">
              Tipo: {fieldDef.type || "text"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowFieldEditor(true)}
            className="text-[#283618]/50 hover:text-[#283618] cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[#283618]/50 hover:text-red-600 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-[#283618] grid grid-cols-2 gap-2">
        <div>
          Form:
          <span
            className={fieldDef.form ? "text-green-600" : "text-[#283618]/50"}
          >
            {fieldDef.form ? " Sí" : " No"}
          </span>
        </div>
        <div>
          Bulletin:
          <span
            className={
              fieldDef.bulletin ? "text-green-600" : "text-[#283618]/50"
            }
          >
            {fieldDef.bulletin ? " Sí" : " No"}
          </span>
        </div>
      </div>

      {/* Modal del FieldEditor */}
      {showFieldEditor && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Configurar Campo: {fieldDef.label || fieldId}
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
  const t = useTranslations("CreateTemplate.fieldEditor");
  const isFormMode = currentField.form !== false;

  return (
    <div className="space-y-4">
      {/* Solo mostrar límites en modo formulario */}
      {isFormMode && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              Elementos mínimos
            </label>
            <input
              type="number"
              min="0"
              value={
                (currentField.field_config as ListFieldConfig)?.min_items || 0
              }
              onChange={(e) =>
                updateFieldConfig({
                  min_items: parseInt(e.target.value) || 0,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              Elementos máximos
            </label>
            <input
              type="number"
              min="1"
              value={
                (currentField.field_config as ListFieldConfig)?.max_items || 10
              }
              onChange={(e) =>
                updateFieldConfig({
                  max_items: parseInt(e.target.value) || 10,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="10"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#283618]/70 mb-2">
          Elementos por página (opcional)
        </label>
        <input
          type="number"
          min="1"
          value={
            (currentField.field_config as ListFieldConfig)
              ?.max_items_per_page || ""
          }
          onChange={(e) =>
            updateFieldConfig({
              max_items_per_page: e.target.value
                ? parseInt(e.target.value)
                : undefined,
            })
          }
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Dejar vacío para mostrar todos"
        />
        <p className="mt-1 text-xs text-[#283618]/50">
          Si se especifica, la lista se dividirá en páginas con este número de
          elementos
        </p>
      </div>

      {/* Configuración del esquema de elementos */}
      <div>
        <h4 className="text-md font-medium text-[#283618] mb-3">
          Esquema de Elementos de la Lista
        </h4>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 space-x-2">
            <p className="text-sm text-gray-700">
              Define los campos que tendrá cada elemento de la lista
            </p>
            <button
              type="button"
              onClick={() => {
                const currentSchema =
                  (currentField.field_config as ListFieldConfig)?.item_schema ||
                  {};
                const newFieldId = `field_${Date.now()}`;
                const newField = {
                  type: "text",
                  label: "Nuevo Campo",
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
              Agregar Campo
            </button>
          </div>

          {/* Lista de campos del esquema */}
          <div className="space-y-3">
            {Object.entries(
              (currentField.field_config as ListFieldConfig)?.item_schema || {}
            ).map(([fieldId, fieldDef]) => (
              <ItemSchemaField
                key={fieldId}
                fieldId={fieldId}
                fieldDef={fieldDef}
                onUpdate={(updatedField) => {
                  const currentSchema =
                    (currentField.field_config as ListFieldConfig)
                      ?.item_schema || {};
                  updateFieldConfig({
                    item_schema: {
                      ...currentSchema,
                      [fieldId]: updatedField,
                    },
                  });
                }}
                onDelete={() => {
                  const currentSchema =
                    (currentField.field_config as ListFieldConfig)
                      ?.item_schema || {};
                  const { [fieldId]: deleted, ...newSchema } = currentSchema;
                  updateFieldConfig({
                    item_schema: newSchema,
                  });
                }}
              />
            ))}

            {Object.keys(
              (currentField.field_config as ListFieldConfig)?.item_schema || {}
            ).length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No hay campos definidos. Haz clic en "Agregar Campo" para
                comenzar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Datos de items (solo cuando form = false) */}
      {!isFormMode && (
        <div>
          <h4 className="text-md font-medium text-[#283618] mb-3">
            Items de la Lista (Static Items Section)
          </h4>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4 space-x-2">
              <p className="text-sm text-gray-700">
                Define los items que se mostrarán en el boletín
              </p>
              <button
                type="button"
                onClick={() => {
                  const currentItems = Array.isArray(currentField.value)
                    ? currentField.value
                    : [];
                  const itemSchema =
                    (currentField.field_config as ListFieldConfig)
                      ?.item_schema || {};

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
                disabled={
                  !Object.keys(
                    (currentField.field_config as ListFieldConfig)
                      ?.item_schema || {}
                  ).length
                }
              >
                <Plus className="w-4 h-4" />
                Agregar Item
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
                        Item {itemIndex + 1}
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
                        className="text-[#283618]/50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Campos del item según el schema */}
                    <div className="space-y-3">
                      {Object.entries(
                        (currentField.field_config as ListFieldConfig)
                          ?.item_schema || {}
                      ).map(([fieldId, fieldDef]: [string, any]) => (
                        <div key={fieldId}>
                          <label className="block text-sm font-medium text-[#283618]/70 mb-1">
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
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {Object.keys(
                    (currentField.field_config as ListFieldConfig)
                      ?.item_schema || {}
                  ).length === 0
                    ? "Primero define el esquema de elementos arriba"
                    : 'No hay items. Haz clic en "Agregar Item" para comenzar.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
