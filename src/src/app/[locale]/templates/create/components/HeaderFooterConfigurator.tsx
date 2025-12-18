"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Settings, GripVertical } from "lucide-react";
import { HeaderFooterConfig, Field } from "../../../../../types/template";
import { StyleConfig } from "../../../../../types/core";
import { FieldEditor } from "./FieldEditor";
import {
  inheritStylesFromContainer,
  propagateContainerStyleChanges,
} from "../../../../../utils/styleInheritance";
import { StyleConfigurator } from "./StyleConfigurator";

interface HeaderFooterConfiguratorProps {
  config: HeaderFooterConfig;
  configType: "header" | "footer";
  onConfigChange: (updates: Partial<HeaderFooterConfig>) => void;
  showTitle?: boolean;
  title?: string;
  description?: string;
}

export function HeaderFooterConfigurator({
  config,
  configType,
  onConfigChange,
  showTitle = true,
  title,
  description,
}: HeaderFooterConfiguratorProps) {
  const t = useTranslations("CreateTemplate.headerFooter");
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null
  );
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Manejar tecla Escape para cerrar el modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && editingFieldIndex !== null) {
        setEditingFieldIndex(null);
      }
    };

    if (editingFieldIndex !== null) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [editingFieldIndex]);

  const updateStyle = useCallback(
    (styleUpdates: Partial<StyleConfig>) => {
      const updatedStyleConfig = {
        ...(config.style_config || {}),
        ...styleUpdates,
      };

      // Propagar cambios de estilos a campos no editados manualmente
      const updatedFields = propagateContainerStyleChanges(
        config.fields || [],
        updatedStyleConfig
      );

      onConfigChange({
        style_config: updatedStyleConfig,
        fields: updatedFields,
      });
    },
    [config, onConfigChange]
  );

  const addField = useCallback(() => {
    const newField: Field = {
      field_id: `${configType}_field_${Date.now()}`,
      display_name: "Nuevo Campo",
      type: "text",
      form: true,
      bulletin: true,
      field_config: { subtype: "short" },
      style_manually_edited: false,
    };

    // Aplicar herencia automática de estilos del contenedor
    const fieldWithInheritedStyles = inheritStylesFromContainer(
      newField,
      config.style_config
    );

    onConfigChange({
      fields: [...(config.fields || []), fieldWithInheritedStyles],
    });
  }, [config, configType, onConfigChange]);

  const removeField = useCallback(
    (fieldIndex: number) => {
      const updatedFields =
        config.fields?.filter((_, index) => index !== fieldIndex) || [];
      onConfigChange({ fields: updatedFields });
    },
    [config.fields, onConfigChange]
  );

  const updateField = useCallback(
    (fieldIndex: number, updatedField: Field) => {
      const updatedFields = [...(config.fields || [])];
      updatedFields[fieldIndex] = updatedField;
      onConfigChange({ fields: updatedFields });
    },
    [config.fields, onConfigChange]
  );

  const reorderFields = useCallback(
    (fromIndex: number, toIndex: number) => {
      const updatedFields = [...(config.fields || [])];
      const [movedField] = updatedFields.splice(fromIndex, 1);
      updatedFields.splice(toIndex, 0, movedField);
      onConfigChange({ fields: updatedFields });
    },
    [config.fields, onConfigChange]
  );

  // Handlers para drag & drop
  const handleDragStart = useCallback((index: number) => {
    setDraggedItem(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();

      if (draggedItem !== null && draggedItem !== targetIndex) {
        reorderFields(draggedItem, targetIndex);
      }

      setDraggedItem(null);
    },
    [draggedItem, reorderFields]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-4">
      {/* Título y descripción */}
      {showTitle && (
        <div className="bg-orange-50 border border-[#bc6c25] rounded-lg p-4">
          <h3 className="font-medium text-[#283618] mb-2">
            {title ||
              (configType === "header"
                ? t("info.header.title")
                : t("info.footer.title"))}
          </h3>
          <p className="text-sm text-[#283618]">
            {description ||
              (configType === "header"
                ? t("info.header.description")
                : t("info.footer.description"))}
          </p>
        </div>
      )}

      {/* Estilos Globales del Header/Footer */}
      <div className="bg-green-50 border border-[#283618] rounded-lg p-4">
        <StyleConfigurator
          styleConfig={config.style_config || {}}
          onStyleChange={updateStyle}
          enabledFields={{
            primaryColor: true,
            backgroundColor: true,
            backgroundImage: true,
            fontSize: true,
            textAlign: true,
            borderColor: true,
            borderWidth: true,
            borderRadius: true,
            borderSides: true,
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
          styleConfig={config.style_config || {}}
          onStyleChange={updateStyle}
          enabledFields={{
            fieldsLayout: true,
            justifyContent: true,
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
          onClick={addField}
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
          draggedItem !== null
            ? "bg-blue-50/30 p-2 rounded-lg border border-blue-200"
            : ""
        }`}
      >
        {!config.fields || config.fields.length === 0 ? (
          <div
            className={`text-center py-8 text-[#283618]/70 border-2 border-dashed rounded-lg transition-all duration-200 ${
              draggedItem !== null
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={(e) => handleDrop(e, 0)}
          >
            <p>{t("fields.empty")}</p>
            <p className="text-sm mt-1">{t("fields.emptyHint")}</p>
            {draggedItem !== null && (
              <p className="text-sm mt-2 text-blue-600">
                🎯 Suelta aquí para mover el campo
              </p>
            )}
          </div>
        ) : (
          config.fields.map((field, index) => (
            <div
              key={`${field.field_id}-${index}`}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                draggedItem === index
                  ? "opacity-50 scale-95 shadow-lg border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-gray-50 hover:shadow-md hover:border-gray-300"
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={(e) => handleDrop(e, index)}
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
                    onClick={() => setEditingFieldIndex(index)}
                    className="text-[#283618]/50 hover:text-[#283618] cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeField(index)}
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

      {/* Modal de edición de campo */}
      {editingFieldIndex !== null && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
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
                onClick={() => setEditingFieldIndex(null)}
                className="text-[#283618]/60 hover:text-[#283618]"
              >
                ×
              </button>
            </div>

            <FieldEditor
              field={config.fields![editingFieldIndex]}
              containerStyle={config.style_config}
              onFieldChange={(updatedField: Field) =>
                updateField(editingFieldIndex, updatedField)
              }
              onClose={() => setEditingFieldIndex(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
