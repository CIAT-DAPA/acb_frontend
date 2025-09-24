"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Field,
  FieldBase,
  FIELD_TYPES,
  TextFieldConfig,
  TextWithIconFieldConfig,
  ListFieldConfig,
  SelectFieldConfig,
  DateFieldConfig,
  PageNumberFieldConfig,
  ClimateDataFieldConfig,
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

  // Función helper para renderizar configuración específica de campos del esquema
  const renderSchemaFieldConfig = (fieldDef: FieldBase, fieldId: string) => {
    const updateSchemaFieldConfig = (
      configUpdates: Record<string, unknown>
    ) => {
      const currentSchema =
        (currentField.field_config as ListFieldConfig)?.item_schema || {};
      const updatedField = {
        ...fieldDef,
        field_config: {
          ...fieldDef.field_config,
          ...configUpdates,
        },
      };
      updateFieldConfig({
        item_schema: {
          ...currentSchema,
          [fieldId]: updatedField,
        },
      });
    };

    const updateSchemaFieldValidation = (
      validationUpdates: Partial<ValidationRules>
    ) => {
      const currentSchema =
        (currentField.field_config as ListFieldConfig)?.item_schema || {};
      const updatedField = {
        ...fieldDef,
        validation: {
          ...fieldDef.validation,
          ...validationUpdates,
        },
      };
      updateFieldConfig({
        item_schema: {
          ...currentSchema,
          [fieldId]: updatedField,
        },
      });
    };

    // Reutilizar la lógica de renderFieldSpecificConfig
    switch (fieldDef.type) {
      case "text":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                Subtipo
              </label>
              <select
                value={
                  (fieldDef.field_config as TextFieldConfig)?.subtype || "short"
                }
                onChange={(e) =>
                  updateSchemaFieldConfig({ subtype: e.target.value })
                }
                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="short">Texto corto</option>
                <option value="long">Texto largo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                Longitud máxima
              </label>
              <input
                type="number"
                min="1"
                value={fieldDef.validation?.max_length || ""}
                onChange={(e) =>
                  updateSchemaFieldValidation({
                    max_length: parseInt(e.target.value) || undefined,
                  })
                }
                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="255"
              />
            </div>
          </div>
        );

      case "number":
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                Valor mínimo
              </label>
              <input
                type="number"
                value={fieldDef.validation?.min_value || ""}
                onChange={(e) =>
                  updateSchemaFieldValidation({
                    min_value: parseFloat(e.target.value) || undefined,
                  })
                }
                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                Valor máximo
              </label>
              <input
                type="number"
                value={fieldDef.validation?.max_value || ""}
                onChange={(e) =>
                  updateSchemaFieldValidation({
                    max_value: parseFloat(e.target.value) || undefined,
                  })
                }
                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                Decimales
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={fieldDef.validation?.decimal_places || ""}
                onChange={(e) =>
                  updateSchemaFieldValidation({
                    decimal_places: parseInt(e.target.value) || undefined,
                  })
                }
                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="2"
              />
            </div>
          </div>
        );

      case "date":
        return (
          <div>
            <label className="block text-xs font-medium text-[#283618]/70 mb-1">
              Formato de fecha
            </label>
            <select
              value={
                (fieldDef.field_config as DateFieldConfig)?.date_format ||
                "YYYY-MM-DD"
              }
              onChange={(e) =>
                updateSchemaFieldConfig({ date_format: e.target.value })
              }
              className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              <option value="dddd, DD - MM">Nombre día, DD - MM</option>
            </select>
          </div>
        );

      case "select":
      case "select_background":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                Opciones (una por línea)
              </label>
              <textarea
                value={
                  (fieldDef.field_config as SelectFieldConfig)?.options?.join(
                    "\n"
                  ) || ""
                }
                onChange={(e) => {
                  const options = e.target.value
                    .split("\n")
                    .filter((option) => option.trim() !== "");
                  updateSchemaFieldConfig({ options });
                }}
                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
              />
            </div>
            <div>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={
                    (fieldDef.field_config as SelectFieldConfig)
                      ?.allow_multiple || false
                  }
                  onChange={(e) =>
                    updateSchemaFieldConfig({
                      allow_multiple: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-[#bc6c25] focus:ring-[#bc6c25] mr-2"
                />
                Permitir múltiples selecciones
              </label>
            </div>
          </div>
        );

      case "select_with_icons":
        const iconFieldConfig = (fieldDef.field_config as any) || {};
        const iconOptionsArray = iconFieldConfig.options || [];
        const iconsUrlArray = iconFieldConfig.icons_url || [];

        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                Opciones (separadas por comas)
              </label>
              <input
                type="text"
                defaultValue={iconOptionsArray.join(", ")}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  // Actualizar inmediatamente pero sin interrumpir la escritura
                  const newOptions = inputValue
                    .split(",")
                    .map((opt) => opt.trim())
                    .filter((opt) => opt !== "");

                  // Mantener las URLs de iconos existentes o crear placeholders
                  const newIconsUrl = newOptions.map(
                    (_, index) => iconsUrlArray[index] || ""
                  );

                  updateSchemaFieldConfig({
                    options: newOptions,
                    icons_url: newIconsUrl,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="sunny, cloudy, rainy"
              />
            </div>

            {iconOptionsArray.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                  URLs de iconos
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {iconOptionsArray.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-xs w-16 truncate font-medium text-[#283618]/80">
                        {option}:
                      </span>
                      <input
                        type="url"
                        value={iconsUrlArray[index] || ""}
                        onChange={(e) => {
                          const newIconsUrl = [...iconsUrlArray];
                          newIconsUrl[index] = e.target.value;
                          updateSchemaFieldConfig({ icons_url: newIconsUrl });
                        }}
                        className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com/icon.png"
                      />
                      {iconsUrlArray[index] && (
                        <div className="w-6 h-6 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                          <img
                            src={iconsUrlArray[index]}
                            alt={option}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = "�️";
                                parent.className +=
                                  " text-gray-400 text-xs flex items-center justify-center";
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={
                    (fieldDef.field_config as SelectFieldConfig)
                      ?.allow_multiple || false
                  }
                  onChange={(e) =>
                    updateSchemaFieldConfig({
                      allow_multiple: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-[#bc6c25] focus:ring-[#bc6c25] mr-2"
                />
                Permitir múltiples selecciones
              </label>
            </div>
          </div>
        );

      case "climate_data_puntual":
        const schemaClimateConfig = fieldDef.field_config as
          | ClimateDataFieldConfig
          | undefined;
        const schemaParameters =
          schemaClimateConfig?.available_parameters || {};

        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-medium text-[#283618]/70">
                Parámetros Climáticos
              </label>
              <button
                onClick={() => {
                  const newParameterId = `param_${
                    Object.keys(schemaParameters).length + 1
                  }`;
                  const newParameter = {
                    label: `Parámetro ${
                      Object.keys(schemaParameters).length + 1
                    }`,
                    unit: "",
                    type: "number" as const,
                    col_name: newParameterId,
                  };

                  updateSchemaFieldConfig({
                    available_parameters: {
                      ...schemaParameters,
                      [newParameterId]: newParameter,
                    },
                  });
                }}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(schemaParameters).map(([paramId, param]) => {
                const paramConfig = param as {
                  label: string;
                  unit: string;
                  type: "number" | "text";
                  col_name: string;
                };
                return (
                  <div
                    key={paramId}
                    className="flex items-center space-x-1 p-2 bg-blue-50 border border-blue-200 rounded"
                  >
                    <input
                      type="text"
                      value={paramConfig.label}
                      onChange={(e) => {
                        updateSchemaFieldConfig({
                          available_parameters: {
                            ...schemaParameters,
                            [paramId]: {
                              ...paramConfig,
                              label: e.target.value,
                            },
                          },
                        });
                      }}
                      placeholder="Etiqueta"
                      className="flex-1 px-1 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={paramConfig.unit}
                      onChange={(e) => {
                        updateSchemaFieldConfig({
                          available_parameters: {
                            ...schemaParameters,
                            [paramId]: {
                              ...paramConfig,
                              unit: e.target.value,
                            },
                          },
                        });
                      }}
                      placeholder="Unidad"
                      className="w-12 px-1 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={paramConfig.type}
                      onChange={(e) => {
                        updateSchemaFieldConfig({
                          available_parameters: {
                            ...schemaParameters,
                            [paramId]: {
                              ...paramConfig,
                              type: e.target.value as "number" | "text",
                            },
                          },
                        });
                      }}
                      className="w-16 px-1 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="number">Num</option>
                      <option value="text">Txt</option>
                    </select>
                    <button
                      onClick={() => {
                        const newParameters = { ...schemaParameters };
                        delete newParameters[paramId];
                        updateSchemaFieldConfig({
                          available_parameters: newParameters,
                        });
                      }}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>

            {Object.keys(schemaParameters).length === 0 && (
              <p className="text-xs text-gray-500 italic">
                No hay parámetros configurados
              </p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-2 text-[#283618]/50 text-xs">
            Sin configuración específica para este tipo
          </div>
        );
    }
  };

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
              <option value="dddd, DD - MM">Nombre día, DD - MM</option>
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

      case "list":
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
                    (currentField.field_config as ListFieldConfig)?.min_items ||
                    0
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
                    (currentField.field_config as ListFieldConfig)?.max_items ||
                    10
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
                Si se especifica, la lista se dividirá en páginas con este
                número de elementos
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-[#283618]/70">
                  Esquema de elementos de la lista
                </label>
                <button
                  onClick={() => {
                    const newFieldId = `field_${Date.now()}`;
                    const newField: FieldBase = {
                      field_id: newFieldId,
                      display_name: "Nuevo Campo",
                      type: "text",
                      form: true,
                      bulletin: false,
                    };

                    const currentSchema =
                      (currentField.field_config as ListFieldConfig)
                        ?.item_schema || {};
                    updateFieldConfig({
                      item_schema: {
                        ...currentSchema,
                        [newFieldId]: newField,
                      },
                    });
                  }}
                  className="px-3 py-1 bg-[#bc6c25] text-white rounded-md hover:bg-[#8b5220] text-sm font-medium"
                >
                  + Agregar Campo
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-[#283618]/70 mb-4">
                  Define los campos que tendrá cada elemento de la lista. Cada
                  elemento creado tendrá estos campos.
                </p>

                {(() => {
                  const schema =
                    (currentField.field_config as ListFieldConfig)
                      ?.item_schema || {};
                  const schemaFields = Object.entries(schema);

                  if (schemaFields.length === 0) {
                    return (
                      <div className="text-center py-8 text-[#283618]/50">
                        <p className="mb-2">
                          No hay campos definidos en el esquema
                        </p>
                        <p className="text-xs">
                          Haz clic en "Agregar Campo" para empezar
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {schemaFields.map(([fieldId, fieldDef], index) => (
                        <div
                          key={fieldId}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-[#bc6c25]/10 text-[#bc6c25] rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <h4 className="font-medium text-[#283618]">
                                {fieldDef.display_name || "Sin nombre"}
                              </h4>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {[
                                  { value: "text", label: "Texto" },
                                  {
                                    value: "text_with_icon",
                                    label: "Texto con Icono",
                                  },
                                  { value: "number", label: "Número" },
                                  { value: "date", label: "Fecha" },
                                  {
                                    value: "date_range",
                                    label: "Rango de Fechas",
                                  },
                                  { value: "select", label: "Selección" },
                                  {
                                    value: "select_with_icons",
                                    label: "Selección con Iconos",
                                  },
                                  {
                                    value: "select_background",
                                    label: "Selección con Fondo",
                                  },
                                  {
                                    value: "image_upload",
                                    label: "Subir Imagen",
                                  },
                                  {
                                    value: "climate_data_puntual",
                                    label: "Datos Climáticos",
                                  },
                                  { value: "algorithm", label: "Algoritmo" },
                                  {
                                    value: "page_number",
                                    label: "Número de Página",
                                  },
                                  { value: "card", label: "Tarjeta" },
                                  {
                                    value: "background_url",
                                    label: "URL de Fondo",
                                  },
                                ].find((t) => t.value === fieldDef.type)
                                  ?.label || fieldDef.type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  const newFieldId = `${fieldId}_copy_${Date.now()}`;
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const copiedField = {
                                    ...fieldDef,
                                    field_id: newFieldId,
                                    display_name: `${fieldDef.display_name} (copia)`,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [newFieldId]: copiedField,
                                    },
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded text-sm"
                                title="Duplicar campo"
                              >
                                📋
                              </button>
                              <button
                                onClick={() => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const { [fieldId]: removed, ...restSchema } =
                                    currentSchema;
                                  updateFieldConfig({
                                    item_schema: restSchema,
                                  });
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded text-sm"
                                title="Eliminar campo"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                ID del Campo
                              </label>
                              <input
                                type="text"
                                value={fieldDef.field_id}
                                onChange={(e) => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const updatedField = {
                                    ...fieldDef,
                                    field_id: e.target.value,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [fieldId]: updatedField,
                                    },
                                  });
                                }}
                                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="campo_id"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                Nombre Visible
                              </label>
                              <input
                                type="text"
                                value={fieldDef.display_name}
                                onChange={(e) => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const updatedField = {
                                    ...fieldDef,
                                    display_name: e.target.value,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [fieldId]: updatedField,
                                    },
                                  });
                                }}
                                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nombre del Campo"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                Tipo de Campo
                              </label>
                              <select
                                value={fieldDef.type}
                                onChange={(e) => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const updatedField = {
                                    ...fieldDef,
                                    type: e.target.value as any,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [fieldId]: updatedField,
                                    },
                                  });
                                }}
                                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              >
                                {[
                                  { value: "text", label: "Texto" },
                                  {
                                    value: "text_with_icon",
                                    label: "Texto con Icono",
                                  },
                                  { value: "number", label: "Número" },
                                  { value: "date", label: "Fecha" },
                                  {
                                    value: "date_range",
                                    label: "Rango de Fechas",
                                  },
                                  { value: "select", label: "Selección" },
                                  {
                                    value: "select_with_icons",
                                    label: "Selección con Iconos",
                                  },
                                  {
                                    value: "select_background",
                                    label: "Selección con Fondo",
                                  },
                                  {
                                    value: "image_upload",
                                    label: "Subir Imagen",
                                  },
                                  {
                                    value: "climate_data_puntual",
                                    label: "Datos Climáticos",
                                  },
                                  { value: "algorithm", label: "Algoritmo" },
                                  {
                                    value: "page_number",
                                    label: "Número de Página",
                                  },
                                  { value: "card", label: "Tarjeta" },
                                  {
                                    value: "background_url",
                                    label: "URL de Fondo",
                                  },
                                ].map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                Etiqueta
                              </label>
                              <input
                                type="text"
                                value={fieldDef.label || ""}
                                onChange={(e) => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const updatedField = {
                                    ...fieldDef,
                                    label: e.target.value,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [fieldId]: updatedField,
                                    },
                                  });
                                }}
                                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Etiqueta del campo"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                Descripción (opcional)
                              </label>
                              <input
                                type="text"
                                value={fieldDef.description || ""}
                                onChange={(e) => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const updatedField = {
                                    ...fieldDef,
                                    description: e.target.value,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [fieldId]: updatedField,
                                    },
                                  });
                                }}
                                className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Descripción del campo"
                              />
                            </div>

                            {fieldDef.form && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                    Texto de placeholder
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      (fieldDef.field_config as any)
                                        ?.placeholder || ""
                                    }
                                    onChange={(e) => {
                                      const currentSchema =
                                        (
                                          currentField.field_config as ListFieldConfig
                                        )?.item_schema || {};
                                      const updatedField = {
                                        ...fieldDef,
                                        field_config: {
                                          ...fieldDef.field_config,
                                          placeholder: e.target.value,
                                        },
                                      };
                                      updateFieldConfig({
                                        item_schema: {
                                          ...currentSchema,
                                          [fieldId]: updatedField,
                                        },
                                      });
                                    }}
                                    className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Ingrese el nombre..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                    Texto de ayuda
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      (fieldDef.field_config as any)
                                        ?.help_text || ""
                                    }
                                    onChange={(e) => {
                                      const currentSchema =
                                        (
                                          currentField.field_config as ListFieldConfig
                                        )?.item_schema || {};
                                      const updatedField = {
                                        ...fieldDef,
                                        field_config: {
                                          ...fieldDef.field_config,
                                          help_text: e.target.value,
                                        },
                                      };
                                      updateFieldConfig({
                                        item_schema: {
                                          ...currentSchema,
                                          [fieldId]: updatedField,
                                        },
                                      });
                                    }}
                                    className="block w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Texto explicativo que aparecerá bajo el campo"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="mt-3 flex space-x-4">
                            <label className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={fieldDef.form}
                                onChange={(e) => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const updatedField = {
                                    ...fieldDef,
                                    form: e.target.checked,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [fieldId]: updatedField,
                                    },
                                  });
                                }}
                                className="rounded border-gray-300 text-[#bc6c25] focus:ring-[#bc6c25] mr-2"
                              />
                              Mostrar en formulario
                            </label>
                            <label className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={fieldDef.bulletin}
                                onChange={(e) => {
                                  const currentSchema =
                                    (
                                      currentField.field_config as ListFieldConfig
                                    )?.item_schema || {};
                                  const updatedField = {
                                    ...fieldDef,
                                    bulletin: e.target.checked,
                                  };
                                  updateFieldConfig({
                                    item_schema: {
                                      ...currentSchema,
                                      [fieldId]: updatedField,
                                    },
                                  });
                                }}
                                className="rounded border-gray-300 text-[#bc6c25] focus:ring-[#bc6c25] mr-2"
                              />
                              Mostrar en boletín
                            </label>
                          </div>

                          {/* Valor fijo cuando no aparece en formulario */}
                          {!fieldDef.form && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                                Valor fijo (no editable por usuario)
                              </label>
                              {[
                                "select",
                                "select_with_icons",
                                "select_background",
                              ].includes(fieldDef.type) ? (
                                <select
                                  value={
                                    (fieldDef.field_config as any)
                                      ?.default_value || ""
                                  }
                                  onChange={(e) => {
                                    const currentSchema =
                                      (
                                        currentField.field_config as ListFieldConfig
                                      )?.item_schema || {};
                                    const updatedField = {
                                      ...fieldDef,
                                      field_config: {
                                        ...fieldDef.field_config,
                                        default_value: e.target.value,
                                      },
                                    };
                                    updateFieldConfig({
                                      item_schema: {
                                        ...currentSchema,
                                        [fieldId]: updatedField,
                                      },
                                    });
                                  }}
                                  className="block w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                                >
                                  <option value="">
                                    Seleccione una opción
                                  </option>
                                  {fieldDef.type === "select_with_icons"
                                    ? (
                                        (fieldDef.field_config as any)
                                          ?.options || []
                                      ).map((option: string, index: number) => (
                                        <option key={index} value={option}>
                                          {option}
                                        </option>
                                      ))
                                    : (
                                        (fieldDef.field_config as any)
                                          ?.options || []
                                      ).map((option: any, index: number) => (
                                        <option
                                          key={index}
                                          value={option.value || option}
                                        >
                                          {option.label || option}
                                        </option>
                                      ))}
                                </select>
                              ) : (
                                <input
                                  type={
                                    fieldDef.type === "number"
                                      ? "number"
                                      : fieldDef.type === "date"
                                      ? "date"
                                      : "text"
                                  }
                                  value={
                                    (fieldDef.field_config as any)
                                      ?.default_value || ""
                                  }
                                  onChange={(e) => {
                                    const currentSchema =
                                      (
                                        currentField.field_config as ListFieldConfig
                                      )?.item_schema || {};
                                    const updatedField = {
                                      ...fieldDef,
                                      field_config: {
                                        ...fieldDef.field_config,
                                        default_value: e.target.value,
                                      },
                                    };
                                    updateFieldConfig({
                                      item_schema: {
                                        ...currentSchema,
                                        [fieldId]: updatedField,
                                      },
                                    });
                                  }}
                                  className="block w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                                  placeholder="Valor que se asignará automáticamente"
                                />
                              )}
                              <p className="text-xs text-yellow-700 mt-1">
                                Este valor se asignará automáticamente ya que el
                                campo no aparece en el formulario
                              </p>
                            </div>
                          )}

                          {/* Validaciones del campo */}
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <h5 className="text-xs font-medium text-[#283618]/70 mb-2">
                              Validaciones
                            </h5>
                            <div className="space-y-2">
                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={
                                    fieldDef.validation?.required || false
                                  }
                                  onChange={(e) => {
                                    const currentSchema =
                                      (
                                        currentField.field_config as ListFieldConfig
                                      )?.item_schema || {};
                                    const updatedField = {
                                      ...fieldDef,
                                      validation: {
                                        ...fieldDef.validation,
                                        required: e.target.checked,
                                      },
                                    };
                                    updateFieldConfig({
                                      item_schema: {
                                        ...currentSchema,
                                        [fieldId]: updatedField,
                                      },
                                    });
                                  }}
                                  className="rounded border-gray-300 text-[#bc6c25] focus:ring-[#bc6c25] mr-2"
                                />
                                Campo obligatorio
                              </label>

                              {fieldDef.type === "text" && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-[#283618]/70 mb-1">
                                      Longitud mínima
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={
                                        fieldDef.validation?.min_length || ""
                                      }
                                      onChange={(e) => {
                                        const currentSchema =
                                          (
                                            currentField.field_config as ListFieldConfig
                                          )?.item_schema || {};
                                        const updatedField = {
                                          ...fieldDef,
                                          validation: {
                                            ...fieldDef.validation,
                                            min_length: e.target.value
                                              ? parseInt(e.target.value)
                                              : undefined,
                                          },
                                        };
                                        updateFieldConfig({
                                          item_schema: {
                                            ...currentSchema,
                                            [fieldId]: updatedField,
                                          },
                                        });
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-[#283618]/70 mb-1">
                                      Longitud máxima
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={
                                        fieldDef.validation?.max_length || ""
                                      }
                                      onChange={(e) => {
                                        const currentSchema =
                                          (
                                            currentField.field_config as ListFieldConfig
                                          )?.item_schema || {};
                                        const updatedField = {
                                          ...fieldDef,
                                          validation: {
                                            ...fieldDef.validation,
                                            max_length: e.target.value
                                              ? parseInt(e.target.value)
                                              : undefined,
                                          },
                                        };
                                        updateFieldConfig({
                                          item_schema: {
                                            ...currentSchema,
                                            [fieldId]: updatedField,
                                          },
                                        });
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                                      placeholder="Ilimitado"
                                    />
                                  </div>
                                </div>
                              )}

                              {fieldDef.type === "number" && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-[#283618]/70 mb-1">
                                      Valor mínimo
                                    </label>
                                    <input
                                      type="number"
                                      value={
                                        fieldDef.validation?.min_value || ""
                                      }
                                      onChange={(e) => {
                                        const currentSchema =
                                          (
                                            currentField.field_config as ListFieldConfig
                                          )?.item_schema || {};
                                        const updatedField = {
                                          ...fieldDef,
                                          validation: {
                                            ...fieldDef.validation,
                                            min_value: e.target.value
                                              ? parseFloat(e.target.value)
                                              : undefined,
                                          },
                                        };
                                        updateFieldConfig({
                                          item_schema: {
                                            ...currentSchema,
                                            [fieldId]: updatedField,
                                          },
                                        });
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                                      placeholder="Sin límite"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-[#283618]/70 mb-1">
                                      Valor máximo
                                    </label>
                                    <input
                                      type="number"
                                      value={
                                        fieldDef.validation?.max_value || ""
                                      }
                                      onChange={(e) => {
                                        const currentSchema =
                                          (
                                            currentField.field_config as ListFieldConfig
                                          )?.item_schema || {};
                                        const updatedField = {
                                          ...fieldDef,
                                          validation: {
                                            ...fieldDef.validation,
                                            max_value: e.target.value
                                              ? parseFloat(e.target.value)
                                              : undefined,
                                          },
                                        };
                                        updateFieldConfig({
                                          item_schema: {
                                            ...currentSchema,
                                            [fieldId]: updatedField,
                                          },
                                        });
                                      }}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                                      placeholder="Sin límite"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Configuración específica por tipo de campo */}
                          {[
                            "text",
                            "number",
                            "date",
                            "select",
                            "select_with_icons",
                            "select_background",
                            "climate_data_puntual",
                          ].includes(fieldDef.type) && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-[#283618]/70 mb-2">
                                Configuración específica de{" "}
                                {[
                                  { value: "text", label: "Texto" },
                                  { value: "number", label: "Número" },
                                  { value: "date", label: "Fecha" },
                                  { value: "select", label: "Selección" },
                                  {
                                    value: "select_with_icons",
                                    label: "Selección con Iconos",
                                  },
                                  {
                                    value: "select_background",
                                    label: "Selección con Fondo",
                                  },
                                  {
                                    value: "climate_data_puntual",
                                    label: "Datos Climáticos",
                                  },
                                ].find((t) => t.value === fieldDef.type)
                                  ?.label || fieldDef.type}
                              </h5>
                              <div className="bg-gray-50 p-3 rounded border">
                                {renderSchemaFieldConfig(fieldDef, fieldId)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Tip:</strong> Los campos definidos aquí se
                    repetirán para cada elemento que se agregue a la lista. Por
                    ejemplo, si defines "Nombre" y "Descripción", cada elemento
                    de la lista tendrá estos dos campos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "climate_data_puntual":
        const climateConfig =
          currentField.field_config as ClimateDataFieldConfig;
        const parameters = climateConfig?.available_parameters || {};

        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  🌡️
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#283618]">
                    Configuración de Datos Climáticos
                  </h4>
                  <p className="text-xs text-[#283618]/70">
                    Define los parámetros climáticos disponibles para este campo
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-[#283618]/70">
                    Parámetros Disponibles
                  </label>
                  <button
                    onClick={() => {
                      const newParameterId = `param_${
                        Object.keys(parameters).length + 1
                      }`;
                      const newParameter = {
                        label: `Parámetro ${
                          Object.keys(parameters).length + 1
                        }`,
                        unit: "",
                        type: "number" as const,
                        col_name: newParameterId,
                      };

                      updateFieldConfig({
                        available_parameters: {
                          ...parameters,
                          [newParameterId]: newParameter,
                        },
                      });
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    + Agregar Parámetro
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(parameters).map(([paramId, param], index) => {
                    const paramConfig = param as {
                      label: string;
                      unit: string;
                      type: "number" | "text";
                      col_name: string;
                    };
                    return (
                      <div
                        key={paramId}
                        className="bg-white p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                              Etiqueta
                            </label>
                            <input
                              type="text"
                              value={paramConfig.label}
                              onChange={(e) => {
                                updateFieldConfig({
                                  available_parameters: {
                                    ...parameters,
                                    [paramId]: {
                                      ...paramConfig,
                                      label: e.target.value,
                                    },
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Nombre del parámetro"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                              Unidad
                            </label>
                            <input
                              type="text"
                              value={paramConfig.unit}
                              onChange={(e) => {
                                updateFieldConfig({
                                  available_parameters: {
                                    ...parameters,
                                    [paramId]: {
                                      ...paramConfig,
                                      unit: e.target.value,
                                    },
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="ej: °C, mm, %"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                              Tipo de Dato
                            </label>
                            <select
                              value={paramConfig.type}
                              onChange={(e) => {
                                updateFieldConfig({
                                  available_parameters: {
                                    ...parameters,
                                    [paramId]: {
                                      ...paramConfig,
                                      type: e.target.value as "number" | "text",
                                    },
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="number">Numérico</option>
                              <option value="text">Texto</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[#283618]/70 mb-1">
                              Nombre de Columna
                            </label>
                            <input
                              type="text"
                              value={paramConfig.col_name}
                              onChange={(e) => {
                                updateFieldConfig({
                                  available_parameters: {
                                    ...parameters,
                                    [paramId]: {
                                      ...paramConfig,
                                      col_name: e.target.value,
                                    },
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="nombre_columna"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => {
                              const newParameterId = `param_${Date.now()}`;
                              const duplicatedParameter = {
                                ...paramConfig,
                                label: `${paramConfig.label} (copia)`,
                                col_name: `${paramConfig.col_name}_copy`,
                              };

                              updateFieldConfig({
                                available_parameters: {
                                  ...parameters,
                                  [newParameterId]: duplicatedParameter,
                                },
                              });
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            📋 Duplicar
                          </button>

                          <button
                            onClick={() => {
                              const newParameters = { ...parameters };
                              delete newParameters[paramId];
                              updateFieldConfig({
                                available_parameters: newParameters,
                              });
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {Object.keys(parameters).length === 0 && (
                  <div className="text-center py-8 text-[#283618]/50 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="mb-2">
                      No hay parámetros climáticos definidos
                    </p>
                    <p className="text-xs">
                      Haz clic en "Agregar Parámetro" para empezar
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h5 className="text-xs font-medium text-blue-800 mb-2">
                    Parámetros Preconfigurados Sugeridos
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Temperatura Máxima",
                        unit: "°C",
                        col_name: "temp_max",
                      },
                      {
                        label: "Temperatura Mínima",
                        unit: "°C",
                        col_name: "temp_min",
                      },
                      {
                        label: "Precipitación",
                        unit: "mm",
                        col_name: "precipitation",
                      },
                      {
                        label: "Humedad Relativa",
                        unit: "%",
                        col_name: "humidity",
                      },
                      {
                        label: "Velocidad del Viento",
                        unit: "m/s",
                        col_name: "wind_speed",
                      },
                      {
                        label: "Radiación Solar",
                        unit: "MJ/m²",
                        col_name: "solar_radiation",
                      },
                    ].map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const newParameterId = `param_${Date.now()}_${index}`;
                          const newParameter = {
                            label: preset.label,
                            unit: preset.unit,
                            type: "number" as const,
                            col_name: preset.col_name,
                          };

                          updateFieldConfig({
                            available_parameters: {
                              ...parameters,
                              [newParameterId]: newParameter,
                            },
                          });
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-left"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
      {!currentField.form &&
        currentField.bulletin &&
        currentField.type !== "page_number" && (
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
              <option value="100">
                {t("styleConfig.fontWeightOptions.thin")}
              </option>
              <option value="200">
                {t("styleConfig.fontWeightOptions.extraLight")}
              </option>
              <option value="300">
                {t("styleConfig.fontWeightOptions.light")}
              </option>
              <option value="400">
                {t("styleConfig.fontWeightOptions.normal")}
              </option>
              <option value="500">
                {t("styleConfig.fontWeightOptions.medium")}
              </option>
              <option value="600">
                {t("styleConfig.fontWeightOptions.semiBold")}
              </option>
              <option value="700">
                {t("styleConfig.fontWeightOptions.bold")}
              </option>
              <option value="800">
                {t("styleConfig.fontWeightOptions.extraBold")}
              </option>
              <option value="900">
                {t("styleConfig.fontWeightOptions.black")}
              </option>
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
              <option value="normal">
                {t("styleConfig.fontStyleOptions.normal")}
              </option>
              <option value="italic">
                {t("styleConfig.fontStyleOptions.italic")}
              </option>
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
              <option value="none">
                {t("styleConfig.textDecorationOptions.none")}
              </option>
              <option value="underline">
                {t("styleConfig.textDecorationOptions.underline")}
              </option>
              <option value="line-through">
                {t("styleConfig.textDecorationOptions.lineThrough")}
              </option>
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
      {!currentField.form &&
        currentField.bulletin &&
        currentField.type === "page_number" && (
          <div>
            <h3 className="text-lg font-medium text-[#283618] mb-4">
              {t("pageNumberConfig.previewTitle", {
                default: "Vista Previa de Paginación",
              })}
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-[#283618]/70 mb-2">
                {t("pageNumberConfig.formatLabel", {
                  default: "Formato configurado:",
                })}
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
                {t("pageNumberConfig.previewHelp", {
                  default:
                    "Esta es una vista previa. Los números de página se generarán automáticamente.",
                })}
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
