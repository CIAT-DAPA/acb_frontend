"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, Palette } from "lucide-react";
import {
  btnCancel,
  btnOutlineSecondary,
  btnPrimary,
  labelClass,
  labelXsClass,
  inputClass,
  inputDisabledClass,
  parameterCardClass,
  newParameterCardClass,
  helpBoxClass,
  emptyStateClass,
  btnDangerClass,
  checkboxClass,
  selectClass,
  inputXsClass,
  selectXsClass,
} from "@/app/[locale]/components/ui";
import { StyleConfig } from "@/types/core";
import { StyleConfigurator } from "../StyleConfigurator";

interface ClimateParameter {
  label: string;
  unit: string;
  type: "number" | "text";
  col_name: string;
  showName?: boolean; // Si se muestra el nombre del parámetro en el preview
  style_config?: StyleConfig; // Estilos individuales para este parámetro
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
  const t = useTranslations("CreateTemplate.fieldEditor.climateDataConfig");

  const config = (currentField.field_config as ClimateDataConfig) || {};
  const availableParameters = config.available_parameters || {};

  // Estado para nuevo parámetro
  const [newParameter, setNewParameter] = useState({
    key: "",
    label: "",
    unit: "",
    type: "number" as "number" | "text",
    col_name: "",
    showName: true,
  });

  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [expandedStyleConfig, setExpandedStyleConfig] = useState<string | null>(
    null
  );

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
        showName: true,
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
    value: string | boolean | StyleConfig
  ) => {
    const updatedParameter = {
      ...availableParameters[parameterKey],
      [field]:
        field === "showName" ? value === "true" || value === true : value,
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
          <label className={labelClass}>{t("availableParameters")}</label>
          <button
            type="button"
            onClick={() => setIsAddingParameter(true)}
            className={`${btnOutlineSecondary} text-sm`}
          >
            <Plus className="w-4 h-4 mr-1" /> {fieldT("actions.addParameter")}
          </button>
        </div>

        <div className="space-y-3">
          {/* Parámetros existentes */}
          {parameterKeys.map((paramKey) => {
            const param = availableParameters[paramKey];
            return (
              <div key={paramKey} className={parameterCardClass}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Clave del parámetro */}
                  <div>
                    <label className={labelXsClass}>{t("parameterKey")}</label>
                    <input
                      type="text"
                      value={paramKey}
                      disabled
                      className={inputDisabledClass}
                    />
                  </div>

                  {/* Etiqueta */}
                  <div>
                    <label className={labelXsClass}>{t("label")}</label>
                    <input
                      type="text"
                      value={param.label}
                      onChange={(e) =>
                        updateParameter(paramKey, "label", e.target.value)
                      }
                      className={inputXsClass}
                      placeholder={t("placeholders.labelExample")}
                    />
                  </div>

                  {/* Unidad - Solo para tipo number */}
                  {param.type === "number" && (
                    <div>
                      <label className={labelXsClass}>{t("unit")}</label>
                      <input
                        type="text"
                        value={param.unit}
                        onChange={(e) =>
                          updateParameter(paramKey, "unit", e.target.value)
                        }
                        className={inputXsClass}
                        placeholder={t("placeholders.unitExample")}
                      />
                    </div>
                  )}

                  {/* Tipo */}
                  <div>
                    <label className={labelXsClass}>{t("type")}</label>
                    <select
                      value={param.type}
                      onChange={(e) =>
                        updateParameter(
                          paramKey,
                          "type",
                          e.target.value as "number" | "text"
                        )
                      }
                      className={selectXsClass}
                    >
                      <option value="number">{t("typeNumber")}</option>
                      <option value="text">{t("typeText")}</option>
                    </select>
                  </div>

                  {/* Nombre de columna */}
                  <div>
                    <label className={labelXsClass}>{t("colName")}</label>
                    <input
                      type="text"
                      value={param.col_name}
                      onChange={(e) =>
                        updateParameter(paramKey, "col_name", e.target.value)
                      }
                      className={inputXsClass}
                      placeholder={t("placeholders.colNameExample")}
                    />
                  </div>

                  {/* Mostrar nombre en preview */}
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={param.showName !== false}
                        onChange={(e) =>
                          updateParameter(
                            paramKey,
                            "showName",
                            e.target.checked
                          )
                        }
                        className={checkboxClass}
                      />
                      <span className="text-xs text-gray-700">
                        {t("showNameInPreview")}
                      </span>
                    </label>
                  </div>

                  {/* Eliminar */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeParameter(paramKey)}
                      className={btnDangerClass}
                    >
                      {fieldT("actions.remove")}
                    </button>
                  </div>
                </div>

                {/* Estilos del parámetro */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedStyleConfig(
                        expandedStyleConfig === paramKey ? null : paramKey
                      )
                    }
                    className="flex items-center space-x-2 text-sm text-[#283618] hover:text-[#283618]/70"
                  >
                    <Palette className="w-4 h-4" />
                    <span>{t("parameterStyles")}</span>
                  </button>

                  {expandedStyleConfig === paramKey && (
                    <div className="mt-3">
                      <StyleConfigurator
                        styleConfig={param.style_config || {}}
                        onStyleChange={(newStyles) =>
                          updateParameter(paramKey, "style_config", {
                            ...param.style_config,
                            ...newStyles,
                          })
                        }
                        enabledFields={{
                          primaryColor: true,
                          fontSize: true,
                          fontWeight: true,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Formulario para agregar nuevo parámetro */}
          {isAddingParameter && (
            <div className={newParameterCardClass}>
              <h4 className="text-sm font-medium text-blue-900 mb-3">
                {t("addNewParameter")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelXsClass}>{t("parameterKey")} *</label>
                  <input
                    type="text"
                    value={newParameter.key}
                    onChange={(e) =>
                      setNewParameter({
                        ...newParameter,
                        key: e.target.value,
                      })
                    }
                    className={inputXsClass}
                    placeholder={t("placeholders.keyExample")}
                  />
                </div>

                <div>
                  <label className={labelXsClass}>{t("label")} *</label>
                  <input
                    type="text"
                    value={newParameter.label}
                    onChange={(e) =>
                      setNewParameter({
                        ...newParameter,
                        label: e.target.value,
                      })
                    }
                    className={inputXsClass}
                    placeholder={t("placeholders.labelExample")}
                  />
                </div>

                {/* Unidad - Solo para tipo number */}
                {newParameter.type === "number" && (
                  <div>
                    <label className={labelXsClass}>{t("unit")}</label>
                    <input
                      type="text"
                      value={newParameter.unit}
                      onChange={(e) =>
                        setNewParameter({
                          ...newParameter,
                          unit: e.target.value,
                        })
                      }
                      className={inputXsClass}
                      placeholder={t("placeholders.unitExample")}
                    />
                  </div>
                )}

                <div>
                  <label className={labelXsClass}>{t("type")}</label>
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
                    className={selectXsClass}
                  >
                    <option value="number">{t("typeNumber")}</option>
                    <option value="text">{t("typeText")}</option>
                  </select>
                </div>

                <div>
                  <label className={labelXsClass}>{t("colName")}</label>
                  <input
                    type="text"
                    value={newParameter.col_name}
                    onChange={(e) =>
                      setNewParameter({
                        ...newParameter,
                        col_name: e.target.value,
                      })
                    }
                    className={inputXsClass}
                    placeholder={t("placeholders.colNameExample")}
                  />
                </div>

                {/* Mostrar nombre en preview */}
                <div className="flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newParameter.showName}
                      onChange={(e) =>
                        setNewParameter({
                          ...newParameter,
                          showName: e.target.checked,
                        })
                      }
                      className={checkboxClass}
                    />
                    <span className="text-xs text-gray-700">
                      {t("showNameInPreview")}
                    </span>
                  </label>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={addParameter}
                    className={`${btnPrimary} text-sm`}
                  >
                    {fieldT("actions.add")}
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
                        showName: true,
                      });
                    }}
                    className={`${btnCancel} text-sm`}
                  >
                    {fieldT("actions.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {parameterKeys.length === 0 && !isAddingParameter && (
            <div className={emptyStateClass}>{t("noParameters")}</div>
          )}
        </div>
      </div>

      {/* Información de ayuda */}
      <div className={helpBoxClass}>
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {t("helpTitle")}
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• {t("helpParameter")}</li>
          <li>• {t("helpColName")}</li>
          <li>• {t("helpType")}</li>
          <li>• {t("helpUnit")}</li>
        </ul>
      </div>
    </div>
  );
};
