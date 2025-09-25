"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

interface SelectWithIconsFieldConfig {
  options: string[];
  icons_url: string[];
  allow_multiple?: boolean;
}

export const SelectWithIconsFieldTypeConfig: React.FC<
  BaseFieldTypeConfigProps
> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  const config =
    (currentField.field_config as SelectWithIconsFieldConfig) || {};
  const options = config.options || [];
  const iconsUrl = config.icons_url || [];

  const updateOptions = (newOptions: string[]) => {
    updateFieldConfig({
      options: newOptions,
      // Si hay menos opciones que iconos, recortar iconos
      icons_url: iconsUrl.slice(0, newOptions.length),
    });
  };

  const updateIconsUrl = (newIconsUrl: string[]) => {
    updateFieldConfig({ icons_url: newIconsUrl });
  };

  const addOption = () => {
    const newOptions = [...options, ""];
    const newIconsUrl = [...iconsUrl, ""];
    updateFieldConfig({
      options: newOptions,
      icons_url: newIconsUrl,
    });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    const newIconsUrl = iconsUrl.filter((_, i) => i !== index);
    updateFieldConfig({
      options: newOptions,
      icons_url: newIconsUrl,
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    updateOptions(newOptions);
  };

  const updateIcon = (index: number, value: string) => {
    const newIconsUrl = [...iconsUrl];
    newIconsUrl[index] = value;
    updateIconsUrl(newIconsUrl);
  };

  return (
    <div className="space-y-4">
      {/* Permitir selección múltiple */}
      <div>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={config.allow_multiple || false}
            onChange={(e) =>
              updateFieldConfig({ allow_multiple: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
          />
          {t("selectWithIconsConfig.allowMultiple", {
            default: "Permitir selección múltiple",
          })}
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {t("selectWithIconsConfig.allowMultipleHelp", {
            default:
              "Si está activado, los usuarios podrán seleccionar múltiples opciones",
          })}
        </p>
      </div>

      {/* Opciones e iconos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#283618]/70">
            {t("selectWithIconsConfig.optionsAndIcons", {
              default: "Opciones e Iconos",
            })}
          </label>
          <button
            type="button"
            onClick={addOption}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + {t("actions.addOption", { default: "Agregar Opción" })}
          </button>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 items-center p-3 border border-gray-200 rounded-md bg-gray-50"
            >
              {/* Opción */}
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Opción {index + 1}
                </label>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Texto de la opción"
                />
              </div>

              {/* URL del icono */}
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  URL del Icono
                </label>
                <input
                  type="url"
                  value={iconsUrl[index] || ""}
                  onChange={(e) => updateIcon(index, e.target.value)}
                  className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://ejemplo.com/icono.png"
                />
              </div>

              {/* Preview del icono */}
              <div className="col-span-1 flex justify-center">
                {iconsUrl[index] && (
                  <img
                    src={iconsUrl[index]}
                    alt={`Icono ${index + 1}`}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "block";
                    }}
                  />
                )}
              </div>

              {/* Eliminar */}
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={options.length <= 1}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {options.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50">
              No hay opciones definidas. Haz clic en "Agregar Opción" para
              comenzar.
            </div>
          )}
        </div>
      </div>

      {/* Vista previa */}
      {options.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("preview.title", { default: "Vista Previa" })}
          </label>
          <div className="p-3 border border-gray-200 rounded-md bg-white">
            <div className="space-y-2">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 border border-gray-100 rounded hover:bg-gray-50"
                >
                  {iconsUrl[index] && (
                    <img
                      src={iconsUrl[index]}
                      alt={option}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><text y="15" font-size="12">❓</text></svg>';
                      }}
                    />
                  )}
                  <span className="text-sm">
                    {option || `Opción ${index + 1}`}
                  </span>
                  {config.allow_multiple && (
                    <input type="checkbox" className="ml-auto" disabled />
                  )}
                  {!config.allow_multiple && (
                    <input
                      type="radio"
                      name="preview"
                      className="ml-auto"
                      disabled
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
