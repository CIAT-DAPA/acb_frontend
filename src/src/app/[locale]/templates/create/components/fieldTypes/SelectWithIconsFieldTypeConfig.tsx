"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, X } from "lucide-react";
import {
  btnOutlinePrimary,
  btnOutlineSecondary,
} from "@/app/[locale]/components/ui";
import { VisualResourcesService } from "../../../../../../services/visualResourcesService";
import { VisualResource } from "../../../../../../types/visualResource";

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

  // Estado para cargar iconos disponibles
  const [availableIcons, setAvailableIcons] = useState<VisualResource[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const [showIconSelectorForIndex, setShowIconSelectorForIndex] = useState<
    number | null
  >(null);

  // Cargar iconos disponibles al montar el componente
  useEffect(() => {
    const loadIcons = async () => {
      setLoadingIcons(true);
      try {
        const response = await VisualResourcesService.getAllVisualResources();
        if (response.success && response.data) {
          const icons = response.data.filter(
            (resource) =>
              resource.file_type === "icon" && resource.status === "active"
          );
          setAvailableIcons(icons);
        }
      } catch (error) {
        console.error("Error loading icons:", error);
      } finally {
        setLoadingIcons(false);
      }
    };

    loadIcons();
  }, []);

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
          {t("selectWithIconsConfig.allowMultiple")}
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {t("selectWithIconsConfig.allowMultipleHelp")}
        </p>
      </div>

      {/* Opciones e iconos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-[#283618]/70">
            {t("selectWithIconsConfig.optionsAndIcons")}
          </label>
          <button
            type="button"
            onClick={addOption}
            className={`${btnOutlineSecondary} text-sm`}
          >
            <Plus className="w-4 h-4 mr-1" /> {t("actions.addOption")}
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
                  {t("selectWithIconsConfig.optionLabel")} {index + 1}
                </label>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t("selectWithIconsConfig.optionPlaceholder")}
                />
              </div>

              {/* Selector de icono */}
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("selectWithIconsConfig.iconUrl")}
                </label>
                <div className="flex items-center space-x-2">
                  {iconsUrl[index] ? (
                    <div className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200 flex-1">
                      <img
                        src={iconsUrl[index]}
                        alt={`Icono ${index + 1}`}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/assets/img/imageNotFound.png";
                        }}
                      />
                      <span className="text-xs text-green-700 flex-1 truncate">
                        Icono seleccionado
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowIconSelectorForIndex(index)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowIconSelectorForIndex(index)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-left text-gray-500"
                    >
                      {loadingIcons
                        ? "Cargando iconos..."
                        : "Seleccionar icono"}
                    </button>
                  )}
                </div>
              </div>

              {/* Preview del icono */}
              <div className="col-span-1 flex justify-center">
                {iconsUrl[index] && (
                  <img
                    src={iconsUrl[index]}
                    alt={`Icono ${index + 1}`}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/assets/img/imageNotFound.png";
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
              {t("selectWithIconsConfig.noOptionsMessage")}
            </div>
          )}
        </div>
      </div>

      {/* Vista previa */}
      {options.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("preview.title")}
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
                    {option ||
                      `${t("selectWithIconsConfig.optionLabel")} ${index + 1}`}
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

      {/* Modal del selector de iconos */}
      {showIconSelectorForIndex !== null && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-[#283618]">
                Seleccionar Icono para Opción {showIconSelectorForIndex + 1}
              </h3>
              <button
                type="button"
                onClick={() => setShowIconSelectorForIndex(null)}
                className="text-[#283618]/50 hover:text-[#283618] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingIcons ? (
              <div className="text-center py-8 text-[#283618]/50">
                Cargando iconos disponibles...
              </div>
            ) : availableIcons.length === 0 ? (
              <div className="text-center py-8 text-amber-600">
                No hay iconos disponibles. Por favor, sube iconos en la sección
                de Recursos Visuales.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="grid grid-cols-4 gap-4 p-2">
                  {availableIcons.map((icon) => {
                    const isSelected =
                      iconsUrl[showIconSelectorForIndex] === icon.file_url;
                    return (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => {
                          updateIcon(showIconSelectorForIndex, icon.file_url);
                          setShowIconSelectorForIndex(null);
                        }}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                          ${
                            isSelected
                              ? "border-[#bc6c25] bg-[#bc6c25]/10"
                              : "border-gray-200 hover:border-[#bc6c25]/50 hover:bg-gray-50"
                          }
                        `}
                        title={icon.file_name}
                      >
                        <img
                          src={icon.file_url}
                          alt={icon.file_name}
                          className="w-16 h-16 object-contain mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/assets/img/imageNotFound.png";
                          }}
                        />
                        <span className="text-xs text-[#283618]/70 text-center truncate w-full">
                          {icon.file_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIconSelectorForIndex(null)}
                className={btnOutlineSecondary}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
