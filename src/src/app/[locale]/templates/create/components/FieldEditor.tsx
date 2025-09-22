"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Field,
  FIELD_TYPES,
  TextFieldConfig,
  ListFieldConfig,
  SelectFieldConfig,
  DateFieldConfig,
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
      setCurrentField((prev) =>
        markFieldStyleAsManuallyEdited({
          ...prev,
          style_config: {
            ...prev.style_config,
            ...styleUpdates,
          },
        } as Field)
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    onFieldChange(currentField);
    onClose();
  }, [currentField, onFieldChange, onClose]);

  const renderFieldSpecificConfig = () => {
    switch (currentField.type) {
      case "text":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("textConfig.subtype", { default: "Subtipo de texto" })}
              </label>
              <select
                value={
                  (currentField.field_config as TextFieldConfig)?.subtype ||
                  "short"
                }
                onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="short">
                  {t("textConfig.short", { default: "Corto" })}
                </option>
                <option value="long">
                  {t("textConfig.long", { default: "Largo" })}
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("validation.minLength", { default: "Longitud mínima" })}
                </label>
                <input
                  type="number"
                  value={currentField.validation?.min_length || ""}
                  onChange={(e) =>
                    updateValidation({
                      min_length: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("validation.maxLength", { default: "Longitud máxima" })}
                </label>
                <input
                  type="number"
                  value={currentField.validation?.max_length || ""}
                  onChange={(e) =>
                    updateValidation({
                      max_length: parseInt(e.target.value) || undefined,
                    })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="255"
                />
              </div>
            </div>
          </div>
        );

      case "number":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("numberConfig.minValue", { default: "Valor mínimo" })}
              </label>
              <input
                type="number"
                value={currentField.validation?.min_value || ""}
                onChange={(e) =>
                  updateValidation({
                    min_value: parseFloat(e.target.value) || undefined,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("numberConfig.maxValue", { default: "Valor máximo" })}
              </label>
              <input
                type="number"
                value={currentField.validation?.max_value || ""}
                onChange={(e) =>
                  updateValidation({
                    max_value: parseFloat(e.target.value) || undefined,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("numberConfig.decimalPlaces", { default: "Decimales" })}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={currentField.validation?.decimal_places || ""}
                onChange={(e) =>
                  updateValidation({
                    decimal_places: parseInt(e.target.value) || undefined,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="2"
              />
            </div>
          </div>
        );

      case "date":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("dateConfig.format", { default: "Formato de fecha" })}
            </label>
            <select
              value={
                (currentField.field_config as DateFieldConfig)?.date_format ||
                "YYYY-MM-DD"
              }
              onChange={(e) =>
                updateFieldConfig({ date_format: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            </select>
          </div>
        );

      case "page_number":
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("pageNumberConfig.format", { default: "Formato" })}
            </label>
            <input
              type="text"
              value={
                (currentField.field_config as PageNumberFieldConfig)?.format ||
                "Página {page} de {total}"
              }
              onChange={(e) => updateFieldConfig({ format: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Página {page} de {total}"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("pageNumberConfig.help", {
                default:
                  "Usa {page} para número actual y {total} para total de páginas",
              })}
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-gray-500">
            {t("noConfig", {
              default:
                "No hay configuraciones específicas para este tipo de campo",
            })}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("basic.fieldId", { default: "ID del Campo" })} *
          </label>
          <input
            type="text"
            value={currentField.field_id}
            onChange={(e) => updateField({ field_id: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="mi_campo_unico"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("basic.displayName", { default: "Nombre a Mostrar" })} *
          </label>
          <input
            type="text"
            value={currentField.display_name}
            onChange={(e) => updateField({ display_name: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre del Campo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("basic.type", { default: "Tipo de Campo" })} *
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
                {t(`fieldTypes.${type}`, { default: type })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("basic.label", { default: "Etiqueta" })}
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("basic.description", { default: "Descripción" })}
          </label>
          <textarea
            rows={2}
            value={currentField.description || ""}
            onChange={(e) => updateField({ description: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descripción o ayuda para el usuario"
          />
        </div>
      </div>

      {/* Opciones de visibilidad */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("visibility.title", { default: "Visibilidad" })}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_in_form"
              checked={currentField.form}
              onChange={(e) => updateField({ form: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="show_in_form"
              className="ml-2 text-sm text-gray-700"
            >
              {t("visibility.form", {
                default: "Mostrar en formulario de creación de boletín",
              })}
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_in_bulletin"
              checked={currentField.bulletin}
              onChange={(e) => updateField({ bulletin: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="show_in_bulletin"
              className="ml-2 text-sm text-gray-700"
            >
              {t("visibility.bulletin", {
                default: "Mostrar en boletín final",
              })}
            </label>
          </div>
        </div>
      </div>

      {/* Value - Solo mostrar si form es false y bulletin es true */}
      {!currentField.form && currentField.bulletin && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("value.title", { default: "Valor del Campo" })}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("value.label", { default: "Valor" })}
            </label>
            <input
              type="text"
              value={
                typeof currentField.value === "string" ? currentField.value : ""
              }
              onChange={(e) => updateField({ value: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("value.placeholder", {
                default: "Valor que se mostrará en el boletín",
              })}
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("value.help", {
                default:
                  "Como este campo no aparece en el formulario, debes definir aquí el valor que se mostrará",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Estilos del campo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {t("styleConfig.title", { default: "Estilos del Campo" })}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.color", { default: "Color del Texto" })}
            </label>
            <input
              type="color"
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.primary_color || "#000000"
                  : effectiveStyles.primary_color || "#000000"
              }
              onChange={(e) =>
                updateStyleConfig({ primary_color: e.target.value })
              }
              className="block w-16 h-8 border border-gray-300 rounded cursor-pointer"
            />
            {!currentField.style_manually_edited &&
              inheritableStyles.primary_color && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.primary_color}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.fontSize", { default: "Tamaño de Fuente (px)" })}
            </label>
            <input
              type="number"
              min="8"
              max="72"
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.font_size || ""
                  : effectiveStyles.font_size || ""
              }
              onChange={(e) =>
                updateStyleConfig({
                  font_size: parseInt(e.target.value) || undefined,
                })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={inheritableStyles.font_size?.toString() || "16"}
            />
            {!currentField.style_manually_edited &&
              inheritableStyles.font_size && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.font_size}px
                </p>
              )}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.textAlign", { default: "Alineación del Texto" })}
            </label>
            <select
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.text_align || "left"
                  : effectiveStyles.text_align || "left"
              }
              onChange={(e) =>
                updateStyleConfig({ text_align: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="left">
                {t("styleConfig.alignOptions.left", { default: "Izquierda" })}
              </option>
              <option value="center">
                {t("styleConfig.alignOptions.center", { default: "Centro" })}
              </option>
              <option value="right">
                {t("styleConfig.alignOptions.right", { default: "Derecha" })}
              </option>
            </select>
            {!currentField.style_manually_edited &&
              inheritableStyles.text_align && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.text_align}
                </p>
              )}
          </div>
        </div>

        {/* Propiedades de Borde */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.borderColor", { default: "Color del Borde" })}
            </label>
            <input
              type="color"
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.border_color || "#000000"
                  : effectiveStyles.border_color || "#000000"
              }
              onChange={(e) =>
                updateStyleConfig({ border_color: e.target.value })
              }
              className="block w-16 h-8 border border-gray-300 rounded cursor-pointer"
            />
            {!currentField.style_manually_edited &&
              inheritableStyles.border_color && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.border_color}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.borderWidth", {
                default: "Grosor del Borde (px)",
              })}
            </label>
            <input
              type="text"
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.border_width || ""
                  : effectiveStyles.border_width || ""
              }
              onChange={(e) =>
                updateStyleConfig({ border_width: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={inheritableStyles.border_width || "1px"}
            />
            {!currentField.style_manually_edited &&
              inheritableStyles.border_width && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.border_width}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.borderRadius", { default: "Redondeado (px)" })}
            </label>
            <input
              type="text"
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.border_radius || ""
                  : effectiveStyles.border_radius || ""
              }
              onChange={(e) =>
                updateStyleConfig({ border_radius: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={inheritableStyles.border_radius || "0px"}
            />
            {!currentField.style_manually_edited &&
              inheritableStyles.border_radius && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.border_radius}
                </p>
              )}
          </div>
        </div>

        {/* Propiedades de Espaciado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.padding", { default: "Padding (CSS)" })}
            </label>
            <input
              type="text"
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.padding || ""
                  : effectiveStyles.padding || ""
              }
              onChange={(e) => updateStyleConfig({ padding: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={inheritableStyles.padding || "0px"}
            />
            {!currentField.style_manually_edited &&
              inheritableStyles.padding && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.padding}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("styleConfig.margin", { default: "Margin (CSS)" })}
            </label>
            <input
              type="text"
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.margin || ""
                  : effectiveStyles.margin || ""
              }
              onChange={(e) => updateStyleConfig({ margin: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={inheritableStyles.margin || "0px"}
            />
            {!currentField.style_manually_edited &&
              inheritableStyles.margin && (
                <p className="text-xs text-gray-500 mt-1">
                  Heredado: {inheritableStyles.margin}
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Validación - Solo mostrar si form es true */}
      {currentField.form && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("validation.title", { default: "Validación" })}
          </h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={currentField.validation?.required || false}
              onChange={(e) => updateValidation({ required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="required" className="ml-2 text-sm text-gray-700">
              {t("validation.required", { default: "Campo obligatorio" })}
            </label>
          </div>
        </div>
      )}

      {/* Configuración específica del tipo - Solo mostrar si form es true */}
      {currentField.form && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t("specificConfig.title", { default: "Configuración Específica" })}
          </h3>
          {renderFieldSpecificConfig()}
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          {t("actions.cancel", { default: "Cancelar" })}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          {t("actions.save", { default: "Guardar" })}
        </button>
      </div>
    </div>
  );
}
