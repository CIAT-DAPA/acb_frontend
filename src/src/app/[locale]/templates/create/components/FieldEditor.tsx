"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Field,
  FIELD_TYPES,
  TextFieldConfig,
  TextWithIconFieldConfig,
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
      fieldToSave = {
        ...fieldToSave,
        field_config: {
          subtype:
            (fieldToSave.field_config as TextWithIconFieldConfig)?.subtype ||
            "short",
          icon_options: (fieldToSave.field_config as TextWithIconFieldConfig)
            ?.icon_options || [""],
        },
      } as Field;
    }

    onFieldChange(fieldToSave);
    onClose();
  }, [currentField, onFieldChange, onClose]);

  const renderFieldSpecificConfig = () => {
    switch (currentField.type) {
      case "text":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("textConfig.subtype")}
              </label>
              <select
                value={
                  (currentField.field_config as TextFieldConfig)?.subtype ||
                  "short"
                }
                onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="short">{t("textConfig.short")}</option>
                <option value="long">{t("textConfig.long")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                  {t("validation.minLength")}
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
                <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                  {t("validation.maxLength")}
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

      case "text_with_icon":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("textConfig.subtype")}
              </label>
              <select
                value={
                  (currentField.field_config as TextWithIconFieldConfig)
                    ?.subtype || "short"
                }
                onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="short">{t("textConfig.short")}</option>
                <option value="long">{t("textConfig.long")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("textWithIconConfig.iconOptions")}
              </label>
              <div className="space-y-2">
                {(
                  (currentField.field_config as TextWithIconFieldConfig)
                    ?.icon_options || []
                ).map((iconUrl, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={iconUrl}
                      onChange={(e) => {
                        const newIcons = [
                          ...((
                            currentField.field_config as TextWithIconFieldConfig
                          )?.icon_options || []),
                        ];
                        newIcons[index] = e.target.value;
                        updateFieldConfig({ icon_options: newIcons });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://ejemplo.com/icono.svg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newIcons = (
                          (currentField.field_config as TextWithIconFieldConfig)
                            ?.icon_options || []
                        ).filter((_, i) => i !== index);
                        updateFieldConfig({ icon_options: newIcons });
                      }}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      {t("actions.remove")}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const currentIcons =
                      (currentField.field_config as TextWithIconFieldConfig)
                        ?.icon_options || [];
                    updateFieldConfig({ icon_options: [...currentIcons, ""] });
                  }}
                  className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  {t("textWithIconConfig.addIcon")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                  {t("validation.minLength")}
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
                <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                  {t("validation.maxLength")}
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
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("numberConfig.minValue")}
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
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("numberConfig.maxValue")}
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
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("numberConfig.decimalPlaces")}
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
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("dateConfig.format")}
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
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("pageNumberConfig.format")}
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
            <p className="mt-1 text-xs text-[#283618]/50">
              {t("pageNumberConfig.help")}
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-[#283618]/50">
            {t("noConfig")}
          </div>
        );
    }
  };

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

      {/* Value - Solo mostrar si form es false y bulletin es true, pero no para page_number */}
      {!currentField.form && currentField.bulletin && currentField.type !== "page_number" && (
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("value.title")}
          </h3>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("value.label")}
            </label>
            <input
              type="text"
              value={
                typeof currentField.value === "string" ? currentField.value : ""
              }
              onChange={(e) => updateField({ value: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("value.placeholder")}
            />
            <p className="mt-1 text-xs text-[#283618]/50">{t("value.help")}</p>
          </div>
        </div>
      )}

      {/* Estilos del campo */}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.color")}
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
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.primary_color}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.fontSize")}
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
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.font_size}px
                </p>
              )}
          </div>
        </div>

        {/* Propiedades de Texto */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.fontWeight")}
            </label>
            <select
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.font_weight || "400"
                  : effectiveStyles.font_weight || "400"
              }
              onChange={(e) =>
                updateStyleConfig({ font_weight: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="100">{t("styleConfig.fontWeightOptions.thin")}</option>
              <option value="200">{t("styleConfig.fontWeightOptions.extraLight")}</option>
              <option value="300">{t("styleConfig.fontWeightOptions.light")}</option>
              <option value="400">{t("styleConfig.fontWeightOptions.normal")}</option>
              <option value="500">{t("styleConfig.fontWeightOptions.medium")}</option>
              <option value="600">{t("styleConfig.fontWeightOptions.semiBold")}</option>
              <option value="700">{t("styleConfig.fontWeightOptions.bold")}</option>
              <option value="800">{t("styleConfig.fontWeightOptions.extraBold")}</option>
              <option value="900">{t("styleConfig.fontWeightOptions.black")}</option>
            </select>
            {!currentField.style_manually_edited &&
              inheritableStyles.font_weight && (
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.font_weight}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.fontStyle")}
            </label>
            <select
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.font_style || "normal"
                  : effectiveStyles.font_style || "normal"
              }
              onChange={(e) =>
                updateStyleConfig({ font_style: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="normal">{t("styleConfig.fontStyleOptions.normal")}</option>
              <option value="italic">{t("styleConfig.fontStyleOptions.italic")}</option>
            </select>
            {!currentField.style_manually_edited &&
              inheritableStyles.font_style && (
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.font_style}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.textDecoration")}
            </label>
            <select
              value={
                currentField.style_manually_edited
                  ? currentField.style_config?.text_decoration || "none"
                  : effectiveStyles.text_decoration || "none"
              }
              onChange={(e) =>
                updateStyleConfig({ text_decoration: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="none">{t("styleConfig.textDecorationOptions.none")}</option>
              <option value="underline">{t("styleConfig.textDecorationOptions.underline")}</option>
              <option value="line-through">{t("styleConfig.textDecorationOptions.lineThrough")}</option>
            </select>
            {!currentField.style_manually_edited &&
              inheritableStyles.text_decoration && (
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.text_decoration}
                </p>
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.textAlign")}
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
              <option value="left">{t("styleConfig.alignOptions.left")}</option>
              <option value="center">
                {t("styleConfig.alignOptions.center")}
              </option>
              <option value="right">
                {t("styleConfig.alignOptions.right")}
              </option>
            </select>
            {!currentField.style_manually_edited &&
              inheritableStyles.text_align && (
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.text_align}
                </p>
              )}
          </div>
        </div>

        {/* Propiedades de Borde */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.borderColor")}
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
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.border_color}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.borderWidth")}
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
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.border_width}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.borderRadius")}
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
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.border_radius}
                </p>
              )}
          </div>
        </div>

        {/* Propiedades de Espaciado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.padding")}
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
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.padding}
                </p>
              )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("styleConfig.margin")}
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
                <p className="text-xs text-[#283618]/50 mt-1">
                  Heredado: {inheritableStyles.margin}
                </p>
              )}
          </div>
        </div>
      </div>

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

      {/* Configuración específica del tipo - Mostrar siempre para page_number, solo si form es true para otros tipos */}
      {(currentField.form || currentField.type === "page_number") && (
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("specificConfig.title")}
          </h3>
          {renderFieldSpecificConfig()}
        </div>
      )}

      {/* Vista previa de paginación - Solo mostrar para page_number cuando form es false y bulletin es true */}
      {!currentField.form && currentField.bulletin && currentField.type === "page_number" && (
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("pageNumberConfig.previewTitle", { default: "Vista Previa de Paginación" })}
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-[#283618]/70 mb-2">
              {t("pageNumberConfig.formatLabel", { default: "Formato configurado:" })}
            </div>
            <div className="font-medium text-[#283618] text-lg">
              {((currentField.field_config as PageNumberFieldConfig)?.format || "Página {page} de {total}")
                .replace("{page}", "1")
                .replace("{total}", "5")}
            </div>
            <div className="text-xs text-[#283618]/50 mt-2">
              {t("pageNumberConfig.previewHelp", { default: "Esta es una vista previa. Los números de página se generarán automáticamente." })}
            </div>
          </div>
        </div>
      )}

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
