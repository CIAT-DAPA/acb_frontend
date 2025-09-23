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
import { StyleConfig } from "../../../../../types/core";
import { FieldEditor } from "../components/FieldEditor";
import {
  inheritStylesFromContainer,
  propagateContainerStyleChanges,
} from "../../../../../utils/styleInheritance";

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

  const updateHeaderFooterStyle = useCallback(
    (type: ConfigType, styleUpdates: Partial<StyleConfig>) => {
      const currentConfig = (data.version.content[
        `${type}_config` as keyof typeof data.version.content
      ] as HeaderFooterConfig) || { fields: [] };

      const updatedStyleConfig = {
        ...(currentConfig.style_config || {}),
        ...styleUpdates,
      };

      // Propagar cambios de estilos a campos no editados manualmente
      const updatedFields = propagateContainerStyleChanges(
        currentConfig.fields || [],
        updatedStyleConfig
      );

      updateHeaderFooterConfig(type, {
        style_config: updatedStyleConfig,
        fields: updatedFields,
      });
    },
    [data.version.content, updateHeaderFooterConfig]
  );

  const addField = useCallback(
    (type: ConfigType) => {
      const currentConfig = (data.version.content[
        `${type}_config` as keyof typeof data.version.content
      ] as HeaderFooterConfig) || { fields: [] };

      const newField: Field = {
        field_id: `${type}_field_${Date.now()}`,
        display_name: "Nuevo Campo",
        type: "text",
        form: true,
        bulletin: true,
        field_config: { subtype: "short" },
        style_manually_edited: false, // Inicialmente no editado manualmente
      };

      // Aplicar herencia automática de estilos del contenedor
      const fieldWithInheritedStyles = inheritStylesFromContainer(
        newField,
        currentConfig.style_config
      );

      updateHeaderFooterConfig(type, {
        fields: [...(currentConfig.fields || []), fieldWithInheritedStyles],
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

  const currentConfig = (data.version.content[
    `${activeConfig}_config` as keyof typeof data.version.content
  ] as HeaderFooterConfig) || { fields: [] };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#283618]">{t("description")}</p>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveConfig("header")}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeConfig === "header"
                ? "border-[#bc6c25] text-[#bc6c25]"
                : "border-transparent text-[#283618]/50 hover:text-[#283618] hover:border-[#bc6c25]"
            }`}
          >
            {t("tabs.header")}
          </button>
          <button
            onClick={() => setActiveConfig("footer")}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeConfig === "footer"
                ? "border-[#bc6c25] text-[#bc6c25]"
                : "border-transparent text-[#283618]/50 hover:text-[#283618] hover:border-[#bc6c25]"
            }`}
          >
            {t("tabs.footer")}
          </button>
        </nav>
      </div>

      {/* Configuración activa */}
      <div className="space-y-4">
        {/* Información */}
        <div className="bg-orange-50 border border-[#bc6c25] rounded-lg p-4">
          <h3 className="font-medium text-[#283618] mb-2">
            {activeConfig === "header"
              ? t("info.header.title")
              : t("info.footer.title")}
          </h3>
          <p className="text-sm text-[#283618]">
            {activeConfig === "header"
              ? t("info.header.description")
              : t("info.footer.description")}
          </p>
        </div>

        {/* Estilos Globales del Header/Footer */}
        <div className="bg-green-50 border border-[#283618] rounded-lg p-4">
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("globalStyles.title")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.color")}
              </label>
              <input
                type="color"
                value={currentConfig.style_config?.primary_color || "#000000"}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    primary_color: e.target.value,
                  })
                }
                className="block w-16 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.backgroundColor")}
              </label>
              <input
                type="color"
                value={
                  currentConfig.style_config?.background_color || "#ffffff"
                }
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    background_color: e.target.value,
                  })
                }
                className="block w-16 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.fontSize")}
              </label>
              <input
                type="number"
                min="8"
                max="72"
                value={currentConfig.style_config?.font_size || ""}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    font_size: parseInt(e.target.value) || undefined,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                placeholder="16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.textAlign")}
              </label>
              <select
                value={currentConfig.style_config?.text_align || "left"}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    text_align: e.target.value as "left" | "center" | "right",
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#bc6c25] focus:border-[#bc6c25]"
              >
                <option value="left">
                  {t("globalStyles.alignOptions.left")}
                </option>
                <option value="center">
                  {t("globalStyles.alignOptions.center")}
                </option>
                <option value="right">
                  {t("globalStyles.alignOptions.right")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.borderColor")}
              </label>
              <input
                type="color"
                value={currentConfig.style_config?.border_color || "#000000"}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    border_color: e.target.value,
                  })
                }
                className="block w-16 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.borderWidth")}
              </label>
              <input
                type="text"
                value={currentConfig.style_config?.border_width || ""}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    border_width: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="1px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.borderRadius")}
              </label>
              <input
                type="text"
                value={currentConfig.style_config?.border_radius || ""}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    border_radius: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="0px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.padding")}
              </label>
              <input
                type="text"
                value={currentConfig.style_config?.padding || ""}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    padding: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="16px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.margin")}
              </label>
              <input
                type="text"
                value={currentConfig.style_config?.margin || ""}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    margin: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="0px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("globalStyles.gap")}
              </label>
              <input
                type="text"
                value={currentConfig.style_config?.gap || ""}
                onChange={(e) =>
                  updateHeaderFooterStyle(activeConfig, {
                    gap: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="8px"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-[#283618]">
            {t("globalStyles.help")}
          </p>
        </div>

        {/* Configuración de Layout */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("layout.title")}
          </h3>

          <div>
            <label className="block text-sm font-medium text-[#283618] mb-2">
              {t("layout.fieldsLayout.label")}
            </label>
            <select
              value={currentConfig.style_config?.fields_layout || "horizontal"}
              onChange={(e) =>
                updateHeaderFooterStyle(activeConfig, {
                  fields_layout: e.target.value as "horizontal" | "vertical",
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="horizontal">
                {t("layout.fieldsLayout.options.horizontal")}
              </option>
              <option value="vertical">
                {t("layout.fieldsLayout.options.vertical")}
              </option>
            </select>
            <p className="mt-2 text-xs text-[#283618]/50">
              {t("layout.fieldsLayout.help")}
            </p>
          </div>
        </div>

        {/* Botón agregar campo */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-[#283618]">
            {t("fields.title")}
          </h3>
          <button
            onClick={() => addField(activeConfig)}
            className="inline-flex items-center px-3 py-2 border-2 border-[#bc6c25] text-sm leading-4 
                     font-medium rounded-md text-[#283618] hover:border-[#bc6c25]/50 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bc6c25] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("fields.add")}
          </button>
        </div>

        {/* Lista de campos */}
        <div className="space-y-3">
          {currentConfig?.fields?.length === 0 || !currentConfig?.fields ? (
            <div className="text-center py-8 text-[#283618]/70">
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
                    <h4 className="font-medium text-[#283618]">
                      {field.display_name}
                    </h4>
                    <p className="text-sm text-[#283618]/50">
                      {t("fields.type")}: {field.type}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setEditingField({ type: activeConfig, index })
                      }
                      className="text-[#283618]/50 hover:text-[#283618] cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeField(activeConfig, index)}
                      className="text-[#283618]/50 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-[#283618] grid grid-cols-2 gap-2">
                  <div>
                    {t("fields.form")}:
                    <span
                      className={
                        field.form ? "text-green-600" : "text-[#283618]/50"
                      }
                    >
                      {field.form ? " Sí" : " No"}
                    </span>
                  </div>
                  <div>
                    {t("fields.bulletin")}:
                    <span
                      className={
                        field.bulletin ? "text-green-600" : "text-[#283618]/50"
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
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#283618]">
                {t("editField.title")}
              </h3>
              <button
                onClick={() => setEditingField(null)}
                className="text-[#283618]/60 hover:text-[#283618]"
              >
                ×
              </button>
            </div>

            <FieldEditor
              field={currentConfig.fields![editingField.index]}
              containerStyle={currentConfig.style_config}
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
