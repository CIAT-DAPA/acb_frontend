"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

interface ClimateParameter {
  label: string;
  unit: string;
  type: "number" | "text";
  col_name: string;
}

interface ClimateDataConfig {
  available_parameters: Record<string, ClimateParameter>;
}

export const ClimateDataFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  const config = (currentField.field_config as ClimateDataConfig) || {};
  const availableParameters = config.available_parameters || {};

  // Estado para nuevo parámetro
  const [newParameter, setNewParameter] = useState({
    key: "",
    label: "",
    unit: "",
    type: "number" as "number" | "text",
    col_name: "",
  });

  const [isAddingParameter, setIsAddingParameter] = useState(false);

  const addParameter = () => {
    if (newParameter.key && newParameter.label) {
      const updatedParameters = {
        ...availableParameters,
        [newParameter.key]: {
          label: newParameter.label,
          unit: newParameter.unit,
          type: newParameter.type,
          col_name: newParameter.col_name,
        },
      };

      updateFieldConfig({
        available_parameters: updatedParameters,
      });

      // Reset form
      setNewParameter({
        key: "",
        label: "",
        unit: "",
        type: "number",
        col_name: "",
      });
      setIsAddingParameter(false);
    }
  };

  const removeParameter = (parameterKey: string) => {
    const updatedParameters = { ...availableParameters };
    delete updatedParameters[parameterKey];
    updateFieldConfig({
      available_parameters: updatedParameters,
    });
  };

  const updateParameter = (
    parameterKey: string,
    field: keyof ClimateParameter,
    value: string
  ) => {
    const updatedParameter = {
      ...availableParameters[parameterKey],
      [field]: value,
    };

    // Si se cambia el tipo a "text", limpiar la unidad
    if (field === "type" && value === "text") {
      updatedParameter.unit = "";
    }

    const updatedParameters = {
      ...availableParameters,
      [parameterKey]: updatedParameter,
    };
    updateFieldConfig({
      available_parameters: updatedParameters,
    });
  };

  const parameterKeys = Object.keys(availableParameters);

  return (
    <div className="space-y-4">
      {/* Parámetros climáticos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#283618]/70">
            {t("climateDataConfig.availableParameters")}
          </label>
          <button
            type="button"
            onClick={() => setIsAddingParameter(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + {t("actions.addParameter")}
          </button>
        </div>

        <div className="space-y-3">
          {/* Parámetros existentes */}
          {parameterKeys.map((paramKey) => {
            const param = availableParameters[paramKey];
            return (
              <div
                key={paramKey}
                className="p-4 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Clave del parámetro */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t("climateDataConfig.parameterKey")}
                    </label>
                    <input
                      type="text"
                      value={paramKey}
                      disabled
                      className="block w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded cursor-not-allowed"
                    />
                  </div>

                  {/* Etiqueta */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t("climateDataConfig.label")}
                    </label>
                    <input
                      type="text"
                      value={param.label}
                      onChange={(e) =>
                        updateParameter(paramKey, "label", e.target.value)
                      }
                      className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("climateDataConfig.placeholders.labelExample")}
                    />
                  </div>

                  {/* Unidad - Solo para tipo number */}
                  {param.type === "number" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t("climateDataConfig.unit")}
                      </label>
                      <input
                        type="text"
                        value={param.unit}
                        onChange={(e) =>
                          updateParameter(paramKey, "unit", e.target.value)
                        }
                        className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        placeholder={t("climateDataConfig.placeholders.unitExample")}
                      />
                    </div>
                  )}

                  {/* Tipo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t("climateDataConfig.type")}
                    </label>
                    <select
                      value={param.type}
                      onChange={(e) =>
                        updateParameter(
                          paramKey,
                          "type",
                          e.target.value as "number" | "text"
                        )
                      }
                      className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="number">{t("climateDataConfig.typeNumber")}</option>
                      <option value="text">{t("climateDataConfig.typeText")}</option>
                    </select>
                  </div>

                  {/* Nombre de columna */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t("climateDataConfig.colName")}
                    </label>
                    <input
                      type="text"
                      value={param.col_name}
                      onChange={(e) =>
                        updateParameter(paramKey, "col_name", e.target.value)
                      }
                      className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("climateDataConfig.placeholders.colNameExample")}
                    />
                  </div>

                  {/* Eliminar */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeParameter(paramKey)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                    >
                      {t("actions.remove")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Formulario para agregar nuevo parámetro */}
          {isAddingParameter && (
            <div className="p-4 border-2 border-blue-200 rounded-md bg-blue-50">
              <h4 className="text-sm font-medium text-blue-900 mb-3">
                {t("climateDataConfig.addNewParameter")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("climateDataConfig.parameterKey")} *
                  </label>
                  <input
                    type="text"
                    value={newParameter.key}
                    onChange={(e) =>
                      setNewParameter({
                        ...newParameter,
                        key: e.target.value,
                      })
                    }
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("climateDataConfig.placeholders.keyExample")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("climateDataConfig.label")} *
                  </label>
                  <input
                    type="text"
                    value={newParameter.label}
                    onChange={(e) =>
                      setNewParameter({
                        ...newParameter,
                        label: e.target.value,
                      })
                    }
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("climateDataConfig.placeholders.labelExample")}
                  />
                </div>

                {/* Unidad - Solo para tipo number */}
                {newParameter.type === "number" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t("climateDataConfig.unit")}
                    </label>
                    <input
                      type="text"
                      value={newParameter.unit}
                      onChange={(e) =>
                        setNewParameter({
                          ...newParameter,
                          unit: e.target.value,
                        })
                      }
                      className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("climateDataConfig.placeholders.unitExample")}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("climateDataConfig.type")}
                  </label>
                  <select
                    value={newParameter.type}
                    onChange={(e) => {
                      const newType = e.target.value as "number" | "text";
                      setNewParameter({
                        ...newParameter,
                        type: newType,
                        // Limpiar unidad si se cambia a texto
                        unit: newType === "text" ? "" : newParameter.unit,
                      });
                    }}
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="number">{t("climateDataConfig.typeNumber")}</option>
                    <option value="text">{t("climateDataConfig.typeText")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("climateDataConfig.colName")}
                  </label>
                  <input
                    type="text"
                    value={newParameter.col_name}
                    onChange={(e) =>
                      setNewParameter({
                        ...newParameter,
                        col_name: e.target.value,
                      })
                    }
                    className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("climateDataConfig.placeholders.colNameExample")}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={addParameter}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t("actions.add")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingParameter(false);
                      setNewParameter({
                        key: "",
                        label: "",
                        unit: "",
                        type: "number",
                        col_name: "",
                      });
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t("actions.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {parameterKeys.length === 0 && !isAddingParameter && (
            <div className="text-center py-4 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50">
              {t("climateDataConfig.noParameters")}
            </div>
          )}
        </div>
      </div>

      {/* Vista previa */}
      {parameterKeys.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("preview.title")}
          </label>
          <div className="p-3 border border-gray-200 rounded-md bg-white">
            <h4 className="text-sm font-medium mb-3">
              {currentField.display_name || t("climateDataConfig.defaultTitle")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {parameterKeys.map((paramKey) => {
                const param = availableParameters[paramKey];
                return (
                  <div
                    key={paramKey}
                    className="p-2 border border-gray-100 rounded bg-gray-50"
                  >
                    <div className="text-xs text-gray-600 mb-1">
                      {param.label}
                    </div>
                    <div className="text-sm font-medium">
                      {param.type === "number" ? "25.0" : t("climateDataConfig.previewExampleValue")}
                      {param.type === "number" && param.unit && (
                        <span className="text-xs text-gray-500 ml-1">
                          {param.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {t("climateDataConfig.helpTitle")}
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• {t("climateDataConfig.helpParameter")}</li>
          <li>• {t("climateDataConfig.helpColName")}</li>
          <li>• {t("climateDataConfig.helpType")}</li>
          <li>• {t("climateDataConfig.helpUnit")}</li>
        </ul>
      </div>
    </div>
  );
};
