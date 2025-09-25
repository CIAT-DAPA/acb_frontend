"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Settings, GripVertical } from "lucide-react";
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
import { StyleConfigurator } from "../components/StyleConfigurator";

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

  const [draggedItem, setDraggedItem] = useState<{
    type: ConfigType;
    index: number;
  } | null>(null);

  // Manejar tecla Escape para cerrar el modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && editingField) {
        setEditingField(null);
      }
    };

    if (editingField) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [editingField]);

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

  const reorderFields = useCallback(
    (type: ConfigType, fromIndex: number, toIndex: number) => {
      const currentConfig = (data.version.content[
        `${type}_config` as keyof typeof data.version.content
      ] as HeaderFooterConfig) || { fields: [] };

      const updatedFields = [...(currentConfig.fields || [])];
      const [movedField] = updatedFields.splice(fromIndex, 1);
      updatedFields.splice(toIndex, 0, movedField);

      updateHeaderFooterConfig(type, {
        fields: updatedFields,
      });
    },
    [data.version.content, updateHeaderFooterConfig]
  );

  // Handlers para drag & drop
  const handleDragStart = useCallback((type: ConfigType, index: number) => {
    setDraggedItem({ type, index });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetType: ConfigType, targetIndex: number) => {
      e.preventDefault();

      if (!draggedItem) return;

      // Solo permitir reordenar dentro del mismo tipo (header o footer)
      if (
        draggedItem.type === targetType &&
        draggedItem.index !== targetIndex
      ) {
        reorderFields(targetType, draggedItem.index, targetIndex);
      }

      setDraggedItem(null);
    },
    [draggedItem, reorderFields]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

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
          <StyleConfigurator
            styleConfig={currentConfig.style_config || {}}
            onStyleChange={(updates: Partial<StyleConfig>) =>
              updateHeaderFooterStyle(activeConfig, updates)
            }
            enabledFields={{
              primaryColor: true,
              backgroundColor: true,
              fontSize: true,
              textAlign: true,
              borderColor: true,
              borderWidth: true,
              borderRadius: true,
              padding: true,
              margin: true,
              gap: true,
            }}
            title={t("globalStyles.title")}
            description={t("globalStyles.help")}
            showPreview={false}
            isFieldStyle={false}
          />
        </div>

        {/* Configuración de Layout */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <StyleConfigurator
            styleConfig={currentConfig.style_config || {}}
            onStyleChange={(updates: Partial<StyleConfig>) =>
              updateHeaderFooterStyle(activeConfig, updates)
            }
            enabledFields={{
              fieldsLayout: true,
            }}
            title={t("layout.title")}
            description={t("layout.fieldsLayout.help")}
            showPreview={false}
            isFieldStyle={false}
          />
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
        <div
          className={`space-y-3 ${
            draggedItem?.type === activeConfig
              ? "bg-blue-50/30 p-2 rounded-lg border border-blue-200"
              : ""
          }`}
        >
          {currentConfig?.fields?.length === 0 || !currentConfig?.fields ? (
            <div
              className={`text-center py-8 text-[#283618]/70 border-2 border-dashed rounded-lg transition-all duration-200 ${
                draggedItem?.type === activeConfig
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={(e) => handleDrop(e, activeConfig, 0)}
            >
              <p>{t("fields.empty")}</p>
              <p className="text-sm mt-1">{t("fields.emptyHint")}</p>
              {draggedItem?.type === activeConfig && (
                <p className="text-sm mt-2 text-blue-600">
                  🎯 Suelta aquí para mover el campo
                </p>
              )}
            </div>
          ) : (
            currentConfig.fields.map((field, index) => (
              <div
                key={`${field.field_id}-${index}`}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  draggedItem?.type === activeConfig &&
                  draggedItem?.index === index
                    ? "opacity-50 scale-95 shadow-lg border-blue-300 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:shadow-md hover:border-gray-300"
                }`}
                draggable
                onDragStart={() => handleDragStart(activeConfig, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={(e) => handleDrop(e, activeConfig, index)}
              >
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
                        {field.display_name}
                      </h4>
                      <p className="text-sm text-[#283618]/50">
                        {t("fields.type")}: {field.type}
                      </p>
                    </div>
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
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setEditingField(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
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
