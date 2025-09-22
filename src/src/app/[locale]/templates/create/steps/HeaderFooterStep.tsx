"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Settings } from "lucide-react";
import {
  CreateTemplateData,
  HeaderFooterConfig,
  Field,
  FIELD_TYPES,
} from "../../../../../types/template";
import { FieldEditor } from "../components/FieldEditor";

interface HeaderFooterStepProps {
  data: CreateTemplateData;
  errors: Record<string, string[]>;
  onDataChange: (
    updater: (prevData: CreateTemplateData) => CreateTemplateData
  ) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

type ConfigType = "header" | "footer";

export function HeaderFooterStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: HeaderFooterStepProps) {
  const t = useTranslations("CreateTemplate.headerFooter");
  const [activeConfig, setActiveConfig] = useState<ConfigType>("header");
  const [editingField, setEditingField] = useState<{
    type: ConfigType;
    index: number;
  } | null>(null);

  const updateHeaderFooterConfig = useCallback(
    (type: ConfigType, updates: Partial<HeaderFooterConfig>) => {
      onDataChange((prevData) => ({
        ...prevData,
        version: {
          ...prevData.version,
          content: {
            ...prevData.version.content,
            [`${type}_config`]: {
              ...prevData.version.content[
                `${type}_config` as keyof typeof prevData.version.content
              ],
              ...updates,
            },
          },
        },
      }));
    },
    [onDataChange]
  );

  const addField = useCallback(
    (type: ConfigType) => {
      const newField: Field = {
        field_id: `${type}_field_${Date.now()}`,
        display_name: "Nuevo Campo",
        type: "text",
        form: true,
        bulletin: true,
        field_config: { subtype: "short" },
      };

      const currentConfig = (data.version.content[
        `${type}_config` as keyof typeof data.version.content
      ] as HeaderFooterConfig) || { fields: [] };

      updateHeaderFooterConfig(type, {
        fields: [...(currentConfig.fields || []), newField],
      });
    },
    [data.version.content, updateHeaderFooterConfig]
  );

  const removeField = useCallback(
    (type: ConfigType, fieldIndex: number) => {
      const currentConfig = (data.version.content[
        `${type}_config` as keyof typeof data.version.content
      ] as HeaderFooterConfig) || { fields: [] };
      const updatedFields =
        currentConfig.fields?.filter((_, index) => index !== fieldIndex) || [];

      updateHeaderFooterConfig(type, {
        fields: updatedFields,
      });
    },
    [data.version.content, updateHeaderFooterConfig]
  );

  const updateField = useCallback(
    (type: ConfigType, fieldIndex: number, updatedField: Field) => {
      const currentConfig = (data.version.content[
        `${type}_config` as keyof typeof data.version.content
      ] as HeaderFooterConfig) || { fields: [] };
      const updatedFields = [...(currentConfig.fields || [])];
      updatedFields[fieldIndex] = updatedField;

      updateHeaderFooterConfig(type, {
        fields: updatedFields,
      });
    },
    [data.version.content, updateHeaderFooterConfig]
  );

  const currentConfig = data.version.content[
    `${activeConfig}_config` as keyof typeof data.version.content
  ] as HeaderFooterConfig;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("title")}
        </h2>
        <p className="text-gray-600">{t("description")}</p>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveConfig("header")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeConfig === "header"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t("tabs.header")}
          </button>
          <button
            onClick={() => setActiveConfig("footer")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeConfig === "footer"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t("tabs.footer")}
          </button>
        </nav>
      </div>

      {/* Configuración activa */}
      <div className="space-y-4">
        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            {activeConfig === "header"
              ? t("info.header.title")
              : t("info.footer.title")}
          </h3>
          <p className="text-sm text-blue-800">
            {activeConfig === "header"
              ? t("info.header.description")
              : t("info.footer.description")}
          </p>
        </div>

        {/* Botón agregar campo */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {t("fields.title")}
          </h3>
          <button
            onClick={() => addField(activeConfig)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 
                     font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("fields.add")}
          </button>
        </div>

        {/* Lista de campos */}
        <div className="space-y-3">
          {currentConfig?.fields?.length === 0 || !currentConfig?.fields ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t("fields.empty")}</p>
              <p className="text-sm mt-1">{t("fields.emptyHint")}</p>
            </div>
          ) : (
            currentConfig.fields.map((field, index) => (
              <div
                key={`${field.field_id}-${index}`}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {field.display_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t("fields.type")}: {field.type}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setEditingField({ type: activeConfig, index })
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeField(activeConfig, index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                  <div>
                    {t("fields.form")}:
                    <span
                      className={
                        field.form ? "text-green-600" : "text-gray-500"
                      }
                    >
                      {field.form ? " Sí" : " No"}
                    </span>
                  </div>
                  <div>
                    {t("fields.bulletin")}:
                    <span
                      className={
                        field.bulletin ? "text-green-600" : "text-gray-500"
                      }
                    >
                      {field.bulletin ? " Sí" : " No"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de edición de campo */}
      {editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("editField.title")}
              </h3>
              <button
                onClick={() => setEditingField(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <FieldEditor
              field={currentConfig.fields![editingField.index]}
              onFieldChange={(updatedField: Field) =>
                updateField(editingField.type, editingField.index, updatedField)
              }
              onClose={() => setEditingField(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
