"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Field,
  FIELD_TYPES,
  TextWithIconFieldConfig,
  DateRangeFieldConfig,
  PageNumberFieldConfig,
} from "../../../../../types/template";
import { ValidationRules, StyleConfig } from "../../../../../types/core";
import {
  getEffectiveFieldStyles,
  markFieldStyleAsManuallyEdited,
  resetFieldStyleInheritance,
  getInheritableStyles,
  inheritStylesFromContainer,
} from "../../../../../utils/styleInheritance";
import { StyleConfigurator } from "./StyleConfigurator";
import { useFieldTypeComponent } from "./fieldTypes";

interface FieldEditorProps {
  field: Field;
  containerStyle?: StyleConfig; // Estilos del contenedor padre (header/footer)
  onFieldChange: (field: Field) => void;
  onClose: () => void;
}

export function FieldEditor({
  field,
  containerStyle,
  onFieldChange,
  onClose,
}: FieldEditorProps) {
  const t = useTranslations("CreateTemplate.fieldEditor");
  const [currentField, setCurrentField] = useState<Field>(field);

  // Hook para obtener el componente específico del tipo de campo
  const FieldTypeComponent = useFieldTypeComponent(currentField.type);

  // Actualizar el campo cuando cambien los estilos del contenedor (solo para campos que heredan)
  useEffect(() => {
    if (!currentField.style_manually_edited && containerStyle) {
      const updatedField = inheritStylesFromContainer(
        currentField,
        containerStyle
      );
      if (
        JSON.stringify(updatedField.style_config) !==
        JSON.stringify(currentField.style_config)
      ) {
        setCurrentField(updatedField);
      }
    }
  }, [containerStyle, currentField.style_manually_edited]);

  // Calcular estilos efectivos considerando herencia (se recalcula cuando currentField cambia)
  const effectiveStyles = getEffectiveFieldStyles(currentField, containerStyle);
  const inheritableStyles = getInheritableStyles(containerStyle);

  const updateField = useCallback((updates: Partial<Field>) => {
    setCurrentField((prev) => ({ ...prev, ...updates } as Field));
  }, []);

  const updateFieldConfig = useCallback(
    (configUpdates: Record<string, unknown>) => {
      setCurrentField(
        (prev) =>
          ({
            ...prev,
            field_config: {
              ...prev.field_config,
              ...configUpdates,
            },
          } as Field)
      );
    },
    []
  );

  const updateValidation = useCallback(
    (validationUpdates: Partial<ValidationRules>) => {
      setCurrentField(
        (prev) =>
          ({
            ...prev,
            validation: {
              ...prev.validation,
              ...validationUpdates,
            },
          } as Field)
      );
    },
    []
  );

  const updateStyleConfig = useCallback(
    (styleUpdates: Record<string, unknown>) => {
      setCurrentField((prev) => {
        const updated = markFieldStyleAsManuallyEdited({
          ...prev,
          style_config: {
            ...prev.style_config,
            ...styleUpdates,
          },
        } as Field);
        return updated;
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    // Si form es false, asignar automáticamente displayName a label y description
    let fieldToSave = { ...currentField };
    if (!currentField.form) {
      fieldToSave = {
        ...fieldToSave,
        label: currentField.display_name,
        description: currentField.display_name,
      };
    }

    // Para text_with_icon, asegurar que tenga al menos field_config con icon_options
    if (currentField.type === "text_with_icon") {
      const currentConfig = fieldToSave.field_config as TextWithIconFieldConfig;
      fieldToSave = {
        ...fieldToSave,
        field_config: {
          subtype: currentConfig?.subtype || "short",
          icon_options: currentConfig?.icon_options || [""],
          selected_icon: currentConfig?.selected_icon, // Preservar el icono seleccionado
          showLabel: currentConfig?.showLabel, // Preservar la configuración de showLabel
        },
      } as Field;
    }

    // Para date_range, asegurar que tenga los campos requeridos
    if (currentField.type === "date_range") {
      const currentConfig = fieldToSave.field_config as DateRangeFieldConfig;
      fieldToSave = {
        ...fieldToSave,
        field_config: {
          date_format: currentConfig?.date_format || "YYYY-MM-DD",
          start_date_label: currentConfig?.start_date_label || "Start Date",
          start_date_description: currentConfig?.start_date_description || "",
          end_date_label: currentConfig?.end_date_label || "End Date",
          end_date_description: currentConfig?.end_date_description || "",
          // Preservar las configuraciones de fases de luna
          show_moon_phases: currentConfig?.show_moon_phases,
          start_moon_phase: currentConfig?.start_moon_phase,
          end_moon_phase: currentConfig?.end_moon_phase,
        },
      } as Field;
    }

    onFieldChange(fieldToSave);
    onClose();
  }, [currentField, onFieldChange, onClose]);

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        {/* ID del Campo */}
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("basic.fieldId")} *
          </label>
          <input
            type="text"
            value={currentField.field_id}
            onChange={(e) => updateField({ field_id: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="mi_campo_unico"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("basic.displayName")} *
          </label>
          <input
            type="text"
            value={currentField.display_name}
            onChange={(e) => updateField({ display_name: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre del Campo"
          />
        </div>

        {/* Tipo de Campo */}
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("basic.type")} *
          </label>
          <select
            value={currentField.type}
            onChange={(e) =>
              updateField({ type: e.target.value as Field["type"] })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`fieldTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Visibilidad */}
        <div>
          <h4 className="text-sm font-medium text-[#283618] mb-3">
            {t("visibility.title")}
          </h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show_in_form"
                checked={currentField.form}
                onChange={(e) => updateField({ form: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="show_in_form"
                className="ml-2 text-sm text-[#283618]/70 cursor-pointer"
              >
                {t("visibility.form")}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show_in_bulletin"
                checked={currentField.bulletin}
                onChange={(e) => updateField({ bulletin: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="show_in_bulletin"
                className="ml-2 text-sm text-[#283618]/70 cursor-pointer"
              >
                {t("visibility.bulletin")}
              </label>
            </div>
          </div>
          {!currentField.form && (
            <p className="mt-2 text-xs text-amber-600">
              ℹ️ {t("visibility.formHelp")}
            </p>
          )}
        </div>

        {/* Etiqueta y Descripción - Solo si form es true */}
        {currentField.form && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("basic.label")}
              </label>
              <input
                type="text"
                value={currentField.label || ""}
                onChange={(e) => updateField({ label: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Etiqueta para el usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("basic.description")}
              </label>
              <textarea
                rows={2}
                value={currentField.description || ""}
                onChange={(e) => updateField({ description: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción o ayuda para el usuario"
              />
            </div>
          </>
        )}
      </div>

      {/* Value - Mostrar siempre si bulletin es true, excepto para tipos especiales que tienen su propia config */}
      {currentField.bulletin &&
        currentField.type !== "page_number" &&
        currentField.type !== "text_with_icon" &&
        currentField.type !== "image" &&
        currentField.type !== "list" && (
          <div>
            <h3 className="text-lg font-medium text-[#283618] mb-4">
              {currentField.form
                ? t("value.defaultValueTitle")
                : t("value.title")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("value.label")}
              </label>
              <input
                type="text"
                value={
                  typeof currentField.value === "string"
                    ? currentField.value
                    : ""
                }
                onChange={(e) => updateField({ value: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("value.placeholder")}
              />
              <p className="mt-1 text-xs text-[#283618]/50">
                {t("value.help")}
              </p>
            </div>
          </div>
        )}

      {/* Validación - Solo mostrar si form es true */}
      {currentField.form && (
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("validation.title")}
          </h3>
          <div className="flex items-center ">
            <input
              type="checkbox"
              id="required"
              checked={currentField.validation?.required || false}
              onChange={(e) => updateValidation({ required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="required"
              className="ml-2 text-sm text-[#283618]/70 cursor-pointer"
            >
              {t("validation.required")}
            </label>
          </div>
        </div>
      )}

      {/* Configuración específica del tipo - Mostrar siempre para page_number, text_with_icon, image y list cuando form es false, solo si form es true para otros tipos */}
      {(currentField.form ||
        currentField.type === "page_number" ||
        currentField.type === "list" ||
        (currentField.type === "text_with_icon" && !currentField.form) ||
        (currentField.type === "image" && !currentField.form)) && (
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {(currentField.type === "text_with_icon" ||
              currentField.type === "image") &&
            !currentField.form
              ? t("value.title")
              : t("specificConfig.title")}
          </h3>
          <FieldTypeComponent
            currentField={currentField}
            updateField={updateField}
            updateFieldConfig={updateFieldConfig}
            updateValidation={updateValidation}
            t={t}
          />
        </div>
      )}

      {/* Vista previa de paginación - Solo mostrar para page_number cuando form es false y bulletin es true */}
      {!currentField.form &&
        currentField.bulletin &&
        currentField.type === "page_number" && (
          <div>
            <h3 className="text-lg font-medium text-[#283618] mb-4">
              {t("pageNumberConfig.previewTitle")}
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-[#283618]/70 mb-2">
                {t("pageNumberConfig.formatLabel")}
              </div>
              <div className="font-medium text-[#283618] text-lg">
                {(
                  (currentField.field_config as PageNumberFieldConfig)
                    ?.format || "Página {page} de {total}"
                )
                  .replace("{page}", "1")
                  .replace("{total}", "5")}
              </div>
              <div className="text-xs text-[#283618]/50 mt-2">
                {t("pageNumberConfig.previewHelp")}
              </div>
            </div>
          </div>
        )}

      {/* Estilos del campo - Siempre al final */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-[#283618]">
            {t("styleConfig.title")}
          </h3>
          {containerStyle && (
            <div className="flex items-center space-x-2 text-xs">
              {currentField.style_manually_edited ? (
                <>
                  <span className="text-amber-600">✏️ Editado manualmente</span>
                  <button
                    onClick={() =>
                      setCurrentField(
                        resetFieldStyleInheritance(currentField, containerStyle)
                      )
                    }
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Restablecer herencia
                  </button>
                </>
              ) : (
                <span className="text-green-600">
                  🔗 Heredando del contenedor
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mostrar información de herencia si existe */}
        {containerStyle && !currentField.style_manually_edited && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 mb-2">
              Este campo está heredando estilos del{" "}
              {containerStyle ? "contenedor padre" : "estilo global"}:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {inheritableStyles.primary_color && (
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 border rounded mr-2"
                    style={{ backgroundColor: inheritableStyles.primary_color }}
                  ></div>
                  <span>Color: {inheritableStyles.primary_color}</span>
                </div>
              )}
              {inheritableStyles.font_size && (
                <div>Tamaño: {inheritableStyles.font_size}px</div>
              )}
              {inheritableStyles.text_align && (
                <div>Alineación: {inheritableStyles.text_align}</div>
              )}
            </div>
          </div>
        )}

        <StyleConfigurator
          styleConfig={currentField.style_config || {}}
          onStyleChange={(updates: Partial<StyleConfig>) =>
            updateStyleConfig(updates)
          }
          enabledFields={{
            font: true,
            primaryColor: true,
            backgroundColor: true,
            fontSize: true,
            iconSize:
              currentField.type === "text_with_icon" ||
              currentField.type === "select_with_icons",
            iconUseOriginalColor:
              currentField.type === "text_with_icon" ||
              currentField.type === "select_with_icons",
            fontWeight: true,
            lineHeight: true,
            fontStyle: true,
            textDecoration: true,
            textAlign: true,
            borderColor: true,
            borderWidth: true,
            borderRadius: true,
            borderSides: true,
            padding: true,
            margin: true,
            gap: true,
            listStyleType: currentField.type === "list",
            listItemsLayout: currentField.type === "list",
            showTableHeader: currentField.type === "list",
            backgroundImage: true,
          }}
          showPreview={false}
          inheritedStyles={
            !currentField.style_manually_edited ? inheritableStyles : undefined
          }
          isFieldStyle={true}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[#283618]/70 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 cursor-pointer"
        >
          {t("actions.cancel")}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium bg-[#bc6c25] text-[#fefae0] rounded-md hover:bg-[#bc6c25]/90 cursor-pointer"
        >
          {t("actions.save")}
        </button>
      </div>
    </div>
  );
}
