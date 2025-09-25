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
    <div className="border border-gray-300 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? "▼" : "▶"}
          </button>
          <div className="flex-1">
            <span className="font-medium text-sm text-gray-800">
              {fieldDef.label || fieldId}
            </span>
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {fieldDef.type || "text"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowFieldEditor(true)}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Configurar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 mt-3 pl-6 border-l-2 border-gray-200 text-xs text-gray-600">
          <div>
            <strong>Tipo:</strong> {fieldDef.type || "text"}
          </div>
          <div>
            <strong>Etiqueta:</strong> {fieldDef.label || "Sin etiqueta"}
          </div>
          <div>
            <strong>Descripción:</strong>{" "}
            {fieldDef.description || "Sin descripción"}
          </div>
          <div className="flex space-x-4">
            <span>Formulario: {fieldDef.form ? "✓" : "✗"}</span>
            <span>Boletín: {fieldDef.bulletin ? "✓" : "✗"}</span>
          </div>
        </div>
      )}

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

  return (
    <div className="space-y-4">
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
          <div className="flex items-center justify-between mb-4">
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
                  form: true,
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
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Agregar Campo
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
    </div>
  );
};
